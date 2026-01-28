'use client';

import * as React from 'react';
import clsx from 'clsx';

export function Separator({ 
  orientation = 'horizontal', 
  className 
}: { 
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'bg-gray-700',
        orientation === 'horizontal' 
          ? 'h-px w-full my-4' 
          : 'w-px h-full mx-4',
        className
      )}
    />
  );
}

