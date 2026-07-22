import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
  return <div className="mx-auto max-w-2xl px-6 py-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full rounded-lg" /></div>;
}
