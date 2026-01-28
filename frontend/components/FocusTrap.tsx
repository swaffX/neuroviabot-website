'use client'

import { ReactNode, useEffect, useRef } from 'react'

interface FocusTrapProps {
  children: ReactNode
  active?: boolean
  returnFocus?: boolean
  initialFocus?: HTMLElement | null
  onEscape?: () => void
}

/**
 * FocusTrap component traps keyboard focus within its children.
 * Useful for modals, dialogs, and other overlay components.
 * 
 * Features:
 * - Traps Tab/Shift+Tab navigation
 * - Handles Escape key
 * - Returns focus to trigger element when deactivated
 * - Manages initial focus
 */
export function FocusTrap({
  children,
  active = true,
  returnFocus = true,
  initialFocus = null,
  onEscape,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // Store the element that had focus before the trap was activated
    previousActiveElement.current = document.activeElement as HTMLElement

    // Set initial focus
    const focusElement = initialFocus || getFirstFocusableElement()
    if (focusElement) {
      focusElement.focus()
    }

    // Cleanup: return focus when trap is deactivated
    return () => {
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [active, initialFocus, returnFocus])

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements()
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // Shift + Tab: move to previous element
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        }
        // Tab: move to next element
        else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, onEscape])

  const getFocusableElements = (): HTMLElement[] => {
    if (!containerRef.current) return []

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',')

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((element) => {
      return (
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        !element.hasAttribute('hidden')
      )
    })
  }

  const getFirstFocusableElement = (): HTMLElement | null => {
    const elements = getFocusableElements()
    return elements.length > 0 ? elements[0] : null
  }

  if (!active) {
    return <>{children}</>
  }

  return (
    <div ref={containerRef} className="focus-trap">
      {children}
    </div>
  )
}

/**
 * Hook for managing focus programmatically
 */
export function useFocusManagement() {
  const moveFocus = (direction: 'next' | 'previous' | 'first' | 'last') => {
    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0)

    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    )

    let targetIndex: number

    switch (direction) {
      case 'next':
        targetIndex = (currentIndex + 1) % focusableElements.length
        break
      case 'previous':
        targetIndex =
          (currentIndex - 1 + focusableElements.length) %
          focusableElements.length
        break
      case 'first':
        targetIndex = 0
        break
      case 'last':
        targetIndex = focusableElements.length - 1
        break
    }

    focusableElements[targetIndex]?.focus()
  }

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    )

    if (focusableElements.length > 0) {
      focusableElements[0]?.focus()
    }
  }

  const restoreFocus = (element: HTMLElement) => {
    element.focus()
  }

  return {
    moveFocus,
    trapFocus,
    restoreFocus,
  }
}
