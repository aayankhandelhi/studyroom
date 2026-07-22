'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { admin } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/rbac';
import { action } from '@/lib/auth/action';
import { ActionError, type Result } from '@/lib/result';
import { notifyBooking } from '@/features/notifications/notify';
import { getUserEmail } from '@/lib/email';

const idSchema = z.object({ id: z.string().uuid() });
const statusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(['checked_in', 'no_show', 'completed', 'confirmed']),
});

/** Ownership guard: admin, or the owner of the centre a resource/booking belongs to. */
async function assertCentreAccess(db: Awaited<ReturnType<typeof createClient>>, userId: string, role: string, centreId: string) {
  if (role === 'admin') return;
  const { data } = await db.from('centres').select('owner_id').eq('id', centreId).maybeSingle();
  if (data?.owner_id !== userId) throw new ActionError('FORBIDDEN', 'You don’t manage this centre.');
}

/** Promote the next waiting student for a resource. Reuses promote_waitlist(). */
export async function promoteWaitlist(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(z.object({ resourceId: z.string().uuid() }), raw, async (input) => {
    const user = await requireRole('admin', 'owner');
    const db = await createClient();
    const { data: res } = await db.from('resources').select('centre_id').eq('id', input.resourceId).maybeSingle();
    if (!res) throw new ActionError('NOT_FOUND', 'Resource not found.');
    await assertCentreAccess(db, user.id, user.role, res.centre_id);

    const { error } = await db.rpc('promote_waitlist', { p_resource_id: input.resourceId });
    if (error) throw error;
    revalidatePath('/admin/waitlist');
    return { ok: true as const };
  });
}

/** Expire a single waitlist entry (offer lapsed). */
export async function expireWaitlistEntry(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(idSchema, raw, async (input) => {
    const user = await requireRole('admin', 'owner');
    const db = await createClient();
    const { data: entry } = await db.from('waitlist_entries')
      .select('id, resource_id, resources(centre_id)').eq('id', input.id).maybeSingle();
    if (!entry) throw new ActionError('NOT_FOUND', 'Entry not found.');
    const centreId = (entry as unknown as { resources: { centre_id: string } }).resources.centre_id;
    await assertCentreAccess(db, user.id, user.role, centreId);

    const { error } = await admin.from('waitlist_entries').update({ status: 'expired' }).eq('id', input.id);
    if (error) throw error;
    revalidatePath('/admin/waitlist');
    return { ok: true as const };
  });
}

/** Remove (cancel) a waitlist entry entirely. */
export async function removeWaitlistEntry(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(idSchema, raw, async (input) => {
    const user = await requireRole('admin', 'owner');
    const db = await createClient();
    const { data: entry } = await db.from('waitlist_entries')
      .select('id, resources(centre_id)').eq('id', input.id).maybeSingle();
    if (!entry) throw new ActionError('NOT_FOUND', 'Entry not found.');
    const centreId = (entry as unknown as { resources: { centre_id: string } }).resources.centre_id;
    await assertCentreAccess(db, user.id, user.role, centreId);

    const { error } = await admin.from('waitlist_entries').update({ status: 'cancelled' }).eq('id', input.id);
    if (error) throw error;
    revalidatePath('/admin/waitlist');
    return { ok: true as const };
  });
}

/** Staff update of a booking's lifecycle status (check-in / no-show / complete). */
export async function updateBookingStatus(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(statusSchema, raw, async (input) => {
    const user = await requireRole('admin', 'owner');
    const db = await createClient();
    const { data: bk } = await db.from('bookings').select('id, centre_id, status').eq('id', input.bookingId).maybeSingle();
    if (!bk) throw new ActionError('NOT_FOUND', 'Booking not found.');
    await assertCentreAccess(db, user.id, user.role, bk.centre_id);
    if (['cancelled', 'refunded', 'expired'].includes(bk.status))
      throw new ActionError('CONFLICT', 'This booking is closed and can’t be updated.');

    const patch: Record<string, unknown> = { status: input.status };
    if (input.status === 'checked_in') patch.checked_in_at = new Date().toISOString();
    if (input.status === 'completed') patch.completed_at = new Date().toISOString();

    const { error } = await admin.from('bookings').update(patch as never).eq('id', input.bookingId);
    if (error) throw error;

    // Audit + notify (reuses existing notifications table).
    await db.rpc('log_audit', {
      p_action: `booking.${input.status}`, p_entity_type: 'booking', p_entity_id: bk.id, p_metadata: { by: user.id },
    });

    // Notify the student for events they care about.
    if (input.status === 'no_show' || input.status === 'completed' || input.status === 'confirmed') {
      const { data: bu } = await admin.from('bookings').select('user_id').eq('id', bk.id).maybeSingle();
      if (bu?.user_id) {
        const email = await getUserEmail(bu.user_id);
        await notifyBooking(bu.user_id, input.status === 'confirmed' ? 'confirmed' : input.status, { email });
      }
    }
    revalidatePath('/admin/bookings');
    revalidatePath('/owner');
    return { ok: true as const };
  });
}
