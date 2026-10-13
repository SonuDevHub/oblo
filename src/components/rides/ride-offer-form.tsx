"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, Bike, Lock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createRideAction } from "@/actions/ride-actions";
import { type VehicleData } from "@/components/vehicles/vehicle-card";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

export interface RouteWithStops {
  id: string;
  name: string;
  stops: {
    id: string;
    name: string;
    stop_order: number;
    km_from_start: number;
  }[];
}

interface RideOfferFormProps {
  vehicles: VehicleData[];
  routes: RouteWithStops[];
}

export function RideOfferForm({ vehicles, routes }: RideOfferFormProps) {
  const router = useRouter();

  // Selected vehicle state
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>(
    vehicles[0]?.id || ""
  );

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const isBike = selectedVehicle?.vehicle_type === "bike";

  // Seats state (bike = 1, car = 1..3)
  const [availableSeats, setAvailableSeats] = React.useState<number>(
    isBike ? 1 : 2
  );

  // When vehicle changes, adjust seats and default rate
  const handleVehicleChange = (id: string) => {
    setSelectedVehicleId(id);
    const veh = vehicles.find((v) => v.id === id);
    if (veh?.vehicle_type === "bike") {
      setAvailableSeats(1);
      setRatePerKm(3);
    } else {
      setAvailableSeats(2);
      setRatePerKm(8);
    }
  };

  // Route & Stops state
  const [selectedRouteId, setSelectedRouteId] = React.useState<string>(
    routes[0]?.id || ""
  );

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const sortedStops = React.useMemo(() => {
    return [...(selectedRoute?.stops || [])].sort((a, b) => a.stop_order - b.stop_order);
  }, [selectedRoute]);

  const [startStopId, setStartStopId] = React.useState<string>(
    sortedStops[0]?.id || ""
  );
  const [endStopId, setEndStopId] = React.useState<string>(
    sortedStops[sortedStops.length - 1]?.id || ""
  );

  // Sync stops when route changes
  React.useEffect(() => {
    if (sortedStops.length > 0) {
      setStartStopId(sortedStops[0].id);
      setEndStopId(sortedStops[sortedStops.length - 1].id);
    }
  }, [selectedRouteId, sortedStops]);

  // Date and Time (default tomorrow at 08:30)
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [departureDate, setDepartureDate] = React.useState(tomorrowStr);
  const [departureTime, setDepartureTime] = React.useState("08:30");
  const [ratePerKm, setRatePerKm] = React.useState(isBike ? 3 : 8);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Live distance and cost calculations
  const startStop = sortedStops.find((s) => s.id === startStopId);
  const endStop = sortedStops.find((s) => s.id === endStopId);

  const tripKm = React.useMemo(() => {
    if (!startStop || !endStop) return 0;
    return Math.max(0, Number(endStop.km_from_start) - Number(startStop.km_from_start));
  }, [startStop, endStop]);

  const totalTripCost = Math.round(tripKm * Number(ratePerKm));
  const isValidStopOrder = startStop && endStop && endStop.stop_order > startStop.stop_order;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicleId) {
      toast.error(APP_MESSAGES.NO_VEHICLE);
      return;
    }

    if (!isValidStopOrder) {
      toast.error("Drop stop hamesha Pickup stop ke baad hona chahiye");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createRideAction({
        vehicleId: selectedVehicleId,
        routeId: selectedRouteId,
        startStopId,
        endStopId,
        departureDate,
        departureTime,
        availableSeats: isBike ? 1 : Number(availableSeats),
        ratePerKm: Number(ratePerKm),
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success(res.message);
      router.push("/rides/mine");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : APP_MESSAGES.GENERIC_ERROR;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main form */}
      <Card className="lg:col-span-2 bg-card border-border shadow-card">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold font-display text-foreground">
            Ride Details
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Apna route, gaadi aur time select karke ride offer karein.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Vehicle Selection Radio Cards */}
            <div className="space-y-2">
              <Label>Select Vehicle</Label>
              <RadioGroup
                value={selectedVehicleId}
                onValueChange={handleVehicleChange}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {vehicles.map((v) => {
                  const isCurrentBike = v.vehicle_type === "bike";
                  const isSelected = v.id === selectedVehicleId;
                  return (
                    <label
                      key={v.id}
                      htmlFor={`veh-${v.id}`}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-lime/10 border-lime text-foreground"
                          : "bg-surface-3 border-border text-muted-foreground hover:border-n-600"
                      }`}
                    >
                      <RadioGroupItem value={v.id} id={`veh-${v.id}`} className="mt-1 border-border text-lime" />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-medium text-foreground text-sm truncate">
                          {isCurrentBike ? <Bike className="size-4 text-lime shrink-0" /> : <Car className="size-4 text-lime shrink-0" />}
                          <span className="truncate">{v.brand_model}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] bg-paper text-ink px-1.5 py-0.2 rounded border border-ink">
                            {v.plate_number}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">{v.color}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {/* 2. Seats Selection */}
            <div className="space-y-2">
              <Label>Available Seats (Riders)</Label>
              {isBike ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-3 border border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-medium">
                    <Lock className="size-3.5 text-lime" />
                    {APP_MESSAGES.BIKE_SEAT_LIMIT}
                  </span>
                  <span className="font-mono font-bold text-lime text-sm">1 seat</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((num) => {
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAvailableSeats(num)}
                        className={`py-2 px-3 rounded-md text-sm font-semibold border transition-colors ${
                          availableSeats === num
                            ? "bg-lime text-ink border-lime shadow-sm"
                            : "bg-surface-3 text-foreground border-border hover:border-n-600"
                        }`}
                      >
                        {num} {num === 1 ? "seat" : "seats"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Route Selection */}
            <div className="space-y-2">
              <Label htmlFor="route-select">Route</Label>
              <select
                id="route-select"
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full h-11 px-3 rounded-md bg-surface-3 border border-border text-foreground text-sm focus:border-lime focus:outline-none"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Pickup & Drop Stops */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-stop">Start Stop (Pickup)</Label>
                <select
                  id="start-stop"
                  value={startStopId}
                  onChange={(e) => setStartStopId(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-surface-3 border border-border text-foreground text-sm focus:border-lime focus:outline-none"
                >
                  {sortedStops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.km_from_start} km)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-stop">End Stop (Drop)</Label>
                <select
                  id="end-stop"
                  value={endStopId}
                  onChange={(e) => setEndStopId(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-surface-3 border border-border text-foreground text-sm focus:border-lime focus:outline-none"
                >
                  {sortedStops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.km_from_start} km)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!isValidStopOrder && (
              <p className="text-xs text-status-rejected font-medium">
                End stop hamesha Start stop ke baad aana chahiye.
              </p>
            )}

            {/* 5. Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dep-date">Departure Date</Label>
                <Input
                  id="dep-date"
                  type="date"
                  min={todayStr}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  className="bg-surface-3 border-border focus:border-lime"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-time">Departure Time</Label>
                <Input
                  id="dep-time"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="bg-surface-3 border-border focus:border-lime"
                />
              </div>
            </div>

            {/* 6. Rate per km */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rate-km">Rate per km</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  Default: {isBike ? "₹3/km" : "₹8/km"} (Allowed: ₹1–50)
                </span>
              </div>
              <div className="relative">
                <Input
                  id="rate-km"
                  type="number"
                  min={1}
                  max={50}
                  value={ratePerKm}
                  onChange={(e) => setRatePerKm(Number(e.target.value))}
                  required
                  className="bg-surface-3 border-border focus:border-lime font-mono text-base pr-12"
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono">
                  ₹/km
                </span>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting || !isValidStopOrder}
              className="w-full bg-lime text-ink hover:bg-lime-hover active:bg-lime-press font-semibold h-11 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Posting Ride...
                </>
              ) : (
                "Post Ride"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Live Preview Column (Sticky on lg) */}
      <div className="space-y-4 lg:sticky lg:top-24 h-fit">
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold font-display text-foreground">
              Ride Summary Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Vehicle:</span>
              <span className="font-medium text-foreground">
                {selectedVehicle?.brand_model || "None"} ({isBike ? "Bike" : "Car"})
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Capacity:</span>
              <span className="font-medium text-lime font-mono">
                Driver + {availableSeats} {availableSeats === 1 ? "rider" : "riders"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Distance:</span>
              <span className="font-mono font-medium text-foreground">{tripKm} km</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Rate:</span>
              <span className="font-mono font-medium text-foreground">₹{ratePerKm} / km</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Estimated Total Trip Cost</p>
                <p className="text-2xl font-bold font-mono text-lime">₹{totalTripCost}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Split between</p>
                <p className="text-foreground font-semibold">
                  Driver + {availableSeats} riders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
