import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Routes & Stops · Admin · Oblo Rides",
};

export default function AdminRoutesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Routes & Commute Stops"
        description="Configure campus commute routes, stops order, and distance milestones"
      />
      <div className="p-8 rounded-xl bg-surface-1 border border-border text-center space-y-3">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Routes Management
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Add new stops, rearrange order, and configure kilometer markers coming in Phase 7.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 7
        </span>
      </div>
    </div>
  );
}
