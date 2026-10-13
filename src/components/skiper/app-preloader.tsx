"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

export function AppPreloader() {
  const [visible, setVisible] = React.useState(false);
  const shouldReduce = useReducedMotionSafe();

  React.useEffect(() => {
    if (shouldReduce) return;
    // Check if user has already visited in this session
    const hasVisited = sessionStorage.getItem("oblo_preloader_seen");
    if (!hasVisited) {
      setVisible(true);
      sessionStorage.setItem("oblo_preloader_seen", "true");
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldReduce]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background pointer-events-none"
      >
        <motion.div
          initial={{ y: -16, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="relative flex flex-col items-center"
        >
          <Image
            src="/brand/oblo-logo-dark.svg"
            alt="Oblo Rides"
            width={150}
            height={40}
            priority
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="w-28 h-0.5 bg-lime mt-4 rounded-full origin-left glow-lime"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
