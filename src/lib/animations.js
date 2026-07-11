// Shared framer-motion variants used across the app
export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
};
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 18, stiffness: 280 } },
};
export const slideFromRight = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 24, stiffness: 260 } },
  exit:   { opacity: 0, x: -24, transition: { duration: 0.15 } },
};
export const slideFromLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 24, stiffness: 260 } },
  exit:   { opacity: 0, x: 24, transition: { duration: 0.15 } },
};
export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};
export const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.032 } },
};
export const popIn = {
  hidden: { opacity: 0, scale: 0.7, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 16, stiffness: 320 } },
};
