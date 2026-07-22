'use client';
export default function CentresError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center" role="alert">
      <p className="font-display font-semibold">Couldn’t load centres</p>
      <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
      <button onClick={reset} className="mt-4 rounded-md border px-4 py-2 text-sm font-semibold">Retry</button>
    </div>
  );
}
