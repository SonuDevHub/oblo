"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { vehicleSchema, type VehicleInput } from "@/lib/validation/vehicle-schema";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

export async function addVehicleAction(data: VehicleInput) {
  const parsed = vehicleSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createServerClient();
  const { data: vehicleId, error } = await supabase.rpc("add_vehicle", {
    p_vehicle_type: parsed.data.vehicleType,
    p_brand_model: parsed.data.makeModel,
    p_color: parsed.data.color,
    p_plate_number: parsed.data.plateNumber,
  });

  if (error) {
    let msg = error.message;
    if (msg.includes("plate_number") || msg.includes("unique")) {
      msg = APP_MESSAGES.PLATE_EXISTS;
    }
    return { success: false, error: msg };
  }

  revalidatePath("/vehicles");
  revalidatePath("/rides/new");

  return {
    success: true,
    message: APP_MESSAGES.VEHICLE_ADDED,
    vehicleId,
  };
}

export async function updateVehicleAction(
  vehicleId: string,
  data: Omit<VehicleInput, "vehicleType">
) {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("update_vehicle", {
    p_vehicle_id: vehicleId,
    p_brand_model: data.makeModel,
    p_color: data.color,
    p_plate_number: data.plateNumber.replace(/\s+/g, "").toUpperCase(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/vehicles");
  revalidatePath("/rides/new");

  return {
    success: true,
    message: APP_MESSAGES.VEHICLE_UPDATED,
  };
}

export async function deleteVehicleAction(vehicleId: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("delete_vehicle", {
    p_vehicle_id: vehicleId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/vehicles");
  revalidatePath("/rides/new");

  return {
    success: true,
    message: APP_MESSAGES.VEHICLE_DELETED,
  };
}
