'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { promoteWaitlist, expireWaitlistEntry, removeWaitlistEntry } from '@/features/admin/waitlist.actions';

interface Entry { id: string; position: number; period: string; created_at: string; student: { full_name: string | null } | null }

/** Reuses promoteWaitlist / expire / remove Server Actions. No logic duplicated. */
export function WaitlistControls({ resourceId, canPromote, entries }: { resourceId: string; canPromote: boolean; entries: Entry[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    start(async () => {
      const res = await fn();
      setMsg(res.ok ? 'Done.' : res.error?.message ?? 'Failed.');
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="mt-3">
      {canPromote && (
        <button
          onClick={() => run(() => promoteWaitlist({ resourceId }))}
          disabled={pending}
          className="mb-3 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Promote next student
        </button>
      )}
      <ol className="divide-y">
        {entries.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span>
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-bold">{e.position}</span>
              {e.student?.full_name ?? 'Student'} · {e.period} · joined {new Date(e.created_at).toLocaleDateString()}
            </span>
            <span className="flex gap-2">
              <button onClick={() => run(() => expireWaitlistEntry({ id: e.id }))} disabled={pending}
                className="rounded border px-2 py-1 text-xs font-semibold disabled:opacity-50">Expire</button>
              <button onClick={() => run(() => removeWaitlistEntry({ id: e.id }))} disabled={pending}
                className="rounded border border-[hsl(4,64%,44%)]/40 px-2 py-1 text-xs font-semibold text-[hsl(4,64%,40%)] disabled:opacity-50">Remove</button>
            </span>
          </li>
        ))}
      </ol>
      {msg && <p className="mt-2 text-xs text-muted-foreground" role="status">{msg}</p>}
    </div>
  );
}
