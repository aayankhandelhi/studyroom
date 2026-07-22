import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/rbac';
import { searchBookings, BOOKING_STATUSES, type BookingStatus } from '@/features/admin/services/bookings.service';
import { toCsv, toXlsx, type ExportRow } from '@/lib/booking-export';

/** Export the current booking view as CSV. Admin-only. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const status = (BOOKING_STATUSES as readonly string[]).includes(url.searchParams.get('status') ?? '')
    ? (url.searchParams.get('status') as BookingStatus)
    : undefined;

  const db = await createClient();
  const { rows } = await searchBookings(db, {
    q: url.searchParams.get('q') ?? undefined,
    status,
    sort: (url.searchParams.get('sort') as 'created' | 'starts' | 'payment') ?? 'created',
    limit: 1000,
  });

  const exportRows: ExportRow[] = rows.map((b) => ({
    student: b.student?.full_name ?? 'Guest', centre: b.centre?.name ?? '', period: b.period,
    amount: Number(b.amount), status: b.status, payment: b.payment, starts_at: b.starts_at, created_at: b.created_at,
  }));
  const date = new Date().toISOString().slice(0, 10);

  if (url.searchParams.get('format') === 'xlsx') {
    return new NextResponse(new Uint8Array(toXlsx(exportRows)), {
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="bookings-${date}.xlsx"`,
      },
    });
  }
  return new NextResponse(toCsv(exportRows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="bookings-${date}.csv"`,
    },
  });
}
