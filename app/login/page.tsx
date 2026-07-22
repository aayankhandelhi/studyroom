import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/rbac';
import { AuthForm } from '@/features/auth/components/auth-form';
import { noindex } from '@/lib/seo';

export const metadata: Metadata = { title: 'Sign in', ...noindex };

interface PageProps { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(next ?? '/'); // already signed in

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-12">
      <p className="mb-1 font-display text-xs font-bold uppercase tracking-wider text-brand-gold">StudyNook</p>
      <h1 className="mb-6 font-display text-2xl font-bold">Welcome</h1>
      <AuthForm next={next ?? '/'} />
    </main>
  );
}
