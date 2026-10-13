"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="size-16 rounded-full bg-rejected/10 border border-rejected/30 text-rejected flex items-center justify-center text-2xl font-bold mb-4">
        ⚠️
      </div>
      <h1 className="text-2xl font-display font-bold mb-2">Kuch galat hua</h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button
        onClick={() => reset()}
        className="bg-lime text-ink hover:bg-lime-hover font-semibold"
      >
        Dobara try karein
      </Button>
    </div>
  );
}
