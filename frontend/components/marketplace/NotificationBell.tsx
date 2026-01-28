'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useMarketplaceSocket } from '@/hooks/useMarketplaceSocket';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useMarketplaceSocket();

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'request_created':
        return 'text-blue-400';
      case 'request_approved':
        return 'text-green-400';
      case 'request_denied':
        return 'text-red-400';
      case 'product_published':
        return 'text-purple-400';
      case 'product_purchased':
        return 'text-emerald-400';
      default:
        return 'text-gray-400';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request_created':
        return '📝';
      case 'request_approved':
        return '✅';
      case 'request_denied':
        return '❌';
      case 'product_published':
        return '🎉';
      case 'product_purchased':
        return '💰';
      default:
        return '🔔';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes}d önce`;
    if (hours < 24) return `${hours}s önce`;
    return `${days}g önce`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Bildirimler"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            className="notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="notification-header">
              <h3 className="notification-title">Bildirimler</h3>
              <div className="notification-actions">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      className="notification-action-btn"
                      title="Tümünü okundu işaretle"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearAll}
                      className="notification-action-btn"
                      title="Tümünü temizle"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="notification-action-btn"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <BellIcon className="w-12 h-12 text-gray-600" />
                  <p className="text-gray-400">Henüz bildirim yok</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="notification-icon-wrapper">
                      <span className="notification-emoji">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="notification-content">
                      <h4 className={`notification-item-title ${getNotificationColor(notification.type)}`}>
                        {notification.title}
                      </h4>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{formatTime(notification.timestamp)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      className="notification-remove"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                    {!notification.read && <div className="notification-unread-dot" />}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

