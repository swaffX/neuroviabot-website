'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps {
  variant?: 'default' | 'glass' | 'elevated' | 'gradient-border' | 'interactive' | '3d';
  hover?: boolean;
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  hover = false,
  glow = false,
  className,
  children,
}: CardProps) {
  const variantClasses = {
    default: 'card',
    glass: 'card card-glass',
    elevated: 'card card-elevated',
    'gradient-border': 'card card-gradient-border',
    interactive: 'card card-interactive',
    '3d': 'card card-3d',
  };

  const classes = clsx(
    variantClasses[variant],
    {
      'card-hover': hover,
      'card-glow': glow,
    },
    className
  );

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('card-header', className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('card-body', className)}>{children}</div>;
}

// Alias for CardBody (commonly used in shadcn/ui)
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('card-body', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('card-footer', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx('card-title', className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={clsx('card-description', className)}>{children}</p>;
}

// Feature Card Component
export function FeatureCard({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <motion.div
      className={clsx('feature-card', className)}
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="feature-card-icon">
        {icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </motion.div>
  );
}

// Stat Card Component
export function StatCard({
  value,
  label,
  trend,
  className,
}: {
  value: string | number;
  label: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}) {
  return (
    <div className={clsx('stat-card', className)}>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {trend && (
        <div className={clsx('stat-card-trend', trend.positive ? 'positive' : 'negative')}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );
}
