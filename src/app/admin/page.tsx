import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Admin Dashboard · Oblo Rides",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of campus carpool operations, verifications, and system health"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-xl bg-surface-1 border border-border">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Total Users</p>
          <p className="text-3xl font-display font-bold text-foreground mt-2">5</p>
          <p className="text-xs text-lime mt-1 font-medium">Demo accounts active</p>
        </div>
        <div className="p-5 rounded-xl bg-surface-1 border border-border">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Active Rides</p>
          <p className="text-3xl font-display font-bold text-foreground mt-2">3</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Tomorrow&apos;s commute</p>
        </div>
        <div className="p-5 rounded-xl bg-surface-1 border border-border">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Pending Verifications</p>
          <p className="text-3xl font-display font-bold text-lime mt-2">1</p>
          <p className="text-xs text-muted-foreground mt-1">Neha Singh pending</p>
        </div>
        <div className="p-5 rounded-xl bg-surface-1 border border-border">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Registered Vehicles</p>
          <p className="text-3xl font-display font-bold text-foreground mt-2">3</p>
          <p className="text-xs text-muted-foreground mt-1">2 cars · 1 bike</p>
        </div>
      </div>

      <div className="p-8 rounded-xl bg-surface-1 border border-border text-center space-y-3">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Full Admin Analytics & Controls
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Comprehensive real-time charts, user blocking, verification approvals, and route management coming in Phase 7.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 7
        </span>
      </div>
    </div>
  );
}
