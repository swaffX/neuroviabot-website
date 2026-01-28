// NRC Coin - Shared Animation Variants for Framer Motion
// Consistent animations across all NRC pages

import { Variants } from 'framer-motion';

// Fade in from bottom with slide up
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Fade in from left
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Fade in from right
export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Scale in with fade
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Stagger children animations
export const staggerChildren: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Parallax scroll effect
export const parallaxScroll = (speed: number = 0.5) => ({
  hidden: {
    y: 0,
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 30,
    },
  },
});

// Card hover effect
export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 12px 40px rgba(168, 85, 247, 0.2)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Button press effect
export const buttonPress: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Number counter animation
export const counterAnimation = {
  duration: 2,
  ease: 'easeOut',
};

// Progress bar fill
export const progressFill: Variants = {
  hidden: {
    width: '0%',
  },
  visible: (width: number) => ({
    width: `${width}%`,
    transition: {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// Pulse effect for live indicators
export const pulse: Variants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Glow effect
export const glow: Variants = {
  rest: {
    filter: 'drop-shadow(0 0 0px rgba(168, 85, 247, 0))',
  },
  hover: {
    filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))',
    transition: {
      duration: 0.3,
    },
  },
};

