'use client';

/**
 * Global error boundary — catches failures in the root layout itself, which
 * app/error.tsx cannot. Must render its own <html>/<body>.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-3xl font-extrabold">Something went wrong</h1>
          <p className="mt-3 text-muted-foreground">
            An unexpected error occurred. Please try again — if it keeps happening, contact support.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
