import 'server-only';
import type { Database } from '@/types/database.types';

type DB = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;

/** Is a given centre saved by the user? */
export async function isSaved(db: DB, userId: string, centreId: string): Promise<boolean> {
  const { data } = await db.from('saved_listings')
    .select('centre_id').eq('user_id', userId).eq('centre_id', centreId).maybeSingle();
  return !!data;
}

/** All centres a user has saved (for /saved). */
export async function getSavedCentres(db: DB, userId: string) {
  const { data, error } = await db
    .from('saved_listings')
    .select('created_at, centres(id, slug, name, area, emoji, rating, reviews_count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
