import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
  return <div className="mx-auto max-w-4xl px-6 py-16"><Skeleton className="h-12 w-2/3 mx-auto" /><Skeleton className="mt-4 h-6 w-1/2 mx-auto" /></div>;
}
