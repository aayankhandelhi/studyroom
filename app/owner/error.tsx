'use client';
import { Button } from '@/components/ui/button';
export default function OwnerError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center" role="alert">
      <p className="font-display font-semibold">Something went wrong</p>
      <Button variant="outline" className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
