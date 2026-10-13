"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { driverVerificationSchema, type DriverVerificationInput } from "@/lib/validation/verification-schema";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

export async function submitVerificationAction(
  data: DriverVerificationInput & {
    collegeIdUrl: string;
    drivingLicenseUrl: string;
  }
) {
  const parsed = driverVerificationSchema.safeParse({
    collegeIdNumber: data.collegeIdNumber,
    drivingLicenseNumber: data.drivingLicenseNumber,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  if (!data.collegeIdUrl || !data.drivingLicenseUrl) {
    return {
      success: false,
      error: "Dono documents (College ID aur Driving License) upload karna zaroori hai",
    };
  }

  const supabase = await createServerClient();
  const { data: result, error } = await supabase.rpc("submit_driver_verification", {
    p_college_name: "Engineering College",
    p_roll_no: parsed.data.collegeIdNumber,
    p_course: "B.Tech",
    p_year: "3rd Year",
    p_id_card_path: data.collegeIdUrl,
    p_dl_number: parsed.data.drivingLicenseNumber,
    p_dl_path: data.drivingLicenseUrl,
  });

  if (error) {
    return {
      success: false,
      error: error.message || APP_MESSAGES.GENERIC_ERROR,
    };
  }

  revalidatePath("/verification");
  revalidatePath("/rides/new");
  revalidatePath("/admin/verifications");

  return {
    success: true,
    message: APP_MESSAGES.VERIFICATION_SUBMITTED,
    data: result,
  };
}

export async function adminReviewVerificationAction(
  verificationId: string,
  action: "approve" | "reject",
  rejectionReason?: string
) {
  const supabase = await createServerClient();
  const { data: result, error } = await supabase.rpc("admin_review_verification", {
    p_verification_id: verificationId,
    p_approve: action === "approve",
    p_reason: rejectionReason || undefined,
  });

  if (error) {
    return {
      success: false,
      error: error.message || APP_MESSAGES.GENERIC_ERROR,
    };
  }

  revalidatePath("/verification");
  revalidatePath("/rides/new");
  revalidatePath("/admin");
  revalidatePath("/admin/verifications");

  return {
    success: true,
    message: action === "approve" ? APP_MESSAGES.VERIFICATION_APPROVED : APP_MESSAGES.VERIFICATION_REJECTED,
    data: result,
  };
}
