"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { rideOfferSchema, type RideOfferInput } from "@/lib/validation/ride-offer-schema";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

export async function createRideAction(data: RideOfferInput) {
  const parsed = rideOfferSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  // Combine date and time
  const departureDate = new Date(`${parsed.data.departureDate}T${parsed.data.departureTime}:00`);
  if (isNaN(departureDate.getTime())) {
    return { success: false, error: "Valid date aur time select karein" };
  }

  if (departureDate.getTime() <= Date.now()) {
    return { success: false, error: APP_MESSAGES.PAST_RIDE };
  }

  const supabase = await createServerClient();
  const { data: rideId, error } = await supabase.rpc("create_ride", {
    p_vehicle_id: parsed.data.vehicleId,
    p_route_id: parsed.data.routeId,
    p_start_stop_id: parsed.data.startStopId,
    p_end_stop_id: parsed.data.endStopId,
    p_ride_date: parsed.data.departureDate,
    p_ride_time: parsed.data.departureTime.length === 5 ? `${parsed.data.departureTime}:00` : parsed.data.departureTime,
    p_total_seats: parsed.data.availableSeats,
    p_rate_per_km: parsed.data.ratePerKm,
  });

  if (error) {
    let msg = error.message;
    if (msg.includes("verified driver")) {
      msg = APP_MESSAGES.NOT_VERIFIED_OFFER;
    } else if (msg.includes("own vehicle")) {
      msg = APP_MESSAGES.NOT_YOUR_VEHICLE;
    } else if (msg.includes("Bike")) {
      msg = APP_MESSAGES.BIKE_SEAT_LIMIT;
    } else if (msg.includes("Car")) {
      msg = APP_MESSAGES.CAR_SEAT_LIMIT;
    } else if (msg.includes("future")) {
      msg = APP_MESSAGES.PAST_RIDE;
    }
    return { success: false, error: msg };
  }

  revalidatePath("/rides/search");
  revalidatePath("/rides/mine");
  revalidatePath("/rides/new");

  return {
    success: true,
    message: APP_MESSAGES.RIDE_POSTED,
    rideId,
  };
}

export async function cancelRideAction(rideId: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("cancel_ride", {
    p_ride_id: rideId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/rides/search");
  revalidatePath("/rides/mine");

  return {
    success: true,
    message: APP_MESSAGES.RIDE_CANCELLED,
  };
}
