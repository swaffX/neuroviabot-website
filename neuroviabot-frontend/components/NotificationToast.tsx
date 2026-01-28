'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const iconMap = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
};

const colorMap = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/50',
    icon: 'text-green-400',
    glow: 'shadow-green-500/20',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    icon: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    icon: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
  },
};

export default function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const Icon = iconMap[notification.type];
  const colors = colorMap[notification.type];

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 400, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`relative flex items-start gap-3 p-4 rounded-xl backdrop-blur-xl border ${colors.bg} ${colors.border} shadow-xl ${colors.glow} min-w-[300px] max-w-[400px]`}
    >
      {/* Animated gradient border */}
      <motion.div
        className={`absolute -inset-0.5 bg-gradient-to-r ${colors.border} rounded-xl opacity-0 blur-sm`}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Icon */}
      <div className="relative">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 relative">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-white font-medium break-words"
        >
          {notification.message}
        </motion.p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(notification.id)}
        className="relative p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
      >
        <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-b-xl"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
      />
    </motion.div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast notification={notification} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

