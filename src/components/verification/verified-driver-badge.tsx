// src/components/verification/verified-driver-badge.tsx
import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedDriverBadgeProps {
  className?: string;
  showText?: boolean;
}

export function VerifiedDriverBadge({ className, showText = true }: VerifiedDriverBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-lime/15 text-lime border border-lime/30",
        className
      )}
      title="Verified Campus Driver"
    >
      <ShieldCheck className="size-3.5" aria-hidden="true" />
      {showText && <span>Verified Driver</span>}
    </span>
  );
}
