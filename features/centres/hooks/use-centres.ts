'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { CentrePage } from '../types';
import type { CentreSearch } from '../schema';

type Filters = Omit<CentreSearch, 'limit' | 'cursorRating' | 'cursorId'>;

async function fetchPage(filters: Filters, cursor: CentrePage['nextCursor']): Promise<CentrePage> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.area) params.set('area', filters.area);
  if (filters.spaceType) params.set('spaceType', filters.spaceType);
  if (filters.womenSafe) params.set('womenSafe', 'true');
  if (filters.maxMonthly) params.set('maxMonthly', String(filters.maxMonthly));
  if (cursor) { params.set('cursorRating', String(cursor.rating)); params.set('cursorId', cursor.id); }

  const res = await fetch(`/api/centres?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load centres');
  return res.json() as Promise<CentrePage>;
}

/**
 * Infinite discovery feed. `initialData` is the SSR-rendered first page, so the
 * hook hydrates without a client refetch (good LCP + SEO), then paginates.
 */
export function useCentres(filters: Filters, initialData?: CentrePage) {
  return useInfiniteQuery({
    queryKey: ['centres', filters],
    queryFn: ({ pageParam }) => fetchPage(filters, pageParam),
    initialPageParam: null as CentrePage['nextCursor'],
    getNextPageParam: (last) => last.nextCursor,
    initialData: initialData ? { pages: [initialData], pageParams: [null] } : undefined,
  });
}
