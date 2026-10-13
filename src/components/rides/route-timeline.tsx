// src/components/rides/route-timeline.tsx
import React from "react";
import { cn } from "@/lib/utils";

export interface RouteStop {
  id: string;
  name: string;
  stop_order: number;
  km_from_start: number;
}

interface RouteTimelineProps {
  variant?: "compact" | "full";
  stops: RouteStop[];
  startStopId: string;
  endStopId: string;
  pickupStopId?: string | null;
  dropStopId?: string | null;
  departureTime?: string;
  driverName?: string;
  className?: string;
}

export function RouteTimeline({
  variant = "compact",
  stops,
  startStopId,
  endStopId,
  pickupStopId,
  dropStopId,
  departureTime,
  driverName,
  className,
}: RouteTimelineProps) {
  // Sort stops by order
  const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
  const minKm = sortedStops[0]?.km_from_start ?? 0;
  const maxKm = Math.max(1, sortedStops[sortedStops.length - 1]?.km_from_start ?? 12);
  const totalKm = maxKm - minKm;

  // Find start, end, pickup, drop stops
  const startStop = sortedStops.find((s) => s.id === startStopId) || sortedStops[0];
  const endStop = sortedStops.find((s) => s.id === endStopId) || sortedStops[sortedStops.length - 1];

  const pickupStop = pickupStopId
    ? sortedStops.find((s) => s.id === pickupStopId)
    : startStop;
  const dropStop = dropStopId
    ? sortedStops.find((s) => s.id === dropStopId)
    : endStop;

  // Helper to map km to 0..100 percentage
  const getPercent = (km: number) => {
    return Math.max(0, Math.min(100, ((km - minKm) / totalKm) * 100));
  };

  const startPct = getPercent(startStop?.km_from_start ?? 0);
  const endPct = getPercent(endStop?.km_from_start ?? maxKm);
  const pickupPct = getPercent(pickupStop?.km_from_start ?? startPct);
  const dropPct = getPercent(dropStop?.km_from_start ?? endPct);

  const ariaDescription = `Route: ${startStop?.name ?? "Start"} to ${
    endStop?.name ?? "End"
  }, ${totalKm} km. Rider stretch: ${pickupStop?.name ?? "Pickup"} to ${
    dropStop?.name ?? "Drop"
  }.`;

  if (variant === "compact") {
    return (
      <div className={cn("w-full space-y-1.5", className)}>
        {/* Departure & Arrival Header */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            {departureTime && <span className="text-lime">{departureTime.slice(0, 5)}</span>}
            <span className="truncate max-w-[130px]">{startStop?.name}</span>
          </span>
          <span className="truncate max-w-[130px] text-right font-medium text-foreground">
            {endStop?.name}
          </span>
        </div>

        {/* SVG Route Line */}
        <div className="relative py-2">
          <svg
            className="w-full h-4 overflow-visible"
            role="img"
            aria-label={ariaDescription}
            viewBox="0 0 100 16"
            preserveAspectRatio="none"
          >
            {/* Base route line (muted) */}
            <line
              x1={startPct}
              y1="8"
              x2={endPct}
              y2="8"
              stroke="var(--color-border, #27272a)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Rider stretch line (lime highlight) */}
            <line
              x1={Math.min(pickupPct, dropPct)}
              y1="8"
              x2={Math.max(pickupPct, dropPct)}
              y2="8"
              stroke="var(--color-lime, #c8ff00)"
              strokeWidth="4"
              strokeLinecap="round"
              className="drop-shadow-[0_0_6px_rgba(200,255,0,0.5)]"
            />

            {/* Intermediate stop dots */}
            {sortedStops.map((stop) => {
              const pct = getPercent(stop.km_from_start);
              const isStartOrEnd = stop.id === startStopId || stop.id === endStopId;
              const isRiderStop = stop.id === pickupStop?.id || stop.id === dropStop?.id;

              return (
                <circle
                  key={stop.id}
                  cx={pct}
                  cy="8"
                  r={isStartOrEnd || isRiderStop ? "3.5" : "2"}
                  fill={isRiderStop ? "var(--color-lime, #c8ff00)" : "var(--color-card, #111113)"}
                  stroke={isRiderStop ? "var(--color-lime, #c8ff00)" : "var(--color-border, #3f3f46)"}
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>

        {/* Stretch caption */}
        {pickupStop && dropStop && (pickupStop.id !== startStop.id || dropStop.id !== endStop.id) && (
          <div className="flex items-center gap-1 text-[11px] text-lime/90 font-mono">
            <span>◆ Board: {pickupStop.name}</span>
            <span>→</span>
            <span>Drop: {dropStop.name}</span>
          </div>
        )}

        {/* Visually hidden list for accessibility */}
        <ol className="sr-only">
          {sortedStops.map((stop) => (
            <li key={stop.id}>
              {stop.name} ({stop.km_from_start} km)
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // Full variant for map panel (Desktop sticky / Mobile sheet)
  return (
    <div className={cn("w-full p-4 rounded-xl bg-card border border-border space-y-4", className)}>
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h4 className="font-display font-semibold text-sm text-foreground">
            Schematic Route Map
          </h4>
          <p className="text-xs text-muted-foreground font-mono">
            {totalKm} km · {sortedStops.length} campus stops
          </p>
        </div>
        {driverName && (
          <span className="text-xs font-medium text-lime px-2 py-0.5 rounded-pill bg-accent border border-lime/30">
            {driverName}
          </span>
        )}
      </div>

      {/* Metro Schematic SVG */}
      <div className="py-4">
        <svg
          className="w-full h-12 overflow-visible"
          role="img"
          aria-label={ariaDescription}
          viewBox="0 0 100 48"
          preserveAspectRatio="none"
        >
          {/* Background Grid Pattern Line */}
          <line
            x1="0"
            y1="24"
            x2="100"
            y2="24"
            stroke="var(--color-border, #27272a)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Active Ride Stretch */}
          <line
            x1={startPct}
            y1="24"
            x2={endPct}
            y2="24"
            stroke="var(--color-surface-3, #3f3f46)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Rider stretch highlighted in Lime */}
          <line
            x1={Math.min(pickupPct, dropPct)}
            y1="24"
            x2={Math.max(pickupPct, dropPct)}
            y2="24"
            stroke="var(--color-lime, #c8ff00)"
            strokeWidth="6"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(200,255,0,0.6)]"
          />

          {/* Stop Nodes */}
          {sortedStops.map((stop) => {
            const pct = getPercent(stop.km_from_start);
            const isRiderStop = stop.id === pickupStop?.id || stop.id === dropStop?.id;
            const isEnd = stop.id === endStopId || stop.id === startStopId;

            return (
              <g key={stop.id}>
                <circle
                  cx={pct}
                  cy="24"
                  r={isRiderStop ? 5 : isEnd ? 4.5 : 3.5}
                  fill={isRiderStop ? "var(--color-lime, #c8ff00)" : "var(--color-background, #09090b)"}
                  stroke={isRiderStop ? "var(--color-lime, #c8ff00)" : "var(--color-border, #52525b)"}
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Stop labels below SVG */}
        <div className="relative mt-2 h-14">
          {sortedStops.map((stop) => {
            const pct = getPercent(stop.km_from_start);
            const isRiderStop = stop.id === pickupStop?.id || stop.id === dropStop?.id;

            return (
              <div
                key={stop.id}
                style={{ left: `${pct}%` }}
                className={cn(
                  "absolute -translate-x-1/2 flex flex-col items-center text-center",
                  pct === 0 ? "translate-x-0 items-start" : "",
                  pct === 100 ? "-translate-x-full items-end" : ""
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium leading-tight whitespace-nowrap",
                    isRiderStop ? "text-lime font-bold" : "text-foreground/80"
                  )}
                >
                  {stop.name}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {stop.km_from_start} km
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ol className="sr-only">
        {sortedStops.map((stop) => (
          <li key={stop.id}>
            {stop.name} at {stop.km_from_start} km
          </li>
        ))}
      </ol>
    </div>
  );
}
