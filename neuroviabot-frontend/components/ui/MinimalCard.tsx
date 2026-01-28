'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MinimalCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export default function MinimalCard({
  children,
  className,
  hover = true,
  gradient = false,
}: MinimalCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={cn(
        'relative rounded-2xl p-6 backdrop-blur-xl transition-all duration-300',
        gradient
          ? 'bg-gradient-to-br from-white/5 to-white/[0.02]'
          : 'bg-white/5',
        'border border-white/10',
        hover && 'hover:bg-white/[0.07] hover:border-white/20',
        className
      )}
    >
      {/* Subtle glow on hover */}
      {hover && (
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-discord/0 via-discord/0 to-discord/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
      )}
      
      {children}
    </motion.div>
  );
}
