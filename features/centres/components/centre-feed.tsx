'use client';
import { useEffect, useRef } from 'react';
import { useCentres } from '../hooks/use-centres';
import { CentreCard } from './centre-card';
import { CentreGridSkeleton, CentreEmptyState, CentreErrorState } from './centre-states';
import { Button } from '@/components/ui/button';
import type { CentrePage } from '../types';
import type { CentreSearch } from '../schema';

type Filters = Omit<CentreSearch, 'limit' | 'cursorRating' | 'cursorId'>;

/**
 * Discovery feed (client). Hydrates from the SSR first page (no refetch on load),
 * then infinite-scrolls via an IntersectionObserver sentinel. Renders explicit
 * loading / empty / error / end states.
 */
export function CentreFeed({ filters, initialData }: { filters: Filters; initialData: CentrePage }) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useCentres(filters, initialData);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage(); },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <CentreGridSkeleton />;
  if (isError) return <CentreErrorState onRetry={() => void refetch()} />;

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) return <CentreEmptyState />;

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {items.map((c) => <CentreCard key={c.id} centre={c} />)}
      </div>

      <div ref={sentinel} className="h-1" aria-hidden />

      {isFetchingNextPage && <div className="mt-4"><CentreGridSkeleton count={4} /></div>}
      {!hasNextPage && items.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">You’ve reached the end · {items.length} centres</p>
      )}
      {hasNextPage && !isFetchingNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => void fetchNextPage()}>Load more</Button>
        </div>
      )}
    </>
  );
}
