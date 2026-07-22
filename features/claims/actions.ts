'use server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/rbac';
import { action } from '@/lib/auth/action';
import { ActionError, type Result } from '@/lib/result';
import { claimSchema } from './schema';

/**
 * File a claim to own an existing listing. Admin reviews it (see /admin).
 * Unique (centre_id, claimant_id) blocks duplicate claims; RLS requires
 * claimant_id = auth.uid().
 */
export async function submitClaim(raw: unknown): Promise<Result<{ id: string }>> {
  return action(claimSchema, raw, async (input) => {
    const user = await requireUser();
    const db = await createClient();

    const { data, error } = await db.from('listing_claims').insert({
      centre_id: input.centreId,
      claimant_id: user.id,
      evidence: input.evidence,
    }).select('id').single();

    if (error) {
      if (error.code === '23505') throw new ActionError('CONFLICT', 'You’ve already submitted a claim for this centre.');
      throw error;
    }
    return { id: data.id };
  });
}
