// src/lib/validation/ride-offer-schema.ts
import { z } from "zod";

export const rideOfferSchema = z
  .object({
    vehicleId: z.string().uuid("Valid vehicle select karein"),
    routeId: z.string().uuid("Valid route select karein"),
    startStopId: z.string().uuid("Start stop select karein"),
    endStopId: z.string().uuid("End stop select karein"),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date daalein (YYYY-MM-DD)"),
    departureTime: z.string().regex(/^\d{2}:\d{2}$/, "Valid time daalein (HH:MM)"),
    availableSeats: z.coerce.number().int().min(1).max(3),
    ratePerKm: z.coerce.number().min(1, "Min ₹1/km").max(50, "Max ₹50/km"),
  })
  .refine((data) => data.startStopId !== data.endStopId, {
    message: "Start aur End stop same nahi ho sakte",
    path: ["endStopId"],
  });

export type RideOfferInput = z.infer<typeof rideOfferSchema>;
