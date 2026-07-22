import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/rbac';
import { RoleSelect } from '@/features/auth/components/role-select';
import { noindex } from '@/lib/seo';

export const metadata: Metadata = { title: 'Get started', ...noindex };

interface PageProps { searchParams: Promise<{ next?: string }> }

export default async function OnboardingPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  await requireUser();
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const { data: ob } = await db.from('onboarding_progress').select('completed').eq('user_id', user!.id).maybeSingle();
  if (ob?.completed) redirect(next ?? '/'); // already onboarded

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="font-display text-2xl font-bold">How will you use StudyNook?</h1>
      <p className="mt-1 text-sm text-muted-foreground">You can’t change this to admin — pick what fits you.</p>
      <RoleSelect next={next ?? '/'} />
    </main>
  );
}
