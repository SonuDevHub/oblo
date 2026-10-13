// src/actions/request-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { seatRequestSchema, SeatRequestFormData } from "@/lib/validation/seat-request-schema";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

export interface RequestActionResult {
  success: boolean;
  message?: string;
  error?: string;
  requestId?: string;
}

export async function requestSeatAction(data: SeatRequestFormData): Promise<RequestActionResult> {
  const parsed = seatRequestSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || APP_MESSAGES.GENERIC_ERROR,
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { data: requestRow, error } = await supabase.rpc("request_seat", {
    p_ride_id: parsed.data.rideId,
    p_pickup_stop_id: parsed.data.pickupStopId,
    p_drop_stop_id: parsed.data.dropStopId,
  });

  if (error) {
    return {
      success: false,
      error: error.message || APP_MESSAGES.GENERIC_ERROR,
    };
  }

  revalidatePath("/rides/search");
  revalidatePath("/rides/mine");
  revalidatePath("/requests/mine");

  return {
    success: true,
    message: APP_MESSAGES.REQUEST_SENT,
    requestId: requestRow?.id || (typeof requestRow === "string" ? requestRow : undefined),
  };
}

export async function respondToRequestAction({
  requestId,
  status,
}: {
  requestId: string;
  status: "Accepted" | "Rejected";
}): Promise<RequestActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { data: resultMessage, error } = await supabase.rpc("respond_to_request", {
    p_request_id: requestId,
    p_status: status,
  });

  if (error) {
    return {
      success: false,
      error: error.message || APP_MESSAGES.GENERIC_ERROR,
    };
  }

  revalidatePath("/rides/search");
  revalidatePath("/rides/mine");
  revalidatePath("/requests/mine");

  return {
    success: true,
    message: typeof resultMessage === "string" ? resultMessage : `Request ${status.toLowerCase()} ho gayi`,
  };
}

export async function cancelRequestAction({
  requestId,
}: {
  requestId: string;
}): Promise<RequestActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase.rpc("cancel_request", {
    p_request_id: requestId,
  });

  if (error) {
    return {
      success: false,
      error: error.message || APP_MESSAGES.GENERIC_ERROR,
    };
  }

  revalidatePath("/rides/search");
  revalidatePath("/rides/mine");
  revalidatePath("/requests/mine");

  return {
    success: true,
    message: APP_MESSAGES.REQUEST_CANCELLED,
  };
}
