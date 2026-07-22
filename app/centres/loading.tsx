import { CentreGridSkeleton } from '@/features/centres/components/centre-states';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5 h-16" />
      <CentreGridSkeleton />
    </div>
  );
}
