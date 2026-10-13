import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Rides Management · Admin · Oblo Rides",
};

export default function AdminRidesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="All Rides"
        description="Monitor active, completed, and cancelled campus rides"
      />
      <div className="p-8 rounded-xl bg-surface-1 border border-border text-center space-y-3">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Rides Administration
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Filter rides, emergency cancellations, and request audit logs coming in Phase 7.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 7
        </span>
      </div>
    </div>
  );
}
