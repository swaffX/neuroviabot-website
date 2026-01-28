'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function ShimmerButton({
  children,
  className,
  onClick,
  href,
  variant = 'primary',
}: ShimmerButtonProps) {
  const variants = {
    primary: 'bg-discord hover:bg-discord-dark text-white',
    secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    ghost: 'bg-transparent hover:bg-white/5 text-white',
  };

  const Component = href ? motion.a : motion.button;
  const props = href ? { href } : { onClick };

  return (
    <Component
      {...props}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative px-6 py-3 rounded-xl font-semibold overflow-hidden group transition-all duration-300',
        variants[variant],
        className
      )}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </Component>
  );
}
