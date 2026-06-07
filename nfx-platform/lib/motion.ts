import type { Variants } from 'framer-motion'

// Strong custom easing curves — built-in CSS easings are too weak (Emil)
export const EASE_OUT    = [0.23, 1, 0.32, 1]    as const  // cubic-bezier(0.23, 1, 0.32, 1)
export const EASE_IN_OUT = [0.77, 0, 0.175, 1]   as const  // cubic-bezier(0.77, 0, 0.175, 1)
export const EASE_DRAWER = [0.32, 0.72, 0, 1]    as const  // iOS-like drawer curve

export const fadeUp: Variants = {
  initial: { opacity: 0, transform: 'translateY(8px)' },
  animate: { opacity: 1, transform: 'translateY(0px)',  transition: { duration: 0.22, ease: EASE_OUT } },
  // Never ease-in on exits — starts slow, feels sluggish
  exit:    { opacity: 0, transform: 'translateY(-4px)', transition: { duration: 0.15, ease: EASE_OUT } },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2,  ease: EASE_OUT } },
  exit:    { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
  // Nothing in the real world appears from nothing — start from 0.96, not 0
  initial: { opacity: 0, transform: 'scale(0.96)' },
  animate: { opacity: 1, transform: 'scale(1)',    transition: { duration: 0.2,  ease: EASE_OUT } },
  exit:    { opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.15, ease: EASE_OUT } },
}

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },  // 50ms — short enough to feel snappy
}

export const staggerItem: Variants = {
  initial: { opacity: 0, transform: 'translateY(10px)' },
  animate: { opacity: 1, transform: 'translateY(0px)',  transition: { duration: 0.22, ease: EASE_OUT } },
  exit:    { opacity: 0, transform: 'translateY(4px)',  transition: { duration: 0.12, ease: EASE_OUT } },
}

// Hardware-accelerated hover: transform string skips rAF and runs on GPU (Emil)
export const cardHover = {
  whileHover: {
    transform: 'translateY(-2px)',
    transition: { duration: 0.18, ease: EASE_OUT },
  },
} as const
