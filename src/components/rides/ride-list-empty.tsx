// src/components/rides/ride-list-empty.tsx
import React from "react";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RideListEmptyProps {
  hasFilters?: boolean;
  className?: string;
}

export function RideListEmpty({ hasFilters = true, className }: RideListEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl bg-card border border-border space-y-4",
        className
      )}
    >
      {/* Centred Icon circle */}
      <div className="size-16 rounded-full bg-surface-3 border border-border flex items-center justify-center text-muted-foreground opacity-70">
        <Search className="size-7 text-lime" aria-hidden="true" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Koi ride nahi mili
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasFilters
            ? "Time thoda aage-peeche karke dekho ya vehicle filter change karo."
            : "Search filters use karke apni ride dhoondein."}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/rides/new"
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-10 px-5 gap-2 text-sm font-semibold"
          )}
        >
          <PlusCircle className="size-4" aria-hidden="true" />
          Offer a ride
        </Link>
      </div>
    </div>
  );
}
