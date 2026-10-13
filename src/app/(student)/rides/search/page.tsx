// src/app/(student)/rides/search/page.tsx
import React from "react";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { PageHeader } from "@/components/layout/page-header";
import { AccessDeniedToast } from "@/components/auth/access-denied-toast";
import { RideSearchFilters, FilterStop } from "@/components/rides/ride-search-filters";
import { RideResultsView } from "@/components/rides/ride-results-view";
import { RideListEmpty } from "@/components/rides/ride-list-empty";
import { RideSearchResult } from "@/components/rides/ride-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Rides · Oblo Rides",
  description: "Find college carpool and bike rides matched by route and time",
};

interface SearchPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    date?: string;
    time?: string;
    vehicle?: string;
    hideFull?: string;
    page?: string;
  }>;
}

export default async function SearchRidesPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load all active stops
  const { data: stopsData } = await supabase
    .from("stops")
    .select("id, name, stop_order, km_from_start, route_id")
    .order("stop_order");

  const stops: FilterStop[] = stopsData || [];

  const fromStopId = params.from;
  const toStopId = params.to;
  const searchDate = params.date;
  const prefTime = params.time;
  const vehicleFilter = params.vehicle;
  const hideFull = params.hideFull === "true";
  const pageNum = parseInt(params.page || "1", 10);

  let searchResults: RideSearchResult[] = [];
  const hasSearchParams = Boolean(fromStopId && toStopId && searchDate);

  if (hasSearchParams) {
    const { data: rides, error } = await supabase.rpc("search_rides", {
      p_from_stop_id: fromStopId!,
      p_to_stop_id: toStopId!,
      p_date: searchDate!,
      p_pref_time: prefTime ? `${prefTime}:00` : undefined,
      p_vehicle_type: vehicleFilter && vehicleFilter !== "any" ? vehicleFilter : undefined,
      p_page: pageNum,
      p_limit: 20,
    });

    if (!error && rides) {
      searchResults = rides as RideSearchResult[];
    }
  }

  // Load existing requests for current user if authenticated
  const userRequestsMap: Record<string, "Pending" | "Accepted" | "Rejected" | "Cancelled"> = {};
  if (user && searchResults.length > 0) {
    const rideIds = searchResults.map((r) => r.ride_id);
    const { data: existingRequests } = await supabase
      .from("ride_requests")
      .select("ride_id, status")
      .eq("rider_id", user.id)
      .in("ride_id", rideIds);

    if (existingRequests) {
      for (const req of existingRequests) {
        userRequestsMap[req.ride_id] = req.status as "Pending" | "Accepted" | "Rejected" | "Cancelled";
      }
    }
  }

  return (
    <div className="space-y-6">
      <AccessDeniedToast />

      <PageHeader
        title="Find a Ride"
        description="Search campus commute rides by route, stop, or departure time"
      />

      {/* Top Filter Panel */}
      <RideSearchFilters
        stops={stops}
        initialFrom={fromStopId}
        initialTo={toStopId}
        initialDate={searchDate}
        initialTime={prefTime}
        initialVehicle={vehicleFilter}
        initialHideFull={hideFull}
      />

      {/* Results View or Empty State */}
      <div className="pt-2">
        {!hasSearchParams ? (
          <RideListEmpty hasFilters={false} />
        ) : searchResults.length === 0 ? (
          <RideListEmpty hasFilters={true} />
        ) : (
          <RideResultsView
            rides={searchResults}
            currentUserId={user?.id}
            userRequestsMap={userRequestsMap}
            stops={stops}
            pickupStopId={fromStopId}
            dropStopId={toStopId}
            hideFull={hideFull}
          />
        )}
      </div>
    </div>
  );
}
