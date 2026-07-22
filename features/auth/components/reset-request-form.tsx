'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { emailOnlySchema, type EmailOnly } from '../schema';
import { requestPasswordReset } from '../actions';

export function ResetRequestForm() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<EmailOnly>({ resolver: zodResolver(emailOnlySchema) });

  const onSubmit = async (values: EmailOnly) => { await requestPasswordReset(values); setSent(true); };

  // Always show the same confirmation (don't reveal whether the email exists).
  if (sent) return <p className="rounded-md bg-accent p-4 text-sm" role="status">If an account exists for that email, a reset link is on its way.</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send reset link'}</Button>
    </form>
  );
}
