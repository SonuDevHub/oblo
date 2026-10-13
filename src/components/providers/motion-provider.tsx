"use client";

import * as React from "react";
import { MotionConfig } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const shouldReduce = useReducedMotionSafe();

  return (
    <MotionConfig reducedMotion={shouldReduce ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
