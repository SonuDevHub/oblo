// src/lib/validation/vehicle-schema.ts
import { z } from "zod";
import { isValidSeatCount } from "@/lib/vehicles/vehicle-seat-limits";

// Standard Indian vehicle plate regex (without spaces)
export const PLATE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

export const vehicleSchema = z
  .object({
    vehicleType: z.enum(["car", "bike"], {
      message: "Vehicle type 'car' ya 'bike' hona chahiye",
    }),
    makeModel: z
      .string()
      .min(2, "Make & Model kam se kam 2 characters")
      .max(60, "Make & Model max 60 characters"),
    color: z
      .string()
      .min(2, "Color kam se kam 2 characters")
      .max(30, "Color max 30 characters"),
    plateNumber: z
      .string()
      .min(4, "Number plate daalna zaroori hai")
      .transform((val) => val.replace(/\s+/g, "").toUpperCase())
      .refine((val) => PLATE_REGEX.test(val), {
        message: "Valid Indian plate format daalein (e.g. DL01AB1234, RJ14AB1234)",
      }),
    totalSeats: z.coerce.number().int().min(1).max(3),
  })
  .refine((data) => isValidSeatCount(data.vehicleType, data.totalSeats), {
    message: "Bike pe sirf 1 seat aur car mein 1–3 seats ho sakti hain",
    path: ["totalSeats"],
  });

export type VehicleInput = z.infer<typeof vehicleSchema>;
