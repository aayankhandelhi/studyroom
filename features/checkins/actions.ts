'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/rbac';
import { action } from '@/lib/auth/action';
import { ActionError, type Result } from '@/lib/result';
import { z } from 'zod';

const checkInSchema = z.object({ centreId: z.string().uuid() });

/**
 * Check in to a centre. One open check-in per user at a time (checking in while
 * already inside is rejected). This single timestamp powers occupancy, streaks
 * and verified reviews — the core data loop.
 */
export async function checkIn(raw: unknown): Promise<Result<{ id: string }>> {
  return action(checkInSchema, raw, async (input) => {
    const user = await requireUser();
    const db = await createClient();

    const { data: open } = await db.from('check_ins')
      .select('id').eq('user_id', user.id).is('checked_out_at', null).maybeSingle();
    if (open) throw new ActionError('CONFLICT', 'You’re already checked in somewhere. Check out first.');

    const { data, error } = await db.from('check_ins')
      .insert({ centre_id: input.centreId, user_id: user.id })
      .select('id').single();
    if (error) throw error;

    revalidatePath('/centres');
    return { id: data.id };
  });
}

/** Check out (closes the open check-in). */
export async function checkOut(): Promise<Result<{ ok: true }>> {
  return action(z.object({}), {}, async () => {
    const user = await requireUser();
    const db = await createClient();
    const { error } = await db.from('check_ins')
      .update({ checked_out_at: new Date().toISOString() })
      .eq('user_id', user.id).is('checked_out_at', null);
    if (error) throw error;
    revalidatePath('/centres');
    return { ok: true as const };
  });
}
