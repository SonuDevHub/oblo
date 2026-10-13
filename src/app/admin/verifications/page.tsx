import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Driver Verifications · Admin · Oblo Rides",
};

export default function AdminVerificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Verification Queue"
        description="Review student ID cards and driving licences with signed secure URLs"
      />
      <div className="p-8 rounded-xl bg-surface-1 border border-border text-center space-y-3">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Verification Review Panel
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          60-second expiring signed URLs for private ID documents, approve/reject flows, and driver revocation coming in Phase 7.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 7
        </span>
      </div>
    </div>
  );
}
