'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateBookingStatus } from '@/features/admin/waitlist.actions';

const NEXT: Record<string, { label: string; status: 'checked_in' | 'no_show' | 'completed' }[]> = {
  confirmed: [{ label: 'Check in', status: 'checked_in' }, { label: 'No-show', status: 'no_show' }],
  pending: [{ label: 'No-show', status: 'no_show' }],
  checked_in: [{ label: 'Complete', status: 'completed' }],
};

/** Owner-facing check-in / no-show / complete. Reuses updateBookingStatus
 * (which authorizes owner-of-centre server-side). */
export function OwnerBookingRowActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const options = NEXT[status] ?? [];
  if (options.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

  function set(next: 'checked_in' | 'no_show' | 'completed') {
    start(async () => {
      const res = await updateBookingStatus({ bookingId, status: next });
      if (res.ok) router.refresh();
    });
  }
  return (
    <span className="flex gap-1.5">
      {options.map((o) => (
        <button key={o.status} onClick={() => set(o.status)} disabled={pending}
          className="rounded border px-2 py-1 text-xs font-semibold hover:bg-secondary disabled:opacity-50">{o.label}</button>
      ))}
    </span>
  );
}
