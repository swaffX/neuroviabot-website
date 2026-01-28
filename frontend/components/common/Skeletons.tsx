'use client';

import { motion } from 'framer-motion';

/**
 * Base Skeleton Component
 */
export function Skeleton({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`bg-white/10 rounded ${className}`}
    />
  );
}

/**
 * Card Skeleton
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-1/3 rounded-lg" />
        <Skeleton className="h-10 w-1/3 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 mb-2">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === 0 ? 'w-1/4' : 'flex-1'}`}
          delay={i * 0.1}
        />
      ))}
    </div>
  );
}

/**
 * Sidebar Menu Skeleton
 */
export function SidebarMenuSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <Skeleton className="w-5 h-5 rounded" delay={i * 0.05} />
          <Skeleton className="h-4 flex-1" delay={i * 0.05} />
        </div>
      ))}
    </div>
  );
}

/**
 * Stats Card Skeleton
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-20 h-6 rounded" delay={0.1} />
      </div>
      <Skeleton className="h-8 w-3/4 mb-2" delay={0.2} />
      <Skeleton className="h-4 w-1/2" delay={0.3} />
    </div>
  );
}

/**
 * Command Card Skeleton
 */
export function CommandCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" delay={0.1} />
          </div>
          <Skeleton className="h-4 w-full mb-2" delay={0.2} />
          <Skeleton className="h-4 w-3/4" delay={0.3} />
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <Skeleton className="h-8 w-full rounded-lg" delay={0.4} />
        <Skeleton className="h-4 w-1/2" delay={0.5} />
      </div>
    </div>
  );
}

/**
 * Grid Skeleton
 */
export function GridSkeleton({
  columns = 3,
  rows = 3,
  Component = CardSkeleton,
}: {
  columns?: number;
  rows?: number;
  Component?: React.ComponentType<any>;
}) {
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: rows * columns }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

/**
 * List Skeleton
 */
export function ListSkeleton({
  items = 5,
  Component = TableRowSkeleton,
}: {
  items?: number;
  Component?: React.ComponentType<any>;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
