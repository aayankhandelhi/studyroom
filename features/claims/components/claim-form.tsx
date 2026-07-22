'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { claimSchema, type ClaimInput } from '../schema';
import { submitClaim } from '../actions';

export function ClaimForm({ centreId }: { centreId: string }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ClaimInput>({ resolver: zodResolver(claimSchema), defaultValues: { centreId } });

  const onSubmit = async (values: ClaimInput) => {
    setServerError(null);
    const res = await submitClaim(values);
    if (res.ok) { setDone(true); return; }
    setServerError(res.error.message);
  };

  if (done) return <p className="rounded-md bg-accent p-3 text-sm font-medium text-brand-green" role="status">Claim submitted — our team will review it and get back to you.</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <input type="hidden" {...register('centreId')} />
      <div>
        <label htmlFor="claim-evidence" className="text-sm font-medium">How can you prove you own or manage this centre?</label>
        <textarea
          id="claim-evidence" rows={4} aria-invalid={!!errors.evidence}
          className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="e.g. I’m the owner — here’s my registration / a phone number listed on-site / GST…"
          {...register('evidence')}
        />
        {errors.evidence && <p className="mt-1 text-xs text-destructive">{errors.evidence.message}</p>}
      </div>
      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit claim'}</Button>
    </form>
  );
}
