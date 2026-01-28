'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-700 text-gray-200',
      success: 'bg-green-600/20 text-green-400',
      warning: 'bg-yellow-600/20 text-yellow-400',
      danger: 'bg-red-600/20 text-red-400',
      info: 'bg-blue-600/20 text-blue-400',
    };
    
    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-1',
      lg: 'text-base px-3 py-1.5',
    };
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
