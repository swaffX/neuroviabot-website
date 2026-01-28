import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface VisuallyHiddenProps {
  children: ReactNode
  as?: keyof React.JSX.IntrinsicElements
  className?: string
}

/**
 * VisuallyHidden component hides content visually but keeps it accessible to screen readers.
 * This is useful for providing context to screen reader users without affecting the visual design.
 * 
 * Usage:
 * <VisuallyHidden>This text is only for screen readers</VisuallyHidden>
 */
export function VisuallyHidden({ 
  children, 
  as: Component = 'span',
  className 
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn('sr-only', className)}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0',
      }}
    >
      {children}
    </Component>
  )
}

/**
 * Skip link component for keyboard navigation
 * Allows users to skip directly to main content
 */
export function SkipToContent({ href = '#main-content' }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Ana içeriğe atla
    </a>
  )
}

/**
 * Announce component for dynamic content changes
 * Announces changes to screen readers using aria-live
 */
interface AnnounceProps {
  children: ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
}

export function Announce({ 
  children, 
  politeness = 'polite',
  atomic = true,
  relevant = 'all'
}: AnnounceProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  )
}

/**
 * LiveRegion component for announcing dynamic updates
 * Use for notifications, status updates, etc.
 */
interface LiveRegionProps {
  children: ReactNode
  type?: 'status' | 'alert' | 'log'
  politeness?: 'polite' | 'assertive' | 'off'
}

export function LiveRegion({ 
  children, 
  type = 'status',
  politeness = 'polite'
}: LiveRegionProps) {
  return (
    <div
      role={type}
      aria-live={politeness}
      className="sr-only"
    >
      {children}
    </div>
  )
}
