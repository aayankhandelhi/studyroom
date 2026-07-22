'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/rbac';
import { ok, err, type Result } from '@/lib/result';

/**
 * Mark the current user's notifications as read. With no id, marks all unread.
 * RLS ("notif self update") ensures a user can only touch their own rows.
 */
export async function markNotificationsRead(id?: string): Promise<Result<{ ok: true }>> {
  try {
    const user = await requireUser();
    const db = await createClient();
    let q = db.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    if (id) q = q.eq('id', id);
    const { error } = await q;
    if (error) return err('INTERNAL', error.message);
    revalidatePath('/account/notifications');
    return ok({ ok: true as const });
  } catch (e) {
    return err('INTERNAL', String(e));
  }
}
