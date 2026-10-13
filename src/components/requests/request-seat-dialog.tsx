// src/components/requests/request-seat-dialog.tsx
"use client";

import React, { useState, useTransition, useMemo } from "react";
import { CheckCircle2, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerifiedDriverBadge } from "@/components/verification/verified-driver-badge";
import { VehicleBadge } from "@/components/rides/vehicle-badge";
import { RideSearchResult } from "@/components/rides/ride-card";
import { RouteStop } from "@/components/rides/route-timeline";
import { requestSeatAction } from "@/actions/request-actions";

interface RequestSeatDialogProps {
  ride: RideSearchResult;
  stops: RouteStop[];
  defaultPickupStopId?: string | null;
  defaultDropStopId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestSeatDialog({
  ride,
  stops,
  defaultPickupStopId,
  defaultDropStopId,
  open,
  onOpenChange,
}: RequestSeatDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  // Find start and end stop objects to get range
  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => a.stop_order - b.stop_order);
  }, [stops]);

  const rideStartStop = sortedStops.find((s) => s.id === ride.start_stop_id);
  const rideEndStop = sortedStops.find((s) => s.id === ride.end_stop_id);

  const startOrder = rideStartStop?.stop_order ?? 1;
  const endOrder = rideEndStop?.stop_order ?? 99;

  // Stops available inside ride's boundary
  const availableStops = useMemo(() => {
    return sortedStops.filter(
      (s) => s.stop_order >= startOrder && s.stop_order <= endOrder
    );
  }, [sortedStops, startOrder, endOrder]);

  // Initial pickup & drop inside valid range
  const initialPickup = useMemo(() => {
    if (defaultPickupStopId && availableStops.some((s) => s.id === defaultPickupStopId)) {
      return defaultPickupStopId;
    }
    return availableStops[0]?.id || ride.start_stop_id;
  }, [defaultPickupStopId, availableStops, ride.start_stop_id]);

  const initialDrop = useMemo(() => {
    if (defaultDropStopId && availableStops.some((s) => s.id === defaultDropStopId)) {
      return defaultDropStopId;
    }
    return availableStops[availableStops.length - 1]?.id || ride.end_stop_id;
  }, [defaultDropStopId, availableStops, ride.end_stop_id]);

  const [pickupStopId, setPickupStopId] = useState(initialPickup);
  const [dropStopId, setDropStopId] = useState(initialDrop);

  // Current selected stop objects
  const selectedPickup = availableStops.find((s) => s.id === pickupStopId);
  const selectedDrop = availableStops.find((s) => s.id === dropStopId);

  // Live estimated fare
  const estimatedFare = useMemo(() => {
    if (!selectedPickup || !selectedDrop) return ride.estimated_fare;
    const km = Math.abs(selectedDrop.km_from_start - selectedPickup.km_from_start);
    return Math.round(km * ride.rate_per_km);
  }, [selectedPickup, selectedDrop, ride.rate_per_km, ride.estimated_fare]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPickup || !selectedDrop) {
      toast.error("Pickup aur drop stop select karein");
      return;
    }

    if (selectedPickup.stop_order >= selectedDrop.stop_order) {
      toast.error("Pickup stop, drop stop se pehle hona chahiye");
      return;
    }

    startTransition(async () => {
      const res = await requestSeatAction({
        rideId: ride.ride_id,
        pickupStopId,
        dropStopId,
      });

      if (!res.success) {
        toast.error(res.error || "Request bhejne mein problem aayi");
      } else {
        setIsSuccess(true);
        toast.success(res.message || "Request bhej di. Owner accept karega.");
        setTimeout(() => {
          setIsSuccess(false);
          onOpenChange(false);
        }, 1200);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-xl">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-display font-semibold text-foreground">
            Request a Seat
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose your boarding and drop off stops for this commute
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <CheckCircle2 className="size-12 text-lime animate-in zoom-in-75 duration-300" />
            <h4 className="text-base font-semibold text-foreground">
              Request bhej di!
            </h4>
            <p className="text-xs text-muted-foreground">
              Owner accept karega toh details reveal ho jaengi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Driver & Vehicle info banner */}
            <div className="p-3 rounded-lg bg-surface-2 border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-surface-3 flex items-center justify-center">
                  <User className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      {ride.owner_name}
                    </span>
                    {ride.is_verified_driver && <VerifiedDriverBadge />}
                  </div>
                  <VehicleBadge
                    vehicleType={ride.vehicle_type}
                    brandModel={ride.vehicle_brand_model}
                    color={ride.vehicle_color}
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-lime font-medium">
                  {ride.ride_time ? ride.ride_time.slice(0, 5) : ""}
                </span>
                <p className="text-[10px] font-mono text-muted-foreground">
                  ₹{ride.rate_per_km}/km
                </p>
              </div>
            </div>

            {/* Pickup & Drop Dropdowns */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="req-pickup" className="text-xs font-mono text-muted-foreground uppercase">
                  Boarding Point
                </Label>
                <Select
                  value={pickupStopId}
                  onValueChange={(val) => setPickupStopId(val ?? "")}
                >
                  <SelectTrigger id="req-pickup" className="h-10 bg-surface-3 border-border">
                    <SelectValue placeholder="Pickup stop" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {availableStops.map((stop) => (
                      <SelectItem key={stop.id} value={stop.id}>
                        {stop.name} ({stop.km_from_start} km)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="req-drop" className="text-xs font-mono text-muted-foreground uppercase">
                  Drop-off Point
                </Label>
                <Select
                  value={dropStopId}
                  onValueChange={(val) => setDropStopId(val ?? "")}
                >
                  <SelectTrigger id="req-drop" className="h-10 bg-surface-3 border-border">
                    <SelectValue placeholder="Drop stop" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {availableStops.map((stop) => (
                      <SelectItem key={stop.id} value={stop.id}>
                        {stop.name} ({stop.km_from_start} km)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Fare Breakdown card */}
            <div className="p-3 rounded-lg bg-surface-3/80 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Estimated Fare
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Final after more riders join
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-foreground">
                  ₹{estimatedFare}
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isPending}
                className="gap-2 bg-lime text-ink font-semibold hover:bg-lime-hover"
                data-testid="send-request-submit-button"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send request</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
