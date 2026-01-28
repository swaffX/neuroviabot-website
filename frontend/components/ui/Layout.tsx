import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Container Component
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
  center?: boolean
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className,
      maxWidth = 'xl',
      padding = true,
      center = true,
      children,
      ...props
    },
    ref
  ) => {
    const maxWidthClasses = {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          maxWidthClasses[maxWidth],
          padding && 'px-4 sm:px-6 lg:px-8',
          center && 'mx-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'

// Grid Component
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  responsive?: boolean
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className,
      cols = 1,
      gap = 4,
      responsive = true,
      children,
      ...props
    },
    ref
  ) => {
    const colsClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
    }

    const gapClasses = {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12',
    }

    const responsiveClass = responsive
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : colsClasses[cols]

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          responsiveClass,
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Grid.displayName = 'Grid'

// Stack Component
export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column'
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction = 'column',
      spacing = 4,
      align = 'stretch',
      justify = 'start',
      wrap = false,
      children,
      ...props
    },
    ref
  ) => {
    const directionClasses = {
      row: 'flex-row',
      column: 'flex-col',
    }

    const spacingClasses = {
      row: {
        0: 'gap-x-0',
        1: 'gap-x-1',
        2: 'gap-x-2',
        3: 'gap-x-3',
        4: 'gap-x-4',
        5: 'gap-x-5',
        6: 'gap-x-6',
        8: 'gap-x-8',
        10: 'gap-x-10',
        12: 'gap-x-12',
      },
      column: {
        0: 'gap-y-0',
        1: 'gap-y-1',
        2: 'gap-y-2',
        3: 'gap-y-3',
        4: 'gap-y-4',
        5: 'gap-y-5',
        6: 'gap-y-6',
        8: 'gap-y-8',
        10: 'gap-y-10',
        12: 'gap-y-12',
      },
    }

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    }

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          spacingClasses[direction][spacing],
          alignClasses[align],
          justifyClasses[justify],
          wrap && 'flex-wrap',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Stack.displayName = 'Stack'

// Divider Component
export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  label?: string
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      className,
      orientation = 'horizontal',
      spacing = 4,
      label,
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      0: 'my-0',
      1: 'my-1',
      2: 'my-2',
      3: 'my-3',
      4: 'my-4',
      5: 'my-5',
      6: 'my-6',
      8: 'my-8',
      10: 'my-10',
      12: 'my-12',
    }

    if (label) {
      return (
        <div
          className={cn(
            'relative flex items-center',
            spacingClasses[spacing],
            className
          )}
        >
          <div className="flex-1 border-t border-white/10" />
          <span className="px-3 text-sm text-slate-400">{label}</span>
          <div className="flex-1 border-t border-white/10" />
        </div>
      )
    }

    if (orientation === 'vertical') {
      return (
        <hr
          ref={ref}
          className={cn(
            'w-px h-full border-0 bg-white/10',
            className
          )}
          {...props}
        />
      )
    }

    return (
      <hr
        ref={ref}
        className={cn(
          'border-0 border-t border-white/10',
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    )
  }
)

Divider.displayName = 'Divider'
