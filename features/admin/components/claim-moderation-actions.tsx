'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { moderateClaim } from '../actions';

export function ClaimModerationActions({ claimId, alreadyOwned }: { claimId: string; alreadyOwned: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOwned, setConfirmOwned] = useState(false);

  const act = (decision: 'approve' | 'reject') =>
    start(async () => {
      setError(null);
      const res = await moderateClaim({ claimId, decision });
      if (!res.ok) { setError(res.error.message); return; }
      router.refresh();
    });

  // Approving a claim on an already-owned centre reassigns ownership — confirm.
  if (alreadyOwned && !confirmOwned) {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Button size="sm" variant="outline" onClick={() => setConfirmOwned(true)}>Review</Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => act('reject')}>Reject</Button>
        {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => act('approve')}>
          {alreadyOwned ? 'Reassign & approve' : 'Approve'}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => act('reject')}>Reject</Button>
      </div>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
