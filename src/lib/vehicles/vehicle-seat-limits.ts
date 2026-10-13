// src/lib/vehicles/vehicle-seat-limits.ts
// Domain rules for vehicle seat limits (PRD & TECH.md)

export type VehicleType = "car" | "bike";

export const VEHICLE_SEAT_LIMITS = {
  bike: {
    min: 1,
    max: 1,
    default: 1,
    label: "Bike (1 seat passenger)",
  },
  car: {
    min: 1,
    max: 3,
    default: 2,
    label: "Car (1 to 3 passenger seats)",
  },
} as const;

export function getVehicleSeatOptions(type: VehicleType): number[] {
  if (type === "bike") return [1];
  return [1, 2, 3];
}

export function isValidSeatCount(type: VehicleType, seats: number): boolean {
  if (type === "bike") return seats === 1;
  if (type === "car") return seats >= 1 && seats <= 3;
  return false;
}
