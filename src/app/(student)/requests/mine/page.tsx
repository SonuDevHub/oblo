import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "My Requests · Oblo Rides",
};

export default function MyRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Requests"
        description="Track your seat requests, status changes, and driver details"
      />
      <div className="p-8 rounded-xl bg-card border border-border text-center space-y-3">
        <div className="size-12 rounded-full bg-lime/10 border border-lime/30 text-lime flex items-center justify-center mx-auto text-xl font-bold">
          ✉
        </div>
        <h2 className="text-lg font-display font-semibold text-foreground">
          Ride Requests & Driver Contact
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Status chips (Pending/Accepted/Rejected), driver phone & plate revealing after acceptance coming in Phase 5.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 5
        </span>
      </div>
    </div>
  );
}
