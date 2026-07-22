'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelBooking } from '@/features/bookings/actions';
import { refundBooking } from '@/features/bookings/refund.actions';

/** Reuses the existing lifecycle Server Actions — no business logic duplicated. */
export function BookingActions({
  bookingId, refundable, cancellable, maxAmount,
}: { bookingId: string; refundable: boolean; cancellable: boolean; maxAmount: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');

  function onCancel() {
    start(async () => {
      const res = await cancelBooking({ bookingId, reason });
      setMsg(res.ok ? 'Booking cancelled.' : res.error.message);
      if (res.ok) router.refresh();
    });
  }
  function onRefund() {
    start(async () => {
      const res = await refundBooking({ bookingId, reason, amount: amount ? Number(amount) : undefined });
      setMsg(res.ok ? 'Refund processed.' : res.error.message);
      if (res.ok) router.refresh();
    });
  }

  if (!cancellable && !refundable) return <p className="mt-2 text-sm text-muted-foreground">No actions available for this booking.</p>;

  return (
    <div className="mt-3 space-y-3">
      <input
        value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)" aria-label="Reason"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        {cancellable && (
          <button onClick={onCancel} disabled={pending}
            className="rounded-md border border-[hsl(4,64%,44%)]/40 px-3 py-2 text-sm font-semibold text-[hsl(4,64%,40%)] disabled:opacity-50">
            Cancel booking
          </button>
        )}
        {refundable && (
          <>
            <input
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={`Amount (max ${maxAmount})`} inputMode="decimal" aria-label="Refund amount"
              className="w-40 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <button onClick={onRefund} disabled={pending}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {amount ? 'Partial refund' : 'Full refund'}
            </button>
          </>
        )}
      </div>
      {msg && <p className="text-sm text-muted-foreground" role="status">{msg}</p>}
    </div>
  );
}
