// src/components/rides/ride-results-view.tsx
"use client";

import React, { useState } from "react";
import { RideCard, RideSearchResult } from "@/components/rides/ride-card";
import { RouteTimeline, RouteStop } from "@/components/rides/route-timeline";
import { RideListEmpty } from "@/components/rides/ride-list-empty";
import { RequestSeatDialog } from "@/components/requests/request-seat-dialog";
import { getMatchLabel } from "@/lib/matching/match-label";

interface RideResultsViewProps {
  rides: RideSearchResult[];
  currentUserId?: string | null;
  userRequestsMap?: Record<string, "Pending" | "Accepted" | "Rejected" | "Cancelled">;
  stops: RouteStop[];
  pickupStopId?: string | null;
  dropStopId?: string | null;
  hideFull?: boolean;
}

export function RideResultsView({
  rides,
  currentUserId,
  userRequestsMap = {},
  stops,
  pickupStopId,
  dropStopId,
  hideFull = false,
}: RideResultsViewProps) {
  const [selectedRideForRequest, setSelectedRideForRequest] = useState<RideSearchResult | null>(null);
  const [hoveredRideId, setHoveredRideId] = useState<string | null>(null);

  // Filter full rides if hideFull is toggled
  const visibleRides = hideFull ? rides.filter((r) => !r.is_full && r.seats_left > 0) : rides;

  if (visibleRides.length === 0) {
    return <RideListEmpty hasFilters={true} />;
  }

  // Bucket rides
  const bestMatches: RideSearchResult[] = [];
  const goodMatches: RideSearchResult[] = [];
  const otherRides: RideSearchResult[] = [];
  const fullRides: RideSearchResult[] = [];

  visibleRides.forEach((ride) => {
    const isFull = ride.is_full || ride.seats_left <= 0;
    if (isFull) {
      fullRides.push(ride);
      return;
    }

    const cat = getMatchLabel({
      isFull: false,
      isExactRoute: ride.is_exact_route,
      timeDiffMinutes: ride.time_diff_minutes,
    });

    if (cat === "BEST") {
      bestMatches.push(ride);
    } else if (cat === "GOOD") {
      goodMatches.push(ride);
    } else {
      otherRides.push(ride);
    }
  });

  // Determine currently focused ride for sticky map (hovered or first best or first visible)
  const activeRide =
    visibleRides.find((r) => r.ride_id === hoveredRideId) ||
    bestMatches[0] ||
    goodMatches[0] ||
    visibleRides[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Grouped Ride List */}
      <div className="lg:col-span-6 xl:col-span-7 space-y-6">
        {/* BEST MATCHES */}
        {bestMatches.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-lime uppercase">
              <span className="size-2 rounded-full bg-lime animate-pulse" />
              <span>BEST MATCH ({bestMatches.length})</span>
            </div>
            <div className="space-y-3">
              {bestMatches.map((ride) => (
                <div
                  key={ride.ride_id}
                  onMouseEnter={() => setHoveredRideId(ride.ride_id)}
                  onMouseLeave={() => setHoveredRideId(null)}
                >
                  <RideCard
                    ride={ride}
                    currentUserId={currentUserId}
                    existingRequestStatus={userRequestsMap[ride.ride_id]}
                    stops={stops}
                    pickupStopId={pickupStopId}
                    dropStopId={dropStopId}
                    onRequestSeat={(r) => setSelectedRideForRequest(r)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GOOD MATCHES */}
        {goodMatches.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-foreground/80 uppercase">
              <span>GOOD MATCH ({goodMatches.length})</span>
            </div>
            <div className="space-y-3">
              {goodMatches.map((ride) => (
                <div
                  key={ride.ride_id}
                  onMouseEnter={() => setHoveredRideId(ride.ride_id)}
                  onMouseLeave={() => setHoveredRideId(null)}
                >
                  <RideCard
                    ride={ride}
                    currentUserId={currentUserId}
                    existingRequestStatus={userRequestsMap[ride.ride_id]}
                    stops={stops}
                    pickupStopId={pickupStopId}
                    dropStopId={dropStopId}
                    onRequestSeat={(r) => setSelectedRideForRequest(r)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* OTHER RIDES */}
        {otherRides.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-muted-foreground uppercase">
              <span>OTHER RIDES ({otherRides.length})</span>
            </div>
            <div className="space-y-3">
              {otherRides.map((ride) => (
                <div
                  key={ride.ride_id}
                  onMouseEnter={() => setHoveredRideId(ride.ride_id)}
                  onMouseLeave={() => setHoveredRideId(null)}
                >
                  <RideCard
                    ride={ride}
                    currentUserId={currentUserId}
                    existingRequestStatus={userRequestsMap[ride.ride_id]}
                    stops={stops}
                    pickupStopId={pickupStopId}
                    dropStopId={dropStopId}
                    onRequestSeat={(r) => setSelectedRideForRequest(r)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FULL RIDES (Always listed last) */}
        {!hideFull && fullRides.length > 0 && (
          <section className="space-y-3 opacity-70">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-muted-foreground uppercase">
              <span>FULL ({fullRides.length})</span>
            </div>
            <div className="space-y-3">
              {fullRides.map((ride) => (
                <div
                  key={ride.ride_id}
                  onMouseEnter={() => setHoveredRideId(ride.ride_id)}
                  onMouseLeave={() => setHoveredRideId(null)}
                >
                  <RideCard
                    ride={ride}
                    currentUserId={currentUserId}
                    existingRequestStatus={userRequestsMap[ride.ride_id]}
                    stops={stops}
                    pickupStopId={pickupStopId}
                    dropStopId={dropStopId}
                    onRequestSeat={(r) => setSelectedRideForRequest(r)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right Column: Sticky Schematic Route Map */}
      <div className="lg:col-span-6 xl:col-span-5 sticky top-20">
        <RouteTimeline
          variant="full"
          stops={stops}
          startStopId={activeRide?.start_stop_id || stops[0]?.id || ""}
          endStopId={activeRide?.end_stop_id || stops[stops.length - 1]?.id || ""}
          pickupStopId={pickupStopId}
          dropStopId={dropStopId}
          driverName={activeRide?.owner_name}
          departureTime={activeRide?.ride_time}
        />
      </div>

      {/* Modal/Drawer for requesting seat */}
      {selectedRideForRequest && (
        <RequestSeatDialog
          ride={selectedRideForRequest}
          stops={stops}
          defaultPickupStopId={pickupStopId}
          defaultDropStopId={dropStopId}
          open={!!selectedRideForRequest}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedRideForRequest(null);
          }}
        />
      )}
    </div>
  );
}
