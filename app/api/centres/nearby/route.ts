import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listCentresNearby } from '@/features/centres/services/centres.service';
import { nearbySearchSchema } from '@/features/centres/schema';

export const runtime = 'nodejs';

/**
 * GET /api/centres/nearby?lat=..&lng=..&radiusKm=..&spaceType=..&womenSafe=..
 * Distance-ordered "search near me" results. Public, read-only, validated.
 * Backed by the search_centres_nearby RPC (earthdistance + GiST index).
 * Each result includes distanceKm so the client/map can show "X km away".
 */
export async function GET(req: NextRequest) {
  const parsed = nearbySearchSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const db = await createClient();
    const results = await listCentresNearby(db, parsed.data);
    return NextResponse.json(
      { items: results },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' } },
    );
  } catch (e) {
    console.error('[GET /api/centres/nearby]', e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
