// src/lib/storage/upload-id-document.ts
import { createBrowserClient } from "@/lib/supabase/create-browser-client";
import { validateDocumentFile } from "@/lib/validation/verification-schema";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

export type DocumentType = "id-card" | "dl" | "selfie";

export async function uploadIdDocument(
  userId: string,
  docType: DocumentType,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  // 1. Client-side validation
  const validation = validateDocumentFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error || APP_MESSAGES.INVALID_FILE };
  }

  // 2. Derive safe extension from MIME type
  let ext = "jpg";
  if (file.type === "image/png") ext = "png";
  else if (file.type === "application/pdf") ext = "pdf";
  else if (file.type === "image/jpeg" || file.type === "image/jpg") ext = "jpg";

  // App-generated deterministic name inside user's folder
  const filePath = `${userId}/${docType}.${ext}`;

  try {
    const supabase = createBrowserClient();
    const { error } = await supabase.storage
      .from("id-documents")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, path: filePath };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : APP_MESSAGES.GENERIC_ERROR;
    return { success: false, error: message };
  }
}
