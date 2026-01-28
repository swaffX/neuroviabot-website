'use client';

import * as React from 'react';
import clsx from 'clsx';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export function Tabs({ 
  value, 
  onValueChange, 
  children, 
  className 
}: { 
  value: string; 
  onValueChange: (value: string) => void; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={clsx('tabs', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex gap-2 border-b border-gray-700 mb-6', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={clsx(
        'px-4 py-2 text-sm font-medium transition-colors',
        'hover:text-white',
        isActive 
          ? 'text-white border-b-2 border-purple-500' 
          : 'text-gray-400 border-b-2 border-transparent',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div className={clsx('tabs-content', className)}>{children}</div>;
}

