import { NextResponse, type NextRequest } from 'next/server';
import { admin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * Scheduled job: expire stale pending booking holds. Calls the existing
 * expire_pending_bookings() DB function. Invoked by Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET so only the scheduler can trigger it.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { data, error } = await admin.rpc('expire_pending_bookings');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, expired: data ?? 0 });
}
