'use client';
import Link from 'next/link';
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center" role="alert">
      <span className="text-3xl" aria-hidden>⚠️</span>
      <h1 className="mt-3 font-display text-xl font-bold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted-foreground">An unexpected error occurred. Please try again.</p>
      <div className="mt-5 flex gap-3">
        <button onClick={reset} className="rounded-md border px-4 py-2 text-sm font-semibold">Try again</button>
        <Link href="/" className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Go home</Link>
      </div>
    </main>
  );
}
