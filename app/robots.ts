import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studynook.app';

/** Public pages indexable; private/internal areas disallowed (charter §SEO). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/owner', '/admin', '/api', '/design-preview'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
