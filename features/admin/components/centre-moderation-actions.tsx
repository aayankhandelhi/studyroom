'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { moderateCentre } from '../actions';

/**
 * Approve / reject a pending listing. Reject requires a reason (stored + shown
 * to the owner). Optimistic-free: waits for the Result, surfaces errors inline.
 */
export function CentreModerationActions({ centreId }: { centreId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = (decision: 'approve' | 'reject') => {
    setError(null);
    startTransition(async () => {
      const res = await moderateCentre({ centreId, decision, reason: decision === 'reject' ? reason : undefined });
      if (!res.ok) { setError(res.error.message); return; }
      router.refresh();
    });
  };

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (shown to owner)"
          className="h-9 w-64"
          aria-label="Rejection reason"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" disabled={pending || reason.trim().length < 3} onClick={() => run('reject')}>
            {pending ? 'Rejecting…' : 'Confirm reject'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
        </div>
        {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={pending} onClick={() => run('approve')}>{pending ? 'Approving…' : 'Approve'}</Button>
      <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>Reject</Button>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
