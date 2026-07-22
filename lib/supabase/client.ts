import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

// NEXT_PUBLIC_* are inlined at build time. Guard with a clear message so a
// misconfigured build fails obviously rather than with an opaque network error.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  throw new Error('[env] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.');
}

/** Browser client for Client Components. */
export const createClient = () => createBrowserClient<Database>(url, anon);
