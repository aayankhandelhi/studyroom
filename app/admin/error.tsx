'use client';
import { Button } from '@/components/ui/button';

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center" role="alert">
      <span className="text-3xl" aria-hidden>⚠️</span>
      <p className="mt-2 font-display font-semibold">Something went wrong</p>
      <p className="text-sm text-muted-foreground">This admin view failed to load.</p>
      <Button variant="outline" className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
