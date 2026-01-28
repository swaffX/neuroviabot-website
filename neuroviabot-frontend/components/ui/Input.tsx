'use client';

import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  className,
  ...props
}: InputProps) {
  return (
    <div className={clsx('input-wrapper', { 'w-full': fullWidth })}>
      {label && (
        <label className="input-label">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="input-container">
        {icon && (
          <div className="input-icon">
            {icon}
          </div>
        )}
        
        <input
          className={clsx(
            'input-base',
            {
              'input-error': error,
              'input-with-icon': icon,
            },
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p className="input-error-text">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="input-helper-text">
          {helperText}
        </p>
      )}
    </div>
  );
}

// Textarea Component
export function Textarea({
  label,
  error,
  helperText,
  fullWidth = false,
  className,
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'icon'> & {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={clsx('input-wrapper', { 'w-full': fullWidth })}>
      {label && (
        <label className="input-label">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        className={clsx(
          'input-base',
          {
            'input-error': error,
          },
          'min-h-[120px] resize-y',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="input-error-text">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="input-helper-text">
          {helperText}
        </p>
      )}
    </div>
  );
}

// Select Component
export function Select({
  label,
  error,
  helperText,
  fullWidth = false,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={clsx('input-wrapper', { 'w-full': fullWidth })}>
      {label && (
        <label className="input-label">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        className={clsx(
          'input-base',
          {
            'input-error': error,
          },
          className
        )}
        {...props}
      >
        {children}
      </select>
      
      {error && (
        <p className="input-error-text">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="input-helper-text">
          {helperText}
        </p>
      )}
    </div>
  );
}
