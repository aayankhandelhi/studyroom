import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/rbac';
import { Card } from '@/components/ui/card';
import { formatINR } from '@/lib/utils';
import { PayButton } from '@/features/payments/components/pay-button';
import { noindex } from '@/lib/seo';

export const metadata: Metadata = { title: 'Booking confirmed', ...noindex };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ id?: string }> };

export default async function ConfirmedPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { id } = await searchParams;
  await requireUser();
  if (!id) notFound();

  const db = await createClient();
  const { data: booking } = await db
    .from('bookings')
    .select('id, period, amount, status, payment, starts_at, centres(name)')
    .eq('id', id)
    .maybeSingle();
  if (!booking) notFound(); // RLS also scopes to owner

  const centre = booking.centres as unknown as { name: string } | null;

  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bg-success text-text-success" aria-hidden>✓</div>
      <h1 className="mt-4 font-display text-2xl font-bold">Booking confirmed</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your seat at {centre?.name} is reserved.</p>

      <Card className="mt-6 p-5 text-left">
        <div className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">Duration</span><span className="font-medium capitalize">{booking.period}</span></div>
        <div className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">Amount</span><span className="font-medium">{formatINR(booking.amount)}</span></div>
        <div className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{booking.status}</span></div>
        <div className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">Payment</span><span className="font-medium capitalize">{booking.payment}</span></div>
      </Card>

      {booking.payment === 'unpaid' && (
        <div className="mt-4 flex justify-center"><PayButton bookingId={booking.id} /></div>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/centres" className="rounded-md border px-4 py-2 text-sm font-semibold">Browse more</Link>
        <Link href={`/centres/${slug}`} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Back to centre</Link>
      </div>
    </main>
  );
}
