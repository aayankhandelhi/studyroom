import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl font-extrabold text-brand-green">404</p>
      <h1 className="mt-2 font-display text-xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">That page doesn’t exist or has moved.</p>
      <Link href="/centres" className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Browse centres</Link>
    </main>
  );
}
