'use client';
import { useTransition } from 'react';
import { markNotificationsRead } from '@/features/notifications/actions';

/** Button to mark all of the user's notifications as read. */
export function MarkAllRead() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await markNotificationsRead(); })}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
    >
      {pending ? 'Marking…' : 'Mark all read'}
    </button>
  );
}
