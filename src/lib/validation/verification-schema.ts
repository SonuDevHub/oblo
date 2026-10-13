// src/lib/validation/verification-schema.ts
import { z } from "zod";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

export const driverVerificationSchema = z.object({
  collegeIdNumber: z
    .string()
    .min(3, "College ID number kam se kam 3 characters ka hona chahiye")
    .max(50, "College ID number max 50 characters"),
  drivingLicenseNumber: z
    .string()
    .min(5, "Driving License number kam se kam 5 characters ka hona chahiye")
    .max(30, "Driving License number max 30 characters"),
});

export type DriverVerificationInput = z.infer<typeof driverVerificationSchema>;

export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "File required hai" };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: APP_MESSAGES.INVALID_FILE };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: APP_MESSAGES.INVALID_FILE };
  }
  return { valid: true };
}
