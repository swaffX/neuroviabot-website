'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'list' | 'table' | 'stats' | 'settings' }) {
  if (type === 'settings' || type === 'stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-xl mb-3" />
              <div className="h-8 bg-white/10 rounded w-20 mb-1" />
              <div className="h-4 bg-white/10 rounded w-24" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-4"
          >
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="animate-pulse h-6 bg-white/10 rounded w-1/4" />
        </div>
        <div className="divide-y divide-white/10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default card skeleton
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-white/10 rounded w-1/3" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </div>
    </motion.div>
  );
}

