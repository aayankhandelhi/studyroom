import 'server-only';
import type { Database } from '@/types/database.types';

type DB = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;

export interface WaitlistEntry {
  id: string; status: string; period: string; created_at: string; position: number;
  student: { full_name: string | null } | null;
}
export interface WaitlistGroup {
  resourceId: string; resourceLabel: string; centreName: string; centreId: string;
  unitCount: number; activeBookings: number; seatsFree: number;
  waiting: WaitlistEntry[];
}

export interface WaitlistFilters { q?: string; centreId?: string; status?: string }

/**
 * Waitlist grouped by resource, with queue position + live seat availability.
 * Reuses the waitlist_entries + resources + bookings tables (no new logic).
 */
export async function getWaitlists(db: DB, f: WaitlistFilters): Promise<WaitlistGroup[]> {
  // Pull waiting (or filtered-status) entries with their resource + centre + student.
  const status = f.status ?? 'waiting';
  let q = db
    .from('waitlist_entries')
    .select('id, status, period, created_at, resource_id, student:user_id(full_name), resources(label, centre_id, unit_count, centres(name))')
    .eq('status', status)
    .order('created_at', { ascending: true });

  const { data } = await q;
  let rows = (data ?? []) as unknown as Array<{
    id: string; status: string; period: string; created_at: string; resource_id: string;
    student: { full_name: string | null } | null;
    resources: { label: string; centre_id: string; unit_count: number; centres: { name: string } | null } | null;
  }>;

  if (f.centreId) rows = rows.filter((r) => r.resources?.centre_id === f.centreId);
  if (f.q) {
    const n = f.q.toLowerCase();
    rows = rows.filter((r) => r.student?.full_name?.toLowerCase().includes(n) || r.resources?.centres?.name?.toLowerCase().includes(n));
  }

  // Group by resource; compute queue position within each resource.
  const groups = new Map<string, WaitlistGroup>();
  const positionCounter = new Map<string, number>();
  for (const r of rows) {
    const rid = r.resource_id;
    if (!groups.has(rid)) {
      groups.set(rid, {
        resourceId: rid,
        resourceLabel: r.resources?.label ?? 'Resource',
        centreName: r.resources?.centres?.name ?? '—',
        centreId: r.resources?.centre_id ?? '',
        unitCount: r.resources?.unit_count ?? 0,
        activeBookings: 0, seatsFree: 0, waiting: [],
      });
      positionCounter.set(rid, 0);
    }
    const pos = (positionCounter.get(rid) ?? 0) + 1;
    positionCounter.set(rid, pos);
    groups.get(rid)!.waiting.push({
      id: r.id, status: r.status, period: r.period, created_at: r.created_at,
      position: pos, student: r.student,
    });
  }

  // Seat availability per resource (active bookings vs unit_count).
  const resourceIds = [...groups.keys()];
  if (resourceIds.length) {
    const { data: active } = await db
      .from('bookings').select('resource_id')
      .in('resource_id', resourceIds).in('status', ['pending', 'confirmed', 'checked_in']);
    const counts = new Map<string, number>();
    for (const b of active ?? []) counts.set(b.resource_id, (counts.get(b.resource_id) ?? 0) + 1);
    for (const g of groups.values()) {
      g.activeBookings = counts.get(g.resourceId) ?? 0;
      g.seatsFree = Math.max(0, g.unitCount - g.activeBookings);
    }
  }

  return [...groups.values()];
}

/** Centres for the filter dropdown. */
export async function getCentreOptions(db: DB): Promise<{ id: string; name: string }[]> {
  const { data } = await db.from('centres').select('id, name').order('name');
  return (data ?? []) as { id: string; name: string }[];
}
