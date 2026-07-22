import type { Metadata } from 'next';
import { UpdatePasswordForm } from '@/features/auth/components/update-password-form';
import { noindex } from '@/lib/seo';

export const metadata: Metadata = { title: 'Set new password', ...noindex };

// The user arrives here from the reset email already in a recovery session.
export default function UpdatePasswordPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-6 font-display text-2xl font-bold">Set a new password</h1>
      <UpdatePasswordForm />
    </main>
  );
}
