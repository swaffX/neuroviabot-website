'use client';

import React, { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
}

export default function PageContainer({ 
  children, 
  maxWidth = '7xl',
  className = ''
}: PageContainerProps) {
  const maxWidthClasses = {
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 ${className}`}>
      <main className={`container mx-auto px-4 py-20 ${maxWidthClasses[maxWidth]}`}>
        {children}
      </main>
    </div>
  );
}

