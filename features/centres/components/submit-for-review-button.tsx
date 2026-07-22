'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { submitForReview } from '../actions';

export function SubmitForReviewButton({ centreId }: { centreId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button size="sm" disabled={pending} onClick={() => start(async () => {
        setError(null);
        const res = await submitForReview({ centreId });
        if (!res.ok) { setError(res.error.message); return; }
        router.refresh();
      })}>{pending ? 'Submitting…' : 'Submit for review'}</Button>
      {error && <p role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
