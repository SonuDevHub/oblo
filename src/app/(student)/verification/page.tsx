import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Driver Verification · Oblo Rides",
};

export default function VerificationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Verification"
        description="Submit your College ID card and Driving Licence to unlock offering rides"
      />
      <div className="p-8 rounded-xl bg-card border border-border text-center space-y-3">
        <div className="size-12 rounded-full bg-lime/10 border border-lime/30 text-lime flex items-center justify-center mx-auto text-xl font-bold">
          🛡️
        </div>
        <h2 className="text-lg font-display font-semibold text-foreground">
          Student ID & Licence Upload
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Private encrypted upload to id-documents bucket, admin approval flow, and verified driver badge coming in Phase 3.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 3
        </span>
      </div>
    </div>
  );
}
