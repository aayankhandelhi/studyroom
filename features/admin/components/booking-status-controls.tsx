'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateBookingStatus } from '@/features/admin/waitlist.actions';

const NEXT: Record<string, { label: string; status: 'checked_in' | 'no_show' | 'completed' }[]> = {
  confirmed: [{ label: 'Check in', status: 'checked_in' }, { label: 'No-show', status: 'no_show' }],
  pending: [{ label: 'No-show', status: 'no_show' }],
  checked_in: [{ label: 'Mark complete', status: 'completed' }],
};

/** Staff lifecycle transitions — reuses updateBookingStatus. */
export function BookingStatusControls({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const options = NEXT[status] ?? [];
  if (options.length === 0) return null;

  function set(next: 'checked_in' | 'no_show' | 'completed') {
    start(async () => {
      const res = await updateBookingStatus({ bookingId, status: next });
      setMsg(res.ok ? 'Updated.' : res.error.message);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button key={o.status} onClick={() => set(o.status)} disabled={pending}
          className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50">{o.label}</button>
      ))}
      {msg && <span className="text-sm text-muted-foreground" role="status">{msg}</span>}
    </div>
  );
}
