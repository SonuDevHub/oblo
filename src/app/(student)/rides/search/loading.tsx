// src/app/(student)/rides/search/loading.tsx
import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { RideCardSkeleton } from "@/components/rides/ride-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Find a Ride"
        description="Search campus commute rides by route, stop, or departure time"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="space-y-3 pt-2">
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="hidden lg:block lg:col-span-7">
          <Skeleton className="h-80 w-full rounded-xl sticky top-24" />
        </div>
      </div>
    </div>
  );
}
