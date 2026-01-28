'use client';

import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

interface MarketplaceNotification {
  id: string;
  type: 'request_created' | 'request_approved' | 'request_denied' | 'product_published' | 'product_purchased';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  read: boolean;
}

export function useMarketplaceSocket() {
  const { socket, connected } = useSocket();
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for marketplace request created (for developers)
    socket.on('marketplace:request:created', (data: any) => {
      const notification: MarketplaceNotification = {
        id: `${Date.now()}-request-created`,
        type: 'request_created',
        title: 'Yeni Ürün Talebi',
        message: `${data.guildName} sunucusundan yeni bir ürün talebi aldınız.`,
        timestamp: new Date(),
        data,
        read: false,
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for marketplace request approved (for guild owners)
    socket.on('marketplace:request:approved', (data: any) => {
      const notification: MarketplaceNotification = {
        id: `${Date.now()}-request-approved`,
        type: 'request_approved',
        title: 'Ürün Talebi Onaylandı',
        message: `"${data.title}" ürün talebiniz onaylandı. Şimdi yayınlayabilirsiniz!`,
        timestamp: new Date(),
        data,
        read: false,
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for marketplace request denied (for guild owners)
    socket.on('marketplace:request:denied', (data: any) => {
      const notification: MarketplaceNotification = {
        id: `${Date.now()}-request-denied`,
        type: 'request_denied',
        title: 'Ürün Talebi Reddedildi',
        message: `"${data.title}" ürün talebiniz reddedildi. ${data.reviewNote ? `Sebep: ${data.reviewNote}` : ''}`,
        timestamp: new Date(),
        data,
        read: false,
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for product published (for marketplace viewers)
    socket.on('marketplace:product:published', (data: any) => {
      const notification: MarketplaceNotification = {
        id: `${Date.now()}-product-published`,
        type: 'product_published',
        title: 'Yeni Ürün Eklendi',
        message: `${data.guildName} sunucusu yeni bir ürün yayınladı: "${data.title}"`,
        timestamp: new Date(),
        data,
        read: false,
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for product purchased (for sellers)
    socket.on('marketplace:product:purchased', (data: any) => {
      const notification: MarketplaceNotification = {
        id: `${Date.now()}-product-purchased`,
        type: 'product_purchased',
        title: 'Ürün Satıldı!',
        message: `"${data.productTitle}" ürününüz satıldı. ${data.price} NRC kazandınız!`,
        timestamp: new Date(),
        data,
        read: false,
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('marketplace:request:created');
      socket.off('marketplace:request:approved');
      socket.off('marketplace:request:denied');
      socket.off('marketplace:product:published');
      socket.off('marketplace:product:purchased');
    };
  }, [socket, connected]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  };
}

