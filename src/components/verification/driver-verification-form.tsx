"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { UploadCloud, FileText, X, Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { uploadIdDocument } from "@/lib/storage/upload-id-document";
import { submitVerificationAction } from "@/actions/verification-actions";
import { validateDocumentFile } from "@/lib/validation/verification-schema";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

interface DriverVerificationFormProps {
  userId: string;
  initialCollegeIdNumber?: string;
  initialDlNumber?: string;
}

export function DriverVerificationForm({
  userId,
  initialCollegeIdNumber = "",
  initialDlNumber = "",
}: DriverVerificationFormProps) {
  const [collegeIdNumber, setCollegeIdNumber] = React.useState(initialCollegeIdNumber);
  const [dlNumber, setDlNumber] = React.useState(initialDlNumber);

  const [idCardFile, setIdCardFile] = React.useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = React.useState<string | null>(null);
  const [dlFile, setDlFile] = React.useState<File | null>(null);
  const [dlPreview, setDlPreview] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string>("");

  const handleFileSelect = (
    type: "id-card" | "dl",
    file: File | null
  ) => {
    if (!file) return;

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      toast.error(validation.error || APP_MESSAGES.INVALID_FILE);
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

    if (type === "id-card") {
      setIdCardFile(file);
      setIdCardPreview(previewUrl);
    } else {
      setDlFile(file);
      setDlPreview(previewUrl);
    }
  };

  const removeFile = (type: "id-card" | "dl") => {
    if (type === "id-card") {
      setIdCardFile(null);
      setIdCardPreview(null);
    } else {
      setDlFile(null);
      setDlPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collegeIdNumber.trim() || !dlNumber.trim()) {
      toast.error("College ID aur Driving License number bharna zaroori hai");
      return;
    }

    if (!idCardFile || !dlFile) {
      toast.error("Dono documents (College ID aur Driving License) select karein");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload College ID
      setUploadProgress("College ID upload ho rahi hai...");
      const idRes = await uploadIdDocument(userId, "id-card", idCardFile);
      if (!idRes.success || !idRes.path) {
        throw new Error(idRes.error || "College ID upload fail hua");
      }

      // 2. Upload DL
      setUploadProgress("Driving License upload ho raha hai...");
      const dlRes = await uploadIdDocument(userId, "dl", dlFile);
      if (!dlRes.success || !dlRes.path) {
        throw new Error(dlRes.error || "Driving License upload fail hua");
      }

      // 3. Submit verification RPC
      setUploadProgress("Verification submit ho rahi hai...");
      const submitRes = await submitVerificationAction({
        collegeIdNumber: collegeIdNumber.trim(),
        drivingLicenseNumber: dlNumber.trim(),
        collegeIdUrl: idRes.path,
        drivingLicenseUrl: dlRes.path,
      });

      if (!submitRes.success) {
        throw new Error(submitRes.error || APP_MESSAGES.GENERIC_ERROR);
      }

      toast.success(APP_MESSAGES.VERIFICATION_SUBMITTED);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : APP_MESSAGES.GENERIC_ERROR;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <Card className="bg-card border-border max-w-xl mx-auto shadow-card">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2 text-lime mb-1">
          <ShieldCheck className="size-5" />
          <span className="text-xs font-semibold tracking-wider uppercase">Driver Eligibility</span>
        </div>
        <CardTitle className="text-xl font-bold font-display text-foreground">
          Driver Verification Apply Karein
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Campus carpool driver banne ke liye apna College ID card aur valid Driving License upload karein.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Numbers input */}
          <div className="space-y-2">
            <Label htmlFor="college-id-number">College ID / Enrollment Number</Label>
            <Input
              id="college-id-number"
              placeholder="e.g. 2024CS0891"
              value={collegeIdNumber}
              onChange={(e) => setCollegeIdNumber(e.target.value)}
              disabled={isSubmitting}
              required
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dl-number">Driving License Number</Label>
            <Input
              id="dl-number"
              placeholder="e.g. UP16 20230012345"
              value={dlNumber}
              onChange={(e) => setDlNumber(e.target.value)}
              disabled={isSubmitting}
              required
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          {/* Upload 1: College ID */}
          <div className="space-y-2">
            <Label>College ID Card (Photo ya PDF)</Label>
            {!idCardFile ? (
              <label
                htmlFor="college-id-file"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-n-700 hover:border-lime/60 hover:bg-lime/5 rounded-lg cursor-pointer transition-colors text-center"
              >
                <UploadCloud className="size-8 text-n-400 mb-2" />
                <span className="text-sm font-medium text-foreground">Click to upload College ID</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG ya PDF, max 2 MB</span>
                <input
                  id="college-id-file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  disabled={isSubmitting}
                  onChange={(e) => handleFileSelect("id-card", e.target.files?.[0] || null)}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-3 border border-border">
                <div className="flex items-center gap-3 overflow-hidden">
                  {idCardPreview ? (
                    <div className="relative size-12 rounded overflow-hidden shrink-0 border border-border">
                      <Image src={idCardPreview} alt="ID preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <FileText className="size-8 text-lime shrink-0" />
                  )}
                  <div className="truncate text-sm">
                    <p className="font-medium text-foreground truncate">{idCardFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(idCardFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  onClick={() => removeFile("id-card")}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Upload 2: Driving License */}
          <div className="space-y-2">
            <Label>Driving License (Photo ya PDF)</Label>
            {!dlFile ? (
              <label
                htmlFor="dl-file"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-n-700 hover:border-lime/60 hover:bg-lime/5 rounded-lg cursor-pointer transition-colors text-center"
              >
                <UploadCloud className="size-8 text-n-400 mb-2" />
                <span className="text-sm font-medium text-foreground">Click to upload Driving License</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG ya PDF, max 2 MB</span>
                <input
                  id="dl-file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  disabled={isSubmitting}
                  onChange={(e) => handleFileSelect("dl", e.target.files?.[0] || null)}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-3 border border-border">
                <div className="flex items-center gap-3 overflow-hidden">
                  {dlPreview ? (
                    <div className="relative size-12 rounded overflow-hidden shrink-0 border border-border">
                      <Image src={dlPreview} alt="DL preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <FileText className="size-8 text-lime shrink-0" />
                  )}
                  <div className="truncate text-sm">
                    <p className="font-medium text-foreground truncate">{dlFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(dlFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  onClick={() => removeFile("dl")}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-lime text-ink hover:bg-lime-hover active:bg-lime-press font-semibold h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                {uploadProgress || "Submitting..."}
              </>
            ) : (
              "Submit Verification Documents"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
