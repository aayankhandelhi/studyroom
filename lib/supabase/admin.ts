import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { env, serviceRoleKey } from '@/lib/env';

/**
 * Service-role client. SERVER-ONLY, bypasses RLS. Use only in trusted contexts
 * (webhooks, cron, admin actions) after an explicit RBAC check.
 */
export const admin = createClient<Database>(
  env.SUPABASE_URL,
  serviceRoleKey(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
