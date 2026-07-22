'use client';
import { useState, useTransition } from 'react';
import { reportReview } from '../actions';

/** Inline "report" control for a single review. Collapses to a confirmation. */
export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <span className="text-xs text-muted-foreground">Reported ✓</span>;

  if (!open) {
    return (
      <button className="text-xs text-muted-foreground hover:text-foreground hover:underline" onClick={() => setOpen(true)}>
        Report
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        aria-label="Reason for report"
        className="h-8 w-40 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        className="text-xs font-semibold text-destructive disabled:opacity-50"
        disabled={pending || reason.trim().length < 3}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await reportReview({ reviewId, reason });
            if (res.ok) setDone(true);
            else setError(res.error.message);
          })
        }
      >
        {pending ? 'Sending…' : 'Submit'}
      </button>
      <button className="text-xs text-muted-foreground" onClick={() => setOpen(false)}>Cancel</button>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
