'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  premiumTier: 'free' | 'premium' | 'vip';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('neurovia_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          localStorage.removeItem('neurovia_user');
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showDevNotification, setShowDevNotification] = useState(false);

  // Developer IDs
  const DEVELOPER_IDS = ['315875588906680330', '413081778031427584']; // swxff & schizoid

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/api/auth/user`, {
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const userData = await res.json();
        if (userData && userData.id) {
          const wasNotLoggedIn = !user;
          setUser(userData);
          // Cache user data in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('neurovia_user', JSON.stringify(userData));
          }

          // Check if developer and show notification
          if (wasNotLoggedIn && DEVELOPER_IDS.includes(userData.id)) {
            // Mark that dev notification should be shown
            if (typeof window !== 'undefined') {
              localStorage.setItem('neurovia_show_dev_notification', 'true');
            }
          }

          // Check if we should show dev notification (after redirect)
          if (typeof window !== 'undefined') {
            const shouldShow = localStorage.getItem('neurovia_show_dev_notification');
            if (shouldShow === 'true' && DEVELOPER_IDS.includes(userData.id)) {
              localStorage.removeItem('neurovia_show_dev_notification');
              setShowDevNotification(true);

              // Browser notification sound (simple beep without AudioContext)
              setTimeout(() => {
                try {
                  // Use system notification sound if available
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Developer Mode', {
                      body: 'Hoş geldin! Tüm sistemler hazır.',
                      icon: '/favicon.ico',
                      silent: false
                    });
                  }
                } catch (err) {
                  console.log('Notification failed:', err);
                }
              }, 500);

              // Hide notification after 3 seconds
              setTimeout(() => setShowDevNotification(false), 3000);
            }
          }
        } else {
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('neurovia_user');
          }
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('neurovia_user');
        }
      }
    } catch (error) {
      // Silently fail - user is just not authenticated
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Auth check failed, continuing without authentication');
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const login = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
    window.location.href = `${API_URL}/api/auth/discord`;
  };

  const logout = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    // Clear cached user data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('neurovia_user');
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser
    }}>
      {children}

      {/* Developer Login Notification - Minimal Style */}
      <AnimatePresence>
        {showDevNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
              }
            }}
            exit={{
              opacity: 0,
              y: -20,
              transition: {
                duration: 0.5,
                ease: "easeOut"
              }
            }}
            style={{
              position: 'fixed',
              top: '6rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              maxWidth: '400px',
              width: '90%'
            }}
          >
            {/* Modern Minimal Card */}
            <div className="relative">
              {/* Subtle glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-30" />

              {/* Card */}
              <div className="relative flex items-center gap-3 bg-gray-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-xl">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm mb-0.5">Developer Mode Active</p>
                  <p className="text-gray-400 text-xs">Tüm sistemler hazır 🚀</p>
                </div>

                {/* Status dot */}
                <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

