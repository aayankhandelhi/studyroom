import Link from 'next/link';
import { Fragment } from 'react';

export interface Crumb {
  label: string;
  href?: string;
}

/** Accessible breadcrumb trail (charter §Navigation + SEO BreadcrumbList pairs with lib/seo). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={i}>
              <li>
                {c.href && !last ? (
                  <Link href={c.href as never} className="hover:text-foreground hover:underline">{c.label}</Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className={last ? 'font-medium text-foreground' : ''}>{c.label}</span>
                )}
              </li>
              {!last && <li aria-hidden className="text-muted-foreground/50">/</li>}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
