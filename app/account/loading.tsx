import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
