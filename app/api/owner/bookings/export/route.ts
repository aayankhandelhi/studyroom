import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/rbac';
import { getOwnerBookings } from '@/features/owner/services/bookings.service';
import { toCsv, toXlsx, type ExportRow } from '@/lib/booking-export';

/** Export the owner's bookings as CSV. Owner/admin only; scoped to own centres. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (user.role !== 'owner' && user.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const scope = (new URL(req.url).searchParams.get('scope') as 'today' | 'upcoming' | 'all') ?? 'all';
  const db = await createClient();
  const rows = await getOwnerBookings(db, user.id, scope, 2000);

  const exportRows: ExportRow[] = rows.map((b) => ({
    student: b.student?.full_name ?? 'Guest', centre: b.centre?.name ?? '', period: b.period,
    amount: Number(b.amount), status: b.status, payment: b.payment, starts_at: b.starts_at,
  }));
  const date = new Date().toISOString().slice(0, 10);
  if (new URL(req.url).searchParams.get('format') === 'xlsx') {
    return new NextResponse(new Uint8Array(toXlsx(exportRows)), {
      headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="my-bookings-${date}.xlsx"` },
    });
  }
  return new NextResponse(toCsv(exportRows), {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="my-bookings-${date}.csv"` },
  });
}
