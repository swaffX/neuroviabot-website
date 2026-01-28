'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className, checked, ...props }, ref) => {
    return (
      <div className="flex items-center justify-between">
        {(label || description) && (
          <div className="flex-1 mr-4">
            {label && (
              <label className="text-sm font-medium text-white cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        )}
        
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => {
            const event = new Event('change', { bubbles: true });
            (ref as any)?.current?.dispatchEvent(event);
          }}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-discord focus:ring-offset-2 focus:ring-offset-gray-900',
            checked ? 'bg-discord' : 'bg-gray-700',
            className
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
              checked ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="sr-only"
          {...props}
        />
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
