'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { moderateReview, resolveReport } from '../actions';

/** Remove a review (and resolve the report) or keep it (resolve only). */
export function ReviewModerationActions({ reviewId, reportId }: { reviewId: string; reportId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const act = (decision: 'remove' | 'keep') => {
    setError(null);
    startTransition(async () => {
      if (decision === 'remove') {
        const res = await moderateReview({ reviewId, decision: 'remove' });
        if (!res.ok) { setError(res.error.message); return; }
      }
      const resolved = await resolveReport({ reportId });
      if (!resolved.ok) { setError(resolved.error.message); return; }
      router.refresh();
    });
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => act('remove')}>Remove</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => act('keep')}>Keep</Button>
      </div>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
