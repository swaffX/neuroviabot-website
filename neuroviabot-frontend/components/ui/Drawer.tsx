'use client'

import { Fragment, ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FocusTrap } from '../FocusTrap'
import { cn } from '@/lib/utils'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  position?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

export function Drawer({
  open,
  onClose,
  children,
  title,
  position = 'right',
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full',
  }

  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
  }

  const slideAnimation = {
    left: 'animate-in slide-in-from-left',
    right: 'animate-in slide-in-from-right',
  }

  const drawerContent = (
    <div
      className="fixed inset-0 z-50 flex animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div
        className={cn(
          'absolute top-0 bottom-0 flex',
          positionClasses[position]
        )}
      >
        <FocusTrap
          active={open}
          onEscape={closeOnEscape ? onClose : undefined}
        >
          <div
            className={cn(
              'relative w-screen bg-slate-900 border-white/10 shadow-2xl flex flex-col duration-300',
              sizeClasses[size],
              slideAnimation[position],
              position === 'left' ? 'border-r' : 'border-l'
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                {title && (
                  <h2
                    id="drawer-title"
                    className="text-2xl font-bold text-white"
                  >
                    {title}
                  </h2>
                )}

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={cn(
                      'p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors',
                      !title && 'ml-auto'
                    )}
                    aria-label="Kapat"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </div>
        </FocusTrap>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null

  return createPortal(drawerContent, document.body)
}

export const DrawerFooter = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 px-6 py-4 bg-white/5 border-t border-white/10',
      className
    )}
  >
    {children}
  </div>
)

export default Drawer
