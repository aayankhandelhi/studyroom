import 'server-only';
import type { Database } from '@/types/database.types';

type DB = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;

export interface EnquiryRow {
  id: string; name: string; email: string; phone: string | null;
  message: string; status: Database['public']['Enums']['enquiry_status']; created_at: string;
}

/** Enquiries for a centre the caller owns (RLS enforces ownership). */
export async function getCentreEnquiries(db: DB, centreId: string): Promise<EnquiryRow[]> {
  const { data, error } = await db
    .from('enquiries')
    .select('id, name, email, phone, message, status, created_at')
    .eq('centre_id', centreId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}
