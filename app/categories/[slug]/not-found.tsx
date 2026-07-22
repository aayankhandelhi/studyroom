import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-display text-xl font-bold">Category not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">That category doesn’t exist.</p>
      <Button asChild className="mt-6"><Link href="/centres">Browse all study spaces</Link></Button>
    </main>
  );
}
