import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminStats } from '@/features/admin/services/admin.service';
import { Card } from '@/components/ui/card';

const CARDS = [
  { key: 'pendingCentres', label: 'Listings awaiting approval', href: '/admin/centres' },
  { key: 'openReports', label: 'Open review reports', href: '/admin/reviews' },
  { key: 'pendingClaims', label: 'Pending claims', href: '/admin/centres' },
  { key: 'newEnquiries', label: 'New enquiries', href: '/admin' },
] as const;

export default async function AdminOverviewPage() {
  const db = await createClient();
  const stats = await getAdminStats(db);

  return (
    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading" className="sr-only">Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.key} href={c.href as never}>
            <Card className="p-5 transition hover:shadow-md">
              <p className="font-display text-3xl font-extrabold text-brand-green">{stats[c.key]}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
