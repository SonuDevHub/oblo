// src/components/rides/ride-card.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Lock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerifiedDriverBadge } from "@/components/verification/verified-driver-badge";
import { VehicleBadge } from "@/components/rides/vehicle-badge";
import { SeatsLeftBadge } from "@/components/rides/seats-left-badge";
import { RouteTimeline, RouteStop } from "@/components/rides/route-timeline";
import { getMatchLabel, MATCH_LABELS, MatchCategory } from "@/lib/matching/match-label";
import { cn } from "@/lib/utils";

export interface RideSearchResult {
  ride_id: string;
  owner_id: string;
  owner_name: string;
  is_verified_driver: boolean;
  vehicle_type: string;
  vehicle_brand_model: string;
  vehicle_color: string | null;
  route_id: string;
  route_name: string;
  start_stop_id: string;
  start_stop_name: string;
  end_stop_id: string;
  end_stop_name: string;
  ride_date: string;
  ride_time: string;
  total_seats: number;
  seats_left: number;
  is_full: boolean;
  rate_per_km: number;
  estimated_fare: number;
  time_diff_minutes: number;
  is_exact_route: boolean;
  status: string;
}

interface RideCardProps {
  ride: RideSearchResult;
  currentUserId?: string | null;
  existingRequestStatus?: "Pending" | "Accepted" | "Rejected" | "Cancelled" | null;
  stops?: RouteStop[];
  pickupStopId?: string | null;
  dropStopId?: string | null;
  onRequestSeat?: (ride: RideSearchResult) => void;
  className?: string;
}

export function RideCard({
  ride,
  currentUserId,
  existingRequestStatus,
  stops = [],
  pickupStopId,
  dropStopId,
  onRequestSeat,
  className,
}: RideCardProps) {
  const isOwnRide = currentUserId ? ride.owner_id === currentUserId : false;
  const isFull = ride.is_full || ride.seats_left <= 0;

  // Match category
  const matchCategory: MatchCategory = getMatchLabel({
    isFull,
    isExactRoute: ride.is_exact_route,
    timeDiffMinutes: ride.time_diff_minutes,
  });
  const matchBadge = MATCH_LABELS[matchCategory];

  // Route stops for timeline
  const routeStops = stops.length > 0
    ? stops.filter((s) => s.id === ride.start_stop_id || s.id === ride.end_stop_id || s.stop_order !== undefined)
    : [
        {
          id: ride.start_stop_id,
          name: ride.start_stop_name,
          stop_order: 1,
          km_from_start: 0,
        },
        {
          id: ride.end_stop_id,
          name: ride.end_stop_name,
          stop_order: 2,
          km_from_start: 12,
        },
      ];

  // Render Action Button based on state
  const renderActionButton = () => {
    // 1. Own ride state
    if (isOwnRide) {
      return (
        <span
          className="inline-flex items-center px-3 py-1.5 rounded-md bg-surface-3 text-muted-foreground text-xs font-medium cursor-default border border-border"
          data-testid="own-ride-badge"
        >
          Yeh aapki ride hai
        </span>
      );
    }

    // 2. Already requested state
    if (existingRequestStatus) {
      return (
        <Link
          href="/requests/mine"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-lime text-xs font-semibold border border-lime/30 hover:bg-accent/80 transition-colors"
        >
          <span>{existingRequestStatus}</span>
          <span className="text-[10px] text-muted-foreground underline">View</span>
        </Link>
      );
    }

    // 3. Full ride state
    if (isFull) {
      return (
        <Button
          disabled
          variant="outline"
          size="sm"
          className="h-9 px-4 gap-1.5 text-xs font-medium opacity-60 cursor-not-allowed border-border bg-surface-2 text-muted-foreground"
          data-testid="full-ride-button"
        >
          <Lock className="size-3 text-muted-foreground" aria-hidden="true" />
          <span>Full</span>
        </Button>
      );
    }

    // 4. Past ride state
    if (ride.status === "past") {
      return (
        <Button
          disabled
          variant="outline"
          size="sm"
          className="h-9 px-4 text-xs font-medium opacity-50 cursor-not-allowed border-border"
        >
          Ride nikal chuki
        </Button>
      );
    }

    // 5. Available -> Request seat
    return (
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={() => onRequestSeat?.(ride)}
        className="h-9 px-4 text-xs font-semibold bg-lime text-ink hover:bg-lime-hover active:bg-lime-press shadow-[0_0_12px_rgba(200,255,0,0.2)]"
        data-testid="request-seat-button"
      >
        Request seat
      </Button>
    );
  };

  return (
    <Card
      className={cn(
        "p-4 md:p-5 rounded-xl bg-card border border-border space-y-3.5 transition-all duration-200",
        matchCategory === "BEST" && !isFull && "border-lime/40 shadow-[0_0_16px_rgba(200,255,0,0.08)]",
        isFull && "opacity-60 bg-card/60",
        className
      )}
      data-testid="ride-card"
      data-ride-id={ride.ride_id}
      data-is-full={isFull}
    >
      {/* Top Header: Match Label & Estimated Fare */}
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn("px-2 py-0.5 text-[11px] rounded-pill border", matchBadge.badgeClass)}
        >
          {matchBadge.label}
        </Badge>

        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-foreground">
              ₹{Math.round(ride.estimated_fare)}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">est.</span>
          </div>
        </div>
      </div>

      {/* Driver info + Vehicle details */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-full bg-surface-3 border border-border flex items-center justify-center shrink-0">
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">
                {ride.owner_name}
              </span>
              {ride.is_verified_driver && (
                <VerifiedDriverBadge />
              )}
            </div>
            {/* Vehicle Badge: Icon + Type + Model + Color. STRICTLY NO PLATE! */}
            <VehicleBadge
              vehicleType={ride.vehicle_type}
              brandModel={ride.vehicle_brand_model}
              color={ride.vehicle_color}
            />
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-mono font-medium text-lime px-2 py-0.5 rounded bg-accent border border-lime/30">
            {ride.ride_time ? ride.ride_time.slice(0, 5) : ""}
          </span>
        </div>
      </div>

      {/* Route Timeline */}
      <div className="pt-1">
        <RouteTimeline
          variant="compact"
          stops={routeStops}
          startStopId={ride.start_stop_id}
          endStopId={ride.end_stop_id}
          pickupStopId={pickupStopId}
          dropStopId={dropStopId}
          departureTime={ride.ride_time}
        />
      </div>

      {/* Footer: Seats meter and Action button */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <SeatsLeftBadge
          totalSeats={ride.total_seats}
          seatsLeft={ride.seats_left}
          isFull={isFull}
        />
        <div>{renderActionButton()}</div>
      </div>
    </Card>
  );
}
