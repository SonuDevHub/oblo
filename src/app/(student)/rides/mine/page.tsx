import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "My Rides · Oblo Rides",
};

export default function MyRidesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Rides"
        description="Manage your published rides and incoming seat requests"
      />
      <div className="p-8 rounded-xl bg-card border border-border text-center space-y-3">
        <div className="size-12 rounded-full bg-lime/10 border border-lime/30 text-lime flex items-center justify-center mx-auto text-xl font-bold">
          🚗
        </div>
        <h2 className="text-lg font-display font-semibold text-foreground">
          Ride Management & Request Approval
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Seat limit enforcement, accept/reject rider actions, and auto-reject on full ride coming in Phase 5.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 5
        </span>
      </div>
    </div>
  );
}
