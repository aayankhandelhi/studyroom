'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { chooseRole } from '../actions';
import { Card } from '@/components/ui/card';

const OPTIONS = [
  { role: 'student' as const, emoji: '🎓', title: 'I’m a student', desc: 'Find, book and review study spaces.' },
  { role: 'owner' as const, emoji: '🏫', title: 'I run a study space', desc: 'List and manage my centre.' },
];

export function RoleSelect({ next }: { next: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<'student' | 'owner' | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const confirm = () =>
    start(async () => {
      if (!selected) return;
      setError(null);
      const res = await chooseRole({ role: selected });
      if (!res.ok) { setError(res.error.message); return; }
      router.push(selected === 'owner' ? '/owner/centres' : next);
      router.refresh();
    });

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <button key={o.role} onClick={() => setSelected(o.role)} className="text-left"
            aria-pressed={selected === o.role}>
            <Card className={`p-5 transition ${selected === o.role ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
              <span className="text-2xl" aria-hidden>{o.emoji}</span>
              <p className="mt-2 font-display font-semibold">{o.title}</p>
              <p className="text-sm text-muted-foreground">{o.desc}</p>
            </Card>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <button onClick={confirm} disabled={!selected || pending}
        className="w-full rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground disabled:opacity-50">
        {pending ? 'Setting up…' : 'Continue'}
      </button>
    </div>
  );
}
