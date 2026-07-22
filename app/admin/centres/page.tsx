import { createClient } from '@/lib/supabase/server';
import { getPendingCentres } from '@/features/admin/services/admin.service';
import { CentreModerationActions } from '@/features/admin/components/centre-moderation-actions';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

export default async function AdminCentresPage() {
  const db = await createClient();
  const pending = await getPendingCentres(db);

  return (
    <section aria-labelledby="approvals-heading">
      <h2 id="approvals-heading" className="mb-4 font-display text-lg font-bold">Listings awaiting approval</h2>

      {pending.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-3xl" aria-hidden>✅</span>
          <p className="mt-2 font-display font-semibold">Queue is clear</p>
          <p className="text-sm text-muted-foreground">No listings are waiting for review.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span aria-hidden>{c.emoji}</span>
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.area} · {c.space_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.owner?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell className="text-right"><div className="flex justify-end"><CentreModerationActions centreId={c.id} /></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </section>
  );
}
