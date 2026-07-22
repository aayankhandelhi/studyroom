import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Always evaluate fresh — a cached health check is worthless.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Liveness + readiness probe.
 *
 * Returns 200 only when the app can actually reach its database. Uptime
 * monitors, load balancers and deploy smoke tests should poll this rather
 * than the homepage (which can render from cache even when the DB is down).
 *
 * Deliberately leaks nothing: no version internals, no connection strings,
 * no error details beyond a coarse status.
 */
export async function GET() {
  const startedAt = Date.now();

  const checks: Record<string, 'ok' | 'fail'> = {
    app: 'ok',
    database: 'fail',
  };

  try {
    const db = await createClient();
    // Cheapest possible round-trip that still proves the connection + RLS path.
    // Raced against a timeout: a health probe that hangs is worse than one that
    // reports failure, because uptime monitors time out and report nothing useful.
    const probe = db
      .from('categories')
      .select('slug')
      .limit(1)
      .then(({ error }) => !error);

    const ok = await Promise.race([
      probe,
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
    ]);

    if (ok) checks.database = 'ok';
  } catch {
    checks.database = 'fail';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    },
  );
}
