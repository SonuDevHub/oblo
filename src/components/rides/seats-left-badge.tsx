// src/components/rides/seats-left-badge.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface SeatsLeftBadgeProps {
  totalSeats: number;
  seatsLeft: number;
  isFull: boolean;
  className?: string;
}

export function SeatsLeftBadge({
  totalSeats,
  seatsLeft,
  isFull,
  className,
}: SeatsLeftBadgeProps) {
  const safeTotal = Math.max(1, totalSeats);
  const safeLeft = isFull ? 0 : Math.max(0, Math.min(seatsLeft, safeTotal));

  // Blocks: 1 per total seat. safeLeft blocks are filled lime, the rest are muted
  const blocks = Array.from({ length: safeTotal }, (_, i) => i < safeLeft);

  const labelText = isFull || safeLeft === 0
    ? "Full"
    : `${safeLeft}/${safeTotal} left`;

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      role="status"
      aria-label={`${safeLeft} of ${safeTotal} seats available`}
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {blocks.map((isAvailable, index) => (
          <span
            key={index}
            className={cn(
              "w-[10px] h-[14px] rounded-[3px] transition-colors border",
              isAvailable
                ? "bg-lime border-lime shadow-[0_0_6px_rgba(200,255,0,0.35)]"
                : "bg-surface-3 border-border"
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          "text-xs font-mono font-medium",
          isFull || safeLeft === 0
            ? "text-muted-foreground"
            : "text-foreground"
        )}
      >
        {labelText}
      </span>
    </div>
  );
}
