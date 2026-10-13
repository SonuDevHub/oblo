"use client";

import * as React from "react";
import { toast } from "sonner";
import { Car, Bike, Loader2, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { addVehicleAction } from "@/actions/vehicle-actions";
import { type VehicleType } from "@/lib/vehicles/vehicle-seat-limits";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

interface VehicleFormProps {
  onSuccess?: () => void;
}

export function VehicleForm({ onSuccess }: VehicleFormProps) {
  const [open, setOpen] = React.useState(false);
  const [vehicleType, setVehicleType] = React.useState<VehicleType>("car");
  const [makeModel, setMakeModel] = React.useState("");
  const [color, setColor] = React.useState("");
  const [plateNumber, setPlateNumber] = React.useState("");
  const [totalSeats, setTotalSeats] = React.useState(2);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // When switching to bike, seats lock to 1
  const handleTypeChange = (val: string) => {
    const type = val as VehicleType;
    setVehicleType(type);
    if (type === "bike") {
      setTotalSeats(1);
    } else if (totalSeats === 1) {
      setTotalSeats(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const res = await addVehicleAction({
        vehicleType,
        makeModel: makeModel.trim(),
        color: color.trim(),
        plateNumber: plateNumber.trim(),
        totalSeats: vehicleType === "bike" ? 1 : Number(totalSeats),
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success(res.message);
      setOpen(false);
      // Reset form
      setMakeModel("");
      setColor("");
      setPlateNumber("");
      setTotalSeats(2);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : APP_MESSAGES.GENERIC_ERROR;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="bg-lime text-ink hover:bg-lime-hover active:bg-lime-press font-semibold inline-flex items-center justify-center rounded-lg h-8 px-2.5 text-sm gap-1.5 cursor-pointer">
        <Plus className="size-4 mr-1.5" />
        Add Vehicle
      </SheetTrigger>

      <SheetContent side="right" className="bg-popover border-border w-full sm:max-w-md p-6">
        <SheetHeader className="space-y-1 pb-4 border-b border-border">
          <SheetTitle className="text-xl font-bold font-display text-foreground">
            Apni Gaadi Add Karein
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Ride offer karne ke liye apni car ya bike register karein.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-5">
          {/* Vehicle Type Choice */}
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <RadioGroup
              value={vehicleType}
              onValueChange={handleTypeChange}
              className="grid grid-cols-2 gap-3"
            >
              <label
                htmlFor="type-car"
                className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  vehicleType === "car"
                    ? "bg-lime/10 border-lime text-foreground"
                    : "bg-surface-3 border-border text-muted-foreground hover:border-n-600"
                }`}
              >
                <RadioGroupItem value="car" id="type-car" className="border-border text-lime" />
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Car className="size-4 text-lime" />
                  <span>Car</span>
                </div>
              </label>

              <label
                htmlFor="type-bike"
                className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  vehicleType === "bike"
                    ? "bg-lime/10 border-lime text-foreground"
                    : "bg-surface-3 border-border text-muted-foreground hover:border-n-600"
                }`}
              >
                <RadioGroupItem value="bike" id="type-bike" className="border-border text-lime" />
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Bike className="size-4 text-lime" />
                  <span>Bike</span>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Make & Model */}
          <div className="space-y-2">
            <Label htmlFor="make-model">Make & Model</Label>
            <Input
              id="make-model"
              placeholder={vehicleType === "car" ? "e.g. Maruti Swift, Hyundai i20" : "e.g. Honda Activa, Royal Enfield"}
              value={makeModel}
              onChange={(e) => setMakeModel(e.target.value)}
              disabled={isSubmitting}
              required
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              placeholder="e.g. White, Black, Silver, Blue"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isSubmitting}
              required
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          {/* Plate Number */}
          <div className="space-y-2">
            <Label htmlFor="plate-number">Number Plate</Label>
            <Input
              id="plate-number"
              placeholder="e.g. DL01AB1234, RJ14AB1234"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              disabled={isSubmitting}
              required
              className="bg-surface-3 border-border font-mono uppercase focus:border-lime"
            />
            <p className="text-xs text-muted-foreground">Standard Indian format bina space ke (e.g. UP16AB1234)</p>
          </div>

          {/* Passenger Seats */}
          <div className="space-y-2">
            <Label htmlFor="total-seats">Passenger Seats (Driver ke alawa)</Label>
            {vehicleType === "bike" ? (
              <div className="p-3 rounded-lg bg-surface-3 border border-border text-xs text-muted-foreground flex items-center justify-between">
                <span>{APP_MESSAGES.BIKE_SEAT_LIMIT}</span>
                <span className="font-mono font-bold text-lime">1 seat</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalSeats(num)}
                    className={`py-2 px-3 rounded-md text-sm font-semibold border transition-colors ${
                      totalSeats === num
                        ? "bg-lime text-ink border-lime shadow-sm"
                        : "bg-surface-3 text-foreground border-border hover:border-n-600"
                    }`}
                  >
                    {num} {num === 1 ? "seat" : "seats"}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Car mein max 3 seats aur bike pe sirf 1 seat allowed hai.</p>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-lime text-ink hover:bg-lime-hover active:bg-lime-press font-semibold h-11"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Saving Vehicle...
                </>
              ) : (
                "Save Vehicle"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
