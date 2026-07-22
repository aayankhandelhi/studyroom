'use client';
import { useState, useTransition } from 'react';
import { toggleSaved } from '../actions';
import { cn } from '@/lib/utils';

/**
 * Save/unsave toggle. Optimistic — flips immediately, rolls back if the server
 * Result is an error. `initialSaved` comes from the server (isSaved).
 */
export function SaveButton({ centreId, initialSaved }: { centreId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();

  const toggle = () => {
    const next = !saved;
    setSaved(next); // optimistic
    start(async () => {
      const res = await toggleSaved({ centreId, save: next });
      if (!res.ok) setSaved(!next); // rollback
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save this centre'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition-colors',
        saved ? 'border-brand-plum/40 bg-brand-plum/10 text-brand-plum' : 'border-input hover:bg-secondary',
      )}
    >
      <span aria-hidden>{saved ? '♥' : '♡'}</span>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
