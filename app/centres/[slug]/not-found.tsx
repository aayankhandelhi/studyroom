import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CentreNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-4xl" aria-hidden>🔍</span>
      <h1 className="mt-4 font-display text-xl font-bold">Listing not available</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This study space doesn’t exist, or it isn’t published yet. It may be under review or no longer listed.
      </p>
      <Button asChild className="mt-6"><Link href="/centres">Browse all study spaces</Link></Button>
    </main>
  );
}
