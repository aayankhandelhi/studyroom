'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/rbac';
import { action } from '@/lib/auth/action';
import { rateLimit, clientKey } from '@/lib/rate-limit';
import { ActionError, type Result, err } from '@/lib/result';
import { credentialsSchema, emailOnlySchema, newPasswordSchema, roleSchema, signUpSchema, profileSchema } from './schema';

async function siteUrl(): Promise<string> {
  return process.env.NEXT_PUBLIC_SITE_URL ?? `https://${(await headers()).get('host')}`;
}

/** Email + password sign-in. Rate-limited to blunt credential stuffing. */
export async function signInWithPassword(raw: unknown): Promise<Result<{ ok: true }>> {
  const h = await headers();
  if (!rateLimit(clientKey(h, 'signin'), 10, 60_000).success)
    return err('RATE_LIMITED', 'Too many attempts. Please wait a minute.');

  return action(credentialsSchema, raw, async (input) => {
    const db = await createClient();
    const { error } = await db.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error) throw new ActionError('UNAUTHENTICATED', 'Wrong email or password.');
    return { ok: true as const };
  });
}

/** Sign-up. Sends a verification email; profile row is created by the DB trigger. */
export async function signUp(raw: unknown): Promise<Result<{ needsVerification: boolean }>> {
  const h = await headers();
  if (!rateLimit(clientKey(h, 'signup'), 5, 60_000).success)
    return err('RATE_LIMITED', 'Too many attempts. Please wait a minute.');

  return action(signUpSchema, raw, async (input) => {
    const db = await createClient();
    const { data, error } = await db.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        // handle_new_user() reads raw_user_meta_data->>'full_name' into profiles.
        data: { full_name: input.fullName },
        emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding`,
      },
    });
    if (error) throw new ActionError('CONFLICT', error.message);
    return { needsVerification: !data.session };
  });
}

/** Passwordless magic-link sign-in. */
export async function sendMagicLink(raw: unknown): Promise<Result<{ ok: true }>> {
  const h = await headers();
  if (!rateLimit(clientKey(h, 'magiclink'), 5, 60_000).success)
    return err('RATE_LIMITED', 'Too many attempts. Please wait a minute.');

  return action(emailOnlySchema, raw, async (input) => {
    const db = await createClient();
    const { error } = await db.auth.signInWithOtp({
      email: input.email,
      options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding` },
    });
    if (error) throw new ActionError('INTERNAL', 'Could not send the link. Try again.');
    return { ok: true as const };
  });
}

/** Request a password-reset email. Always returns ok (don't leak which emails exist). */
export async function requestPasswordReset(raw: unknown): Promise<Result<{ ok: true }>> {
  const h = await headers();
  if (!rateLimit(clientKey(h, 'reset'), 5, 60_000).success)
    return err('RATE_LIMITED', 'Too many attempts. Please wait a minute.');

  return action(emailOnlySchema, raw, async (input) => {
    const db = await createClient();
    //await db.auth.resetPasswordForEmail(input.email, { redirectTo: `${await siteUrl()}/auth/update-password` });
    await db.auth.resetPasswordForEmail(input.email, { redirectTo: `${await siteUrl()}/auth/callback?next=/auth/update-password` });
    return { ok: true as const };
  });
}

/** Set a new password (user arrives here via the reset link, already in a session). */
export async function updatePassword(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(newPasswordSchema, raw, async (input) => {
    await requireUser();
    const db = await createClient();
    const { error } = await db.auth.updateUser({ password: input.password });
    if (error) throw new ActionError('INTERNAL', error.message);
    return { ok: true as const };
  });
}

/** Onboarding: choose student or owner (safe definer fn; never admin). */
export async function chooseRole(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(roleSchema, raw, async (input) => {
    await requireUser();
    const db = await createClient();
    const { error } = await db.rpc('choose_role', { p_role: input.role });
    if (error) throw new ActionError('INTERNAL', 'Could not save your choice. Try again.');
    revalidatePath('/', 'layout');
    return { ok: true as const };
  });
}

/**
 * Update your own profile (name, phone). Uses the existing self-update RLS
 * policy on profiles, which freezes `role` — a user can never escalate here.
 */
export async function updateProfile(raw: unknown): Promise<Result<{ ok: true }>> {
  return action(profileSchema, raw, async (input) => {
    const user = await requireUser();
    const db = await createClient();
    const { error } = await db
      .from('profiles')
      .update({ full_name: input.fullName, phone: input.phone || null })
      .eq('id', user.id);
    if (error) throw new ActionError('INTERNAL', 'Could not save your profile. Try again.');
    revalidatePath('/account');
    revalidatePath('/', 'layout');
    return { ok: true as const };
  });
}

/** Sign out and return to home. */
export async function signOut(): Promise<void> {
  const db = await createClient();
  await db.auth.signOut();
  redirect('/');
}
