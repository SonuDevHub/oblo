// src/lib/motion/motion-presets.ts
// Standard motion variants honoring design timing (120ms - 320ms, ease-out-soft)

export const easeOutSoft = [0.22, 1, 0.36, 1] as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: easeOutSoft },
};

export const slideUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.25, ease: easeOutSoft },
};

export const cardEnter = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.99 },
  transition: { duration: 0.25, ease: easeOutSoft },
};

export const scalePress = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.12, ease: easeOutSoft },
};

export const staggerContainer = (staggerChildren = 0.08) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
    },
  },
});

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: easeOutSoft },
};
