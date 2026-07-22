import type { Metadata } from 'next';
import { ResetRequestForm } from '@/features/auth/components/reset-request-form';
import { noindex } from '@/lib/seo';

export const metadata: Metadata = { title: 'Reset password', ...noindex };

export default function ResetPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 font-display text-2xl font-bold">Reset your password</h1>
      <p className="mb-6 text-sm text-muted-foreground">We’ll email you a link to set a new one.</p>
      <ResetRequestForm />
    </main>
  );
}
