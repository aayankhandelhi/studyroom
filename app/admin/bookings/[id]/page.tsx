import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/rbac';
import { noindex } from '@/lib/seo';
import { formatINR } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/booking-status-badge';
import { getBookingDetail, getStudentSummary, getCentreSummary } from '@/features/admin/services/bookings.service';
import { BookingActions } from '@/features/admin/components/booking-actions';
import { BookingStatusControls } from '@/features/admin/components/booking-status-controls';

export const metadata: Metadata = { title: 'Booking · Admin', ...noindex };

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  const db = await createClient();
  const b = await getBookingDetail(db, id);
  if (!b) notFound();

  const [student, centre] = await Promise.all([
    getStudentSummary(db, b.user_id),
    getCentreSummary(db, b.centre_id),
  ]);

  const refundable = ['paid', 'partially_refunded'].includes(b.payment);
  const cancellable = ['pending', 'confirmed', 'checked_in'].includes(b.status);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:underline">← All bookings</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold">{b.centre?.name ?? 'Booking'}</h1>
        <div className="flex gap-2"><BookingStatusBadge status={b.status} /><PaymentStatusBadge status={b.payment} /></div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-display text-sm font-bold">Details</h2>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Student</dt><dd>{b.student?.full_name ?? 'Guest'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Period</dt><dd className="capitalize">{b.period}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Amount</dt><dd>{formatINR(Number(b.amount))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Starts</dt><dd>{new Date(b.starts_at).toLocaleString()}</dd></div>
            {b.cancel_reason && <div className="flex justify-between"><dt className="text-muted-foreground">Cancel reason</dt><dd>{b.cancel_reason}</dd></div>}
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-sm font-bold">Payment</h2>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Order ID</dt><dd className="font-mono text-xs">{b.razorpay_order_id ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Payment ID</dt><dd className="font-mono text-xs">{b.razorpay_payment_id ?? '—'}</dd></div>
          </dl>
          {b.refunds.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Refund history</p>
              {b.refunds.map((r) => (
                <p key={r.id} className="mt-1 text-sm">{formatINR(Number(r.amount))} · {r.status} · {new Date(r.created_at).toLocaleDateString()}</p>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Management actions — reuse existing lifecycle server actions */}
      <Card className="mt-4 p-4">
        <h2 className="font-display text-sm font-bold">Manage</h2>
        <BookingStatusControls bookingId={b.id} status={b.status} />
        <BookingActions bookingId={b.id} refundable={refundable} cancellable={cancellable} maxAmount={Number(b.amount)} />
      </Card>

      {/* Student + centre summaries */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-display text-sm font-bold">Student</h2>
          <p className="mt-2 text-sm font-semibold">{student.fullName ?? 'Guest'}</p>
          {student.email && (
            <p className="text-sm text-muted-foreground">
              <a href={`mailto:${student.email}`} className="hover:underline">{student.email}</a>
            </p>
          )}
          {student.phone && <p className="text-sm text-muted-foreground">{student.phone}</p>}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-muted-foreground">Bookings</dt><dd className="font-semibold">{student.totalBookings}</dd></div>
            <div><dt className="text-muted-foreground">Cancellations</dt><dd className="font-semibold">{student.cancellations}</dd></div>
            <div><dt className="text-muted-foreground">No-shows</dt><dd className="font-semibold">{student.noShows}</dd></div>
            <div><dt className="text-muted-foreground">Reviews</dt><dd className="font-semibold">{student.reviews}</dd></div>
          </dl>
        </Card>
        {centre && (
          <Card className="p-4">
            <h2 className="font-display text-sm font-bold">Centre</h2>
            <p className="mt-2 text-sm font-semibold">{centre.name}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-muted-foreground">Capacity</dt><dd className="font-semibold">{centre.capacity}</dd></div>
              <div><dt className="text-muted-foreground">Seats free</dt><dd className="font-semibold">{centre.seatsFree}</dd></div>
              <div><dt className="text-muted-foreground">Occupancy</dt><dd className="font-semibold">{centre.occupancyPct}%</dd></div>
              <div><dt className="text-muted-foreground">Waitlist</dt><dd className="font-semibold">{centre.waitlistCount}</dd></div>
              <div><dt className="text-muted-foreground">Total bookings</dt><dd className="font-semibold">{centre.totalBookings}</dd></div>
            </dl>
          </Card>
        )}
      </div>

      {/* Timeline from audit log */}
      <Card className="mt-4 p-4">
        <h2 className="font-display text-sm font-bold">Timeline</h2>
        <ol className="mt-3 space-y-3">
          <li className="flex gap-3 text-sm">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
            <span><span className="font-semibold">Created</span> · {new Date(b.created_at).toLocaleString()}</span>
          </li>
          {b.audit.map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
              <span><span className="font-semibold">{a.action.replace('booking.', '')}</span> · {new Date(a.created_at).toLocaleString()}</span>
            </li>
          ))}
          {b.audit.length === 0 && <li className="text-sm text-muted-foreground">No lifecycle events yet.</li>}
        </ol>
      </Card>
    </div>
  );
}
