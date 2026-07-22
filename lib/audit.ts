import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Append an audit entry via the SECURITY DEFINER `log_audit` function so the
 * actor is captured from the session and writes bypass table RLS safely.
 * Charter §Admin: audit admin + security-sensitive actions.
 */
export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const db = await createClient();
  const { error } = await db.rpc('log_audit', {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata as import('@/types/database.types').Json,
  });
  if (error) console.error('[audit] failed', action, error.message);
}
