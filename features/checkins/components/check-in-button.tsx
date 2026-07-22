'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { checkIn, checkOut } from '../actions';

/**
 * Check-in / check-out control. `inHere` = user has an open check-in AT this
 * centre; `busyElsewhere` = open check-in at a different centre.
 */
export function CheckInButton({ centreId, inHere, busyElsewhere }: { centreId: string; inHere: boolean; busyElsewhere: boolean }) {
  const [state, setState] = useState<'in' | 'out'>(inHere ? 'in' : 'out');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const act = () =>
    start(async () => {
      setError(null);
      const res = state === 'in' ? await checkOut() : await checkIn({ centreId });
      if (!res.ok) { setError(res.error.message); return; }
      setState(state === 'in' ? 'out' : 'in');
    });

  if (busyElsewhere && state === 'out') {
    return <p className="text-xs text-muted-foreground">You’re checked in at another centre. Check out there first.</p>;
  }

  return (
    <div>
      <Button variant={state === 'in' ? 'outline' : 'default'} disabled={pending} onClick={act}>
        {pending ? '…' : state === 'in' ? 'Check out' : 'Check in'}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}
