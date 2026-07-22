import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { listCentres } from '@/features/centres/services/centres.service';
import { centreSearchSchema } from '@/features/centres/schema';
import { CentreFeed } from '@/features/centres/components/centre-feed';
import { Breadcrumbs } from '@/components/breadcrumbs';

export const metadata: Metadata = {
  title: 'Study spaces in Warangal',
  description: 'Browse verified study halls, reading rooms and coworking seats with live availability, ratings and prices.',
  alternates: { canonical: '/centres' },
};

// Cache the shell; the feed refetches client-side for freshness.
export const revalidate = 30;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Discovery page. Renders the first page on the server (SEO + fast LCP), then
 * hands off to the client feed which hydrates from it and infinite-scrolls.
 */
export default async function CentresPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = centreSearchSchema.parse(raw);
  const { limit: _l, cursorRating: _cr, cursorId: _ci, ...filters } = parsed;

  const db = await createClient();
  const firstPage = await listCentres(db, parsed);

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Study spaces' }]} />
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold">Study spaces in Warangal</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live availability, verified reviews, transparent prices.</p>
      </header>
      <CentreFeed filters={filters} initialData={firstPage} />
    </main>
  );
}
