'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const STATUSES = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show', 'expired', 'refunded'];
const SORTS = [['created', 'Newest'], ['starts', 'Start date'], ['payment', 'Payment']] as const;

/** URL-driven filters — server component re-queries on navigation. */
export function BookingFilters({ q, status, sort }: { q?: string; status?: string; sort?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState(q ?? '');

  function apply(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v); else sp.delete(k);
    }
    router.push(`/admin/bookings?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => { e.preventDefault(); apply({ q: text || undefined }); }}
        className="flex-1 min-w-[200px]"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search centre or student…"
          aria-label="Search bookings"
        />
      </form>

      <select
        value={status ?? ''}
        onChange={(e) => apply({ status: e.target.value || undefined })}
        aria-label="Filter by status"
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>

      <select
        value={sort ?? 'created'}
        onChange={(e) => apply({ sort: e.target.value })}
        aria-label="Sort bookings"
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      <a
        href={`/api/admin/bookings/export?${params.toString()}`}
        className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-secondary"
      >
        Export CSV
      </a>
      <a
        href={`/api/admin/bookings/export?${params.toString()}&format=xlsx`}
        className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-secondary"
      >
        Export Excel
      </a>
    </div>
  );
}
