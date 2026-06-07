import type { Variants } from 'framer-motion'

// Strong custom easing curves — built-in CSS easings are too weak (Emil)
export const EASE_OUT    = [0.23, 1, 0.32, 1]    as const  // cubic-bezier(0.23, 1, 0.32, 1)
export const EASE_IN_OUT = [0.77, 0, 0.175, 1]   as const  // cubic-bezier(0.77, 0, 0.175, 1)
export const EASE_DRAWER = [0.32, 0.72, 0, 1]    as const  // iOS-like drawer curve
export const EASE_SPRING = [0.16, 1, 0.3, 1]     as const  // Expo.out — Apple spring feel

// iOS spring config for modal/sheet entrances
export const SPRING_MODAL = { type: 'spring', damping: 22, stiffness: 100, restDelta: 0.001 } as const

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

// Spring modal: scale+fade with physics — matches iOS sheet entrances
export const springModal: Variants = {
  initial: { opacity: 0, transform: 'scale(0.94) translateY(10px)' },
  animate: {
    opacity: 1,
    transform: 'scale(1) translateY(0px)',
    transition: SPRING_MODAL,
  },
  exit: { opacity: 0, transform: 'scale(0.96) translateY(6px)', transition: { duration: 0.14, ease: EASE_OUT } },
}

// Hardware-accelerated hover: spring physics for natural deceleration (Emil + Apple HIG)
export const cardHover = {
  whileHover: {
    transform: 'translateY(-3px)',
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  whileTap: {
    transform: 'scale(0.98)',
    transition: { duration: 0.08, ease: EASE_OUT },
  },
} as const
