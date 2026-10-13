import { CardListSkeleton } from "@/components/layout/card-skeleton";

export default function MyRidesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 bg-surface-3 rounded-md animate-pulse" />
      <CardListSkeleton count={3} />
    </div>
  );
}
