'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/rbac';
import { action } from '@/lib/auth/action';
import { logAudit } from '@/lib/audit';
import type { Result } from '@/lib/result';
import { ActionError } from '@/lib/result';
import type { Database } from '@/types/database.types';
import { moderateCentreSchema, moderateReviewSchema, resolveReportSchema, moderateClaimSchema, setUserRoleSchema } from './schema';
import { notifyCentreDecision } from '@/features/notifications/notify';
import { getUserEmail } from '@/lib/email';

type ListingStatus = Database['public']['Enums']['listing_status'];

const DECISION_TO_STATUS: Record<string, ListingStatus> = {
  approve: 'approved',
  reject: 'rejected',
  suspend: 'suspended',
  restore: 'approved',
  archive: 'archived',
};

/** Approve / reject / suspend / restore / archive a listing. Admin only, audited. */
export async function moderateCentre(raw: unknown): Promise<Result<{ status: ListingStatus }>> {
  return action(moderateCentreSchema, raw, async (input) => {
    const admin = await requireRole('admin');
    const db = await createClient();
    const status = DECISION_TO_STATUS[input.decision]!;

    // Owner must be told the outcome — fetch before the update so we have the
    // owner even if the row changes.
    const { data: centre } = await db
      .from('centres')
      .select('owner_id, name')
      .eq('id', input.centreId)
      .maybeSingle();

    const { error } = await db
      .from('centres')
      .update({
        status,
        rejection_reason: input.decision === 'reject' ? (input.reason ?? null) : null,
        admin_notes: input.reason ?? null,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', input.centreId);
    if (error) throw error;

    // Notify the owner for decisions that change their listing's visibility.
    if (centre?.owner_id && (input.decision === 'approve' || input.decision === 'reject' || input.decision === 'suspend')) {
      const email = await getUserEmail(centre.owner_id);
      await notifyCentreDecision(centre.owner_id, input.decision, {
        email,
        centreName: centre.name ?? undefined,
        reason: input.decision === 'reject' ? (input.reason ?? null) : null,
      });
    }

    await logAudit(`centre.${input.decision}`, 'centre', input.centreId, { reason: input.reason });
    revalidatePath('/admin/centres');
    revalidatePath('/centres');
    return { status };
  });
}

/** Publish or remove a review. Admin only, audited. */
export async function moderateReview(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(moderateReviewSchema, raw, async (input) => {
    await requireRole('admin');
    const db = await createClient();
    const status = input.decision === 'publish' ? 'published' : 'removed';

    const { error } = await db.from('reviews').update({ status }).eq('id', input.reviewId);
    if (error) throw error;

    await logAudit(`review.${input.decision}`, 'review', input.reviewId);
    revalidatePath('/admin/reviews');
    return { ok: true as const };
  });
}

/** Mark a review report resolved. Admin only, audited. */
export async function resolveReport(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(resolveReportSchema, raw, async (input) => {
    await requireRole('admin');
    const db = await createClient();

    const { error } = await db.from('review_reports').update({ resolved: true }).eq('id', input.reportId);
    if (error) throw error;

    await logAudit('report.resolve', 'review_report', input.reportId);
    revalidatePath('/admin/reviews');
    return { ok: true as const };
  });
}

/** Approve (atomic, transfers ownership via approve_claim) or reject a claim. */
export async function moderateClaim(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(moderateClaimSchema, raw, async (input) => {
    await requireRole('admin');
    const db = await createClient();

    if (input.decision === 'approve') {
      const { error } = await db.rpc('approve_claim', { p_claim_id: input.claimId });
      if (error) {
        if (error.message.includes('CLAIM_NOT_PENDING')) throw new ActionError('CONFLICT', 'This claim is no longer pending.');
        if (error.message.includes('FORBIDDEN')) throw new ActionError('FORBIDDEN', 'Admins only.');
        throw error;
      }
    } else {
      const { error } = await db.from('listing_claims').update({ status: 'rejected' }).eq('id', input.claimId);
      if (error) throw error;
      await logAudit('claim.reject', 'listing_claim', input.claimId);
    }

    revalidatePath('/admin/claims');
    return { ok: true as const };
  });
}

/**
 * Change a user's role. Admin-only; enforced twice — requireRole('admin') here
 * AND the SECURITY DEFINER admin_set_user_role() which re-checks and applies
 * guardrails (can't demote the last admin). Audited in the DB function.
 */
export async function setUserRole(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(setUserRoleSchema, raw, async (input) => {
    await requireRole('admin');
    const db = await createClient();
    const { error } = await db.rpc('admin_set_user_role', { p_user: input.userId, p_role: input.role });
    if (error) {
      if (error.message.includes('CONFLICT')) throw new ActionError('CONFLICT', 'Cannot demote the last admin.');
      if (error.message.includes('FORBIDDEN')) throw new ActionError('FORBIDDEN', 'Admin only.');
      throw error;
    }
    revalidatePath('/admin/users');
    return { ok: true as const };
  });
}
