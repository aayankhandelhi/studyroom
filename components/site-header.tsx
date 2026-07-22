import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/rbac';
import { signOut } from '@/features/auth/actions';

/** App header. Server component: reads the session and shows the right links. */
export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-lg font-extrabold">
          Study<span className="text-brand-gold">Nook</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
          <Link href="/centres" className="rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Browse</Link>
          {user && <Link href="/saved" className="rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Saved</Link>}
          {user?.role === 'owner' && <Link href="/owner/centres" className="rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">My centres</Link>}
          {user?.role === 'admin' && <Link href="/admin" className="rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Admin</Link>}

          {user ? (
            <>
              <Link href="/account" className="rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Account</Link>
              <form action={signOut}>
                <button className="rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
