import React from "react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Offer Ride · Oblo Rides",
};

export default function OfferRidePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Offer a Ride"
        description="Share empty seats in your car or bike with fellow students"
      />
      <div className="p-8 rounded-xl bg-card border border-border text-center space-y-3">
        <div className="size-12 rounded-full bg-lime/10 border border-lime/30 text-lime flex items-center justify-center mx-auto text-xl font-bold">
          ➕
        </div>
        <h2 className="text-lg font-display font-semibold text-foreground">
          Offer Ride Flow
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Driver verification checks, vehicle seat selection (Bike = 1, Car = 1-3), and rate setting coming in Phase 3.
        </p>
        <span className="inline-block px-2.5 py-1 rounded-pill bg-surface-3 text-xs font-mono text-muted-foreground">
          Coming in Phase 3
        </span>
      </div>
    </div>
  );
}
