'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'gradient' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  loading?: boolean;
  icon?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  glow = false,
  loading = false,
  icon = false,
  className,
  children,
  disabled,
  onClick,
  type = 'button',
}: ButtonProps) {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    gradient: 'btn-gradient',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    xl: 'btn-xl',
  };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    {
      'btn-icon': icon,
      'btn-glow': glow,
      'btn-loading': loading,
    },
    className
  );

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    >
      {children}
    </motion.button>
  );
}
