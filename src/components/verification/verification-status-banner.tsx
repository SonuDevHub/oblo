// src/components/verification/verification-status-banner.tsx
import * as React from "react";
import Link from "next/link";
import { Shield, Hourglass, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_MESSAGES } from "@/lib/constants/app-messages";
import { buttonVariants } from "@/components/ui/button";

export type VerificationStatus = "not_submitted" | "pending" | "approved" | "rejected";

interface VerificationStatusBannerProps {
  status: VerificationStatus;
  rejectionReason?: string | null;
  className?: string;
  showCta?: boolean;
}

export function VerificationStatusBanner({
  status,
  rejectionReason,
  className,
  showCta = true,
}: VerificationStatusBannerProps) {
  if (status === "approved") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3.5 rounded-lg bg-lime/10 border border-lime/30 text-lime text-sm",
          className
        )}
      >
        <CheckCircle2 className="size-4 shrink-0" />
        <span className="font-medium">Aapka driver verification approved hai. Aap rides offer kar sakte hain.</span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3.5 rounded-lg border border-status-pending/40 bg-status-pending/10 text-status-pending text-sm",
          className
        )}
      >
        <Hourglass className="size-4 shrink-0 animate-pulse" />
        <div>
          <p className="font-semibold">{APP_MESSAGES.VERIFICATION_PENDING}</p>
          <p className="text-xs opacity-90">Usually approved within 15–30 minutes during campus hours.</p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-status-rejected/40 bg-status-rejected/10 text-status-rejected text-sm",
          className
        )}
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {APP_MESSAGES.verificationRejected(rejectionReason || "Documents unclear")}
            </p>
            <p className="text-xs opacity-85">Kripya saaf photo ya PDF ke saath dobara apply karein.</p>
          </div>
        </div>
        {showCta && (
          <Link
            href="/verification"
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className: "border-status-rejected/50 hover:bg-status-rejected/20 text-status-rejected",
            })}
          >
            Dobara submit karein
          </Link>
        )}
      </div>
    );
  }

  // not_submitted
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-surface-2 border border-border text-foreground text-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-surface-3 text-lime">
          <Shield className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{APP_MESSAGES.NOT_VERIFIED_OFFER}</p>
          <p className="text-xs text-muted-foreground">College ID card aur Driving License upload karein.</p>
        </div>
      </div>
      {showCta && (
        <Link
          href="/verification"
          className={buttonVariants({
            size: "sm",
            className: "bg-lime text-ink hover:bg-lime-hover font-semibold",
          })}
        >
          Get Verified
        </Link>
      )}
    </div>
  );
}
