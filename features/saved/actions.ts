'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/rbac';
import { action } from '@/lib/auth/action';
import type { Result } from '@/lib/result';
import { z } from 'zod';

const toggleSchema = z.object({ centreId: z.string().uuid(), save: z.boolean() });

/**
 * Save or unsave a listing. Idempotent: the PK (user_id, centre_id) makes a
 * second save a no-op (no duplicates); unsave deletes. Strictly self via RLS.
 */
export async function toggleSaved(raw: unknown): Promise<Result<{ saved: boolean }>> {
  return action(toggleSchema, raw, async (input) => {
    const user = await requireUser();
    const db = await createClient();

    if (input.save) {
      const { error } = await db.from('saved_listings').upsert(
        { user_id: user.id, centre_id: input.centreId },
        { onConflict: 'user_id,centre_id', ignoreDuplicates: true },
      );
      if (error) throw error;
    } else {
      const { error } = await db.from('saved_listings').delete()
        .eq('user_id', user.id).eq('centre_id', input.centreId);
      if (error) throw error;
    }
    revalidatePath('/saved');
    return { saved: input.save };
  });
}
