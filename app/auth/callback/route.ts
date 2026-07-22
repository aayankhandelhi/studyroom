import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth / magic-link / email-verification callback.
 * Exchanges the auth code for a session, then routes the user on. New users
 * (no role chosen yet) land on /onboarding; everyone else on `next`.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const db = await createClient();
  const { error } = await db.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=auth`);

  // Send users who haven't finished onboarding to choose a role.
  const { data: { user } } = await db.auth.getUser();
  if (user) {
    const { data: ob } = await db.from('onboarding_progress').select('completed').eq('user_id', user.id).maybeSingle();
    if (!ob?.completed) return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
