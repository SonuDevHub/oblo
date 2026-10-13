"use client";

import * as React from "react";
import { toast } from "sonner";
import { Car, Bike, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteVehicleAction } from "@/actions/vehicle-actions";

export interface VehicleData {
  id: string;
  owner_id: string;
  vehicle_type: "car" | "bike";
  brand_model: string;
  color: string;
  plate_number: string;
}

interface VehicleCardProps {
  vehicle: VehicleData;
  onEdit?: (vehicle: VehicleData) => void;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm(`Kya aap "${vehicle.brand_model}" remove karna chahte hain?`)) return;

    setIsDeleting(true);
    try {
      const res = await deleteVehicleAction(vehicle.id);
      if (!res.success) {
        throw new Error(res.error);
      }
      toast.success(res.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gaadi delete nahi ho saki";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const isBike = vehicle.vehicle_type === "bike";

  return (
    <Card className="bg-card border-border hover:border-n-600 transition-colors shadow-card relative overflow-hidden">
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {/* Icon in 40px circle */}
          <div className="size-10 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center text-lime shrink-0">
            {isBike ? <Bike className="size-5" /> : <Car className="size-5" />}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground text-base">{vehicle.brand_model}</h4>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className="inline-block size-2.5 rounded-full border border-border"
                  style={{ backgroundColor: vehicle.color.toLowerCase() }}
                />
                {vehicle.color}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {/* Indian style number plate */}
              <span className="inline-block bg-brand-paper text-brand-ink font-mono font-bold rounded-sm border-2 border-brand-ink px-2 py-0.5 text-xs tracking-wider shadow-sm">
                {vehicle.plate_number}
              </span>

              <span className="text-xs text-muted-foreground font-medium">
                {isBike ? "🏍️ Bike · 1 seat" : "🚗 Car · 1–3 seats"}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            disabled={isDeleting}
            onClick={handleDelete}
            className="size-8 text-muted-foreground hover:text-status-rejected hover:bg-status-rejected/10"
            title="Gaadi remove karein"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
