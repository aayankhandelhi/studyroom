import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

/** Skeleton grid — shown while the feed loads (matches card layout to avoid CLS). */
export function CentreGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center justify-between border-t pt-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function CentreEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <span className="text-4xl" aria-hidden>🔍</span>
      <h3 className="mt-3 font-display text-lg font-semibold">No study spaces match</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try widening your budget or clearing a filter — new centres are added every week.</p>
    </div>
  );
}

export function CentreErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center" role="alert">
      <span className="text-4xl" aria-hidden>⚠️</span>
      <h3 className="mt-3 font-display text-lg font-semibold">Couldn’t load study spaces</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">Something went wrong on our side. Please try again.</p>
      {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
