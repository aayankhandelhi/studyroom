import Link from 'next/link';

/**
 * Site footer. Beyond the obvious UX role, this carries the internal links to
 * the static pages (about/contact/privacy/terms) so they aren't orphaned —
 * orphan pages get crawled late and rank poorly.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg font-extrabold">StudyNook</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Find and book verified study spaces in Warangal.
            </p>
          </div>

          <nav aria-label="Browse">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide">Browse</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:underline" href="/centres">All study spaces</Link></li>
              <li><Link className="hover:underline" href="/about">About us</Link></li>
              <li><Link className="hover:underline" href="/contact">Contact</Link></li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide">Legal</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:underline" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:underline" href="/terms">Terms &amp; Conditions</Link></li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 border-t pt-6 text-xs text-muted-foreground">
          © {year} StudyNook. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
