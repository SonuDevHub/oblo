// src/components/rides/vehicle-badge.tsx
import React from "react";
import { Car, Bike } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleBadgeProps {
  vehicleType: "car" | "bike" | string;
  brandModel: string;
  color?: string | null;
  className?: string;
}

export function VehicleBadge({
  vehicleType,
  brandModel,
  color,
  className,
}: VehicleBadgeProps) {
  const isCar = vehicleType.toLowerCase() === "car";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <span className="flex items-center justify-center size-5 rounded-full bg-surface-3 text-foreground/80">
        {isCar ? (
          <Car className="size-3 text-lime" aria-hidden="true" />
        ) : (
          <Bike className="size-3 text-lime" aria-hidden="true" />
        )}
      </span>
      <span className="font-medium text-foreground">
        {brandModel}
      </span>
      {color && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <span>·</span>
          <span>{color}</span>
        </span>
      )}
    </div>
  );
}
