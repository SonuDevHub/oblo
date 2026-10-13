"use client";

import { useReducedMotion } from "motion/react";

export function useReducedMotionSafe(): boolean {
  const shouldReduce = useReducedMotion();
  return Boolean(shouldReduce);
}
