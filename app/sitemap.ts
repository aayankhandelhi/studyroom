import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studynook.app';

/**
 * Sitemap for approved public listings, categories and locations only
 * (charter §SEO: no draft/pending/rejected/suspended, no private pages).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await createClient();

  const [{ data: centres }, { data: cats }, { data: locs }] = await Promise.all([
    db.from('centres').select('slug, updated_at').eq('status', 'approved').limit(50_000),
    db.from('categories').select('slug'),
    db.from('locations').select('slug'),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/centres`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const centreRoutes: MetadataRoute.Sitemap = (centres ?? []).map((c) => ({
    url: `${base}/centres/${c.slug}`,
    lastModified: c.updated_at ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const catRoutes: MetadataRoute.Sitemap = (cats ?? []).map((c) => ({
    url: `${base}/categories/${c.slug}`, changeFrequency: 'weekly', priority: 0.6,
  }));
  const locRoutes: MetadataRoute.Sitemap = (locs ?? []).map((l) => ({
    url: `${base}/locations/${l.slug}`, changeFrequency: 'weekly', priority: 0.6,
  }));

  return [...staticRoutes, ...centreRoutes, ...catRoutes, ...locRoutes];
}
