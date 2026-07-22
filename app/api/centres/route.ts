import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listCentres } from '@/features/centres/services/centres.service';
import { centreSearchSchema } from '@/features/centres/schema';

export const runtime = 'nodejs';

/**
 * GET /api/centres — discovery feed (keyset paginated).
 * Public, read-only, validated. Used by the client infinite-scroll hook;
 * the first page is also fetched server-side for SSR/SEO.
 */
export async function GET(req: NextRequest) {
  const parsed = centreSearchSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const db = await createClient();
    const page = await listCentres(db, parsed.data);
    return NextResponse.json(page, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' },
    });
  } catch (e) {
    console.error('[GET /api/centres]', e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
