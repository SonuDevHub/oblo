// src/components/rides/ride-search-filters.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterStop {
  id: string;
  name: string;
  stop_order: number;
  km_from_start: number;
  route_id: string;
}

interface RideSearchFiltersProps {
  stops: FilterStop[];
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  initialTime?: string;
  initialVehicle?: string;
  initialHideFull?: boolean;
}

// Generate 15-minute time slots from 06:00 to 22:00
const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  const hourStr = h.toString().padStart(2, "0");
  TIME_SLOTS.push(`${hourStr}:00`);
  if (h < 22) {
    TIME_SLOTS.push(`${hourStr}:15`);
    TIME_SLOTS.push(`${hourStr}:30`);
    TIME_SLOTS.push(`${hourStr}:45`);
  }
}

export function RideSearchFilters({
  stops,
  initialFrom = "",
  initialTo = "",
  initialDate = "",
  initialTime = "",
  initialVehicle = "any",
  initialHideFull = false,
}: RideSearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [fromStop, setFromStop] = useState(initialFrom);
  const [toStop, setToStop] = useState(initialTo);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [hideFull, setHideFull] = useState(initialHideFull);
  const [isRotated, setIsRotated] = useState(false);

  // Today and Tomorrow strings (YYYY-MM-DD)
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split("T")[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(todayObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split("T")[0];

  // Sync state if initial props change (e.g. browser back/forward)
  useEffect(() => {
    setFromStop(searchParams.get("from") || initialFrom || "");
    setToStop(searchParams.get("to") || initialTo || "");
    setDate(searchParams.get("date") || initialDate || "");
    setTime(searchParams.get("time") || initialTime || "");
    setVehicle(searchParams.get("vehicle") || initialVehicle || "any");
    setHideFull(searchParams.get("hideFull") === "true");
  }, [searchParams, initialFrom, initialTo, initialDate, initialTime, initialVehicle, initialHideFull]);

  // Apply filters to URL
  const applyFilters = (overrides?: {
    from?: string;
    to?: string;
    date?: string;
    time?: string;
    vehicle?: string;
    hideFull?: boolean;
  }) => {
    const f = overrides?.from !== undefined ? overrides.from : fromStop;
    const t = overrides?.to !== undefined ? overrides.to : toStop;
    const d = overrides?.date !== undefined ? overrides.date : date;
    const tm = overrides?.time !== undefined ? overrides.time : time;
    const v = overrides?.vehicle !== undefined ? overrides.vehicle : vehicle;
    const hf = overrides?.hideFull !== undefined ? overrides.hideFull : hideFull;

    const params = new URLSearchParams();
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    if (d) params.set("date", d);
    if (tm && tm !== "any") params.set("time", tm);
    if (v && v !== "any") params.set("vehicle", v);
    if (hf) params.set("hideFull", "true");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSwapStops = () => {
    setIsRotated((prev) => !prev);
    const newFrom = toStop;
    const newTo = fromStop;
    setFromStop(newFrom);
    setToStop(newTo);
    applyFilters({ from: newFrom, to: newTo });
  };

  const handleTodayClick = () => {
    setDate(todayStr);
    applyFilters({ date: todayStr });
  };

  const handleTomorrowClick = () => {
    setDate(tomorrowStr);
    applyFilters({ date: tomorrowStr });
  };

  const handleMorningClick = () => {
    const morningTime = "08:15";
    setTime(morningTime);
    applyFilters({ time: morningTime });
  };

  return (
    <Card className="p-4 md:p-5 rounded-xl bg-card border border-border space-y-4">
      {/* Header Display */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground">
            Kahan <span className="text-lime">jaana</span> hai?
          </h2>
          <p className="text-xs text-muted-foreground">
            Pick your commute route and timing
          </p>
        </div>
        {isPending && (
          <span className="text-xs font-mono text-lime animate-pulse">
            Updating...
          </span>
        )}
      </div>

      {/* From & To with Swap */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="from-stop" className="text-xs font-mono text-muted-foreground uppercase">
            Boarding Stop
          </Label>
          <Select
            value={fromStop}
            onValueChange={(val) => {
              const safeVal = val ?? "";
              setFromStop(safeVal);
              applyFilters({ from: safeVal });
            }}
          >
            <SelectTrigger id="from-stop" className="h-10 bg-surface-3 border-border">
              <SelectValue placeholder="Boarding Stop chunein" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {stops.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.km_from_start} km)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSwapStops}
            className="h-7 px-3 text-xs gap-1.5 rounded-pill border-border bg-surface-2 hover:bg-surface-3 hover:text-lime"
            aria-label="Swap pickup and drop stops"
          >
            <ArrowUpDown
              className={cn(
                "size-3.5 transition-transform duration-300",
                isRotated ? "rotate-180" : ""
              )}
            />
            <span>Swap</span>
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="to-stop" className="text-xs font-mono text-muted-foreground uppercase">
            Drop Stop
          </Label>
          <Select
            value={toStop}
            onValueChange={(val) => {
              const safeVal = val ?? "";
              setToStop(safeVal);
              applyFilters({ to: safeVal });
            }}
          >
            <SelectTrigger id="to-stop" className="h-10 bg-surface-3 border-border">
              <SelectValue placeholder="Drop Stop chunein" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {stops.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.km_from_start} km)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date & Preferred Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="search-date" className="text-xs font-mono text-muted-foreground uppercase">
            Date
          </Label>
          <div className="relative">
            <input
              id="search-date"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                applyFilters({ date: e.target.value });
              }}
              className="w-full h-10 px-3 text-sm bg-surface-3 border border-border rounded-md text-foreground focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="search-time" className="text-xs font-mono text-muted-foreground uppercase">
            Time (15m slot)
          </Label>
          <Select
            value={time || "any"}
            onValueChange={(val) => {
              const safeVal = val ?? "";
              setTime(safeVal === "any" ? "" : safeVal);
              applyFilters({ time: safeVal === "any" ? "" : safeVal });
            }}
          >
            <SelectTrigger id="search-time" className="h-10 bg-surface-3 border-border">
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-56">
              <SelectItem value="any">Any time</SelectItem>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vehicle Type Toggle */}
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground uppercase">
          Vehicle Type
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "any", label: "Any" },
            { id: "car", label: "🚗 Car" },
            { id: "bike", label: "🏍️ Bike" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setVehicle(item.id);
                applyFilters({ vehicle: item.id });
              }}
              className={cn(
                "h-9 rounded-md text-xs font-medium border transition-colors flex items-center justify-center",
                vehicle === item.id
                  ? "bg-lime text-black border-lime font-semibold"
                  : "bg-surface-3 text-muted-foreground border-border hover:bg-surface-2 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Chips & Hide Full Switch */}
      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleTodayClick}
            className={cn(
              "px-2.5 py-1 text-xs font-mono rounded-pill border transition-colors",
              date === todayStr
                ? "bg-accent text-lime border-lime/40"
                : "bg-surface-3 text-muted-foreground border-border hover:text-foreground"
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleTomorrowClick}
            className={cn(
              "px-2.5 py-1 text-xs font-mono rounded-pill border transition-colors",
              date === tomorrowStr
                ? "bg-accent text-lime border-lime/40"
                : "bg-surface-3 text-muted-foreground border-border hover:text-foreground"
            )}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={handleMorningClick}
            className={cn(
              "px-2.5 py-1 text-xs font-mono rounded-pill border transition-colors",
              time === "08:15"
                ? "bg-accent text-lime border-lime/40"
                : "bg-surface-3 text-muted-foreground border-border hover:text-foreground"
            )}
          >
            Morning (08:15)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="hide-full" className="text-xs text-muted-foreground cursor-pointer">
            Hide full
          </Label>
          <Switch
            id="hide-full"
            checked={hideFull}
            onCheckedChange={(checked) => {
              setHideFull(checked);
              applyFilters({ hideFull: checked });
            }}
          />
        </div>
      </div>
    </Card>
  );
}
