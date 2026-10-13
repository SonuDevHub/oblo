import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full bg-surface-3" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28 bg-surface-3" />
            <Skeleton className="h-3 w-16 bg-surface-3" />
          </div>
        </div>
        <Skeleton className="h-6 w-14 bg-surface-3 rounded-md" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full bg-surface-3" />
        <Skeleton className="h-3 w-2/3 bg-surface-3" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Skeleton className="h-4 w-20 bg-surface-3" />
        <Skeleton className="h-8 w-24 bg-surface-3 rounded-md" />
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
