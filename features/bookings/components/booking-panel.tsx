'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import { createBooking } from '../actions';

interface ResourceOpt { id: string; label: string; tier: string | null; pricing: Record<string, number> }
type Period = 'hour' | 'day' | 'month';
const PERIOD_LABEL: Record<Period, string> = { hour: 'Hourly', day: 'Daily', month: 'Monthly' };

export function BookingPanel({ centreId, slug, resources }: { centreId: string; slug: string; resources: ResourceOpt[] }) {
  const router = useRouter();
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? '');
  const [period, setPeriod] = useState<Period>('month');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = resources.find((r) => r.id === resourceId);
  const periods = selected ? (Object.keys(selected.pricing) as Period[]).filter((p) => p in PERIOD_LABEL) : [];
  const amount = selected?.pricing[period];

  const book = async () => {
    setError(null); setBusy(true);
    const res = await createBooking({ centreId, resourceId, period });
    setBusy(false);
    if (!res.ok) { setError(res.error.message); return; }
    router.push(`/centres/${slug}/book/confirmed?id=${res.data.id}`);
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">Choose an option</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {resources.map((r) => (
            <button key={r.id} onClick={() => setResourceId(r.id)} aria-pressed={resourceId === r.id} className="text-left">
              <Card className={`p-4 transition ${resourceId === r.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                <p className="font-display font-semibold">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.tier ?? 'Seat'}</p>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {periods.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Duration</p>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p}
                className={`rounded-md border px-4 py-2 text-sm font-semibold ${period === p ? 'border-primary bg-accent text-foreground' : 'border-input text-muted-foreground'}`}>
                {PERIOD_LABEL[p]} · {formatINR(selected!.pricing[p]!)}
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-display text-xl font-bold text-brand-green">{typeof amount === 'number' ? formatINR(amount) : '—'}</p>
        </div>
        <Button onClick={book} disabled={busy || typeof amount !== 'number'}>{busy ? 'Booking…' : 'Confirm booking'}</Button>
      </Card>

      <p className="text-xs text-muted-foreground">Payment is collected at the centre or online once your booking is confirmed.</p>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
