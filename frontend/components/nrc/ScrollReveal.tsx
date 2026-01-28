'use client';

import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  variant?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  variant = 'fadeInUp',
  delay = 0,
  duration = 0.8,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  const variants: Record<string, Variants> = {
    fadeInUp: {
      hidden: { opacity: 0, y: 50 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -50 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 50 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants[variant]}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

