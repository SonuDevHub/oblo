// src/components/rides/ride-card-skeleton.tsx
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function RideCardSkeleton() {
  return (
    <Card className="p-4 md:p-5 rounded-xl bg-card border border-border space-y-4">
      {/* Top row: Badge and Fare */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-pill" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      {/* Driver & Vehicle row */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>
      </div>

      {/* Timeline line */}
      <div className="space-y-2 py-1">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* Bottom row: Seats and Button */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </Card>
  );
}
