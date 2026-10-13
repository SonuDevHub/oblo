// src/lib/validation/seat-request-schema.ts
import { z } from "zod";

export const seatRequestSchema = z.object({
  rideId: z.string().uuid("Invalid ride ID"),
  pickupStopId: z.string().uuid("Pickup stop select karein"),
  dropStopId: z.string().uuid("Drop stop select karein"),
}).refine((data) => data.pickupStopId !== data.dropStopId, {
  message: "Pickup aur drop stop alag hone chahiye",
  path: ["dropStopId"],
});

export type SeatRequestFormData = z.infer<typeof seatRequestSchema>;
