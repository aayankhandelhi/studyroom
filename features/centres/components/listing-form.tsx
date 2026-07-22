'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { centreUpsertSchema, type CentreUpsert } from '../schema';
import { createCentre, updateCentre } from '../actions';

type Props =
  | { mode: 'create'; centreId?: undefined; defaults?: undefined }
  | { mode: 'edit'; centreId: string; defaults: Partial<CentreUpsert> };

/** Create or edit a listing. Same Zod schema client + server. */
export function ListingForm(props: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CentreUpsert>({
    resolver: zodResolver(centreUpsertSchema),
    defaultValues: { emoji: '📖', spaceType: 'study_hall', ...props.defaults },
  });

  const onSubmit = async (values: CentreUpsert) => {
    setServerError(null);
    const res = props.mode === 'create'
      ? await createCentre(values)
      : await updateCentre({ ...values, centreId: props.centreId });
    if (!res.ok) { setServerError(res.error.message); return; }
    router.push('/owner/centres');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4" noValidate>
      <div>
        <Label htmlFor="name">Centre name</Label>
        <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="area">Area</Label>
        <Input id="area" placeholder="e.g. Hanamkonda" aria-invalid={!!errors.area} {...register('area')} />
        {errors.area && <p className="mt-1 text-xs text-destructive">{errors.area.message}</p>}
      </div>
      <div>
        <Label htmlFor="spaceType">Type</Label>
        <select id="spaceType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('spaceType')}>
          <option value="study_hall">Study hall</option>
          <option value="reading_room">Reading room</option>
          <option value="coworking">Coworking</option>
          <option value="both">Study + coworking</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="lat">Latitude</Label>
          <Input id="lat" type="number" step="any" aria-invalid={!!errors.lat} {...register('lat', { valueAsNumber: true })} />
          {errors.lat && <p className="mt-1 text-xs text-destructive">{errors.lat.message}</p>}
        </div>
        <div>
          <Label htmlFor="lng">Longitude</Label>
          <Input id="lng" type="number" step="any" aria-invalid={!!errors.lng} {...register('lng', { valueAsNumber: true })} />
          {errors.lng && <p className="mt-1 text-xs text-destructive">{errors.lng.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="emoji">Icon</Label>
        <Input id="emoji" className="w-20" maxLength={4} {...register('emoji')} />
      </div>
      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : props.mode === 'create' ? 'Create listing' : 'Save changes'}
      </Button>
    </form>
  );
}
