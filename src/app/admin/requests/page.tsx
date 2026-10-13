import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Seat Requests · Admin · Oblo Rides",
};

export default function AdminRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ride Requests Management"
        description="Inspect all student booking requests and admin overrides"
      />
      <div className="p-8 rounded-xl bg-surface-1 border border-border text-center space-y-3">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Requests Administration
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Request status overrides with seat constraint enforcement and audit logging coming in Phase 7.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 7
        </span>
      </div>
    </div>
  );
}
