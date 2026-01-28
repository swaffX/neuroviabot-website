'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { fetchBotStats } from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import {
  CommandLineIcon,
  UserGroupIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import StatCounter from '@/components/StatCounter';
import TestimonialCard from '@/components/TestimonialCard';
import Navbar from '@/components/layout/Navbar';

export default function Home() {
  const [stats, setStats] = useState({ guilds: 66, users: 59032, commands: 43 });
  const [globalStats, setGlobalStats] = useState({ totalServers: 0, totalUsers: 0, totalCommands: 39, nrcInCirculation: 0, activeTraders: 0 });
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [user, setUser] = useState<any>(null);
  const [statsUpdating, setStatsUpdating] = useState({ guilds: false, users: false, commands: false });

  // Socket bağlantısı
  const { connected, on, off } = useSocket();

  useEffect(() => {
    setMounted(true);

    const loadStats = async () => {
      try {
        console.log('🔄 Starting to fetch bot stats...');
        const data = await fetchBotStats();
        console.log('✅ Bot stats received:', data);

        // Sadece gerçek veri varsa güncelle
        if (data && data.source === 'bot-server') {
          const finalStats = {
            guilds: data.guilds || stats.guilds,
            users: (data.users && data.users > 0) ? data.users : stats.users,
            commands: data.commands || stats.commands
          };

          // İlk yüklemede animasyon göster
          const hasChanged = {
            guilds: finalStats.guilds !== stats.guilds,
            users: finalStats.users !== stats.users,
            commands: finalStats.commands !== stats.commands
          };

          console.log('💾 Setting stats to:', finalStats);
          setStats(finalStats);

          // İlk yüklemede animasyon
          if (hasChanged.guilds || hasChanged.users || hasChanged.commands) {
            setStatsUpdating(hasChanged);
            setTimeout(() => {
              setStatsUpdating({ guilds: false, users: false, commands: false });
            }, 1000);
          }
        } else {
          console.log('⚠️ Waiting for real-time stats via Socket.IO...');
        }
      } catch (error) {
        console.error('❌ Failed to fetch bot stats, keeping current values:', error);
        // Error durumunda mevcut stats'ı koru, fallback kullanma
      }
    };

    const loadUser = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
        const response = await fetch(`${API_URL}/api/auth/user`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('👤 User logged in:', userData);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log('👤 User check failed:', error);
        setUser(null);
      }
    };

    loadStats();
    loadUser();

    // Load global stats
    const loadGlobalStats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
        const response = await fetch(`${API_URL}/api/bot/stats/global`);
        if (response.ok) {
          const data = await response.json();
          setGlobalStats(data);
          console.log('📊 Global stats loaded:', data);
        }
      } catch (error) {
        console.error('Failed to load global stats:', error);
      }
    };

    loadGlobalStats();

    // HTTP fallback'i kaldır - Socket.IO yeterli
    // Sadece ilk yüklemede bir kez çağır
  }, []);

  // Socket.IO ile real-time stats güncellemeleri
  useEffect(() => {
    if (connected) {
      console.log('🔌 Socket connected! Listening for bot_stats_update...');

      const handleStatsUpdate = (data: any) => {
        console.log('📊 Real-time stats update received:', data);

        // Geçersiz veya boş veri kontrolü
        if (!data || !data.guilds || !data.users) {
          console.log('⚠️ Invalid stats data, ignoring update');
          return;
        }

        const newStats = {
          guilds: data.guilds,
          users: data.users,
          commands: data.commands || stats.commands
        };

        // Sadece değer değiştiyse güncelle
        const updated = {
          guilds: newStats.guilds !== stats.guilds,
          users: newStats.users !== stats.users,
          commands: newStats.commands !== stats.commands
        };

        // En az bir değer değiştiyse güncelle
        if (updated.guilds || updated.users || updated.commands) {
          console.log('✅ Stats updated:', { old: stats, new: newStats });
          setStatsUpdating(updated);
          setStats(newStats);

          // Animasyonu 1 saniye sonra kaldır
          setTimeout(() => {
            setStatsUpdating({ guilds: false, users: false, commands: false });
          }, 1000);
        } else {
          console.log('ℹ️ Stats unchanged, skipping update');
        }
      };

      on('bot_stats_update', handleStatsUpdate);

      return () => {
        off('bot_stats_update', handleStatsUpdate);
      };
    }
  }, [connected, on, off, stats]);

  const handleLogout = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const handleLanguageChange = useCallback((lang: 'tr' | 'en') => {
    setLanguage(lang);
  }, []);

  const t = {
    tr: {
      title: 'Discord için en iyi hepsi bir arada bot',
      description: 'Neurovia, dünya çapında binlerce Discord sunucusunun topluluklarını yönetmek, eğlendirmek ve büyütmek için güvendiği kullanımı kolay, eksiksiz bir Discord botudur.',
      addToDiscord: "Discord'a Ekle",
      seeFeatures: 'Özellikleri gör',
      features: 'Özellikler',
      commands: 'Komutlar',
      contact: 'Bize Ulaşın',
      feedback: 'Geri Bildirim',
      resources: 'Kaynaklar',
      login: 'Giriş Yap',
      whatCanYouDo: 'Neler Yapabilirsin?',
      whatCanYouDoDesc: 'Sunucunu yönetmek ve eğlenceli hale getirmek için her şey burada',
      home: 'Ana Sayfa',
      logout: 'Çıkış Yap',
      myServers: 'Sunucularım',
    },
    en: {
      title: 'The best all-in-one bot for Discord',
      description: 'Neurovia is the easy-to-use, complete Discord bot that thousands of Discord servers worldwide trust to manage, entertain, and grow their communities.',
      addToDiscord: 'Add to Discord',
      seeFeatures: 'See Features',
      features: 'Features',
      commands: 'Commands',
      contact: 'Contact Us',
      feedback: 'Feedback',
      resources: 'Resources',
      login: 'Login',
      whatCanYouDo: 'What Can You Do?',
      whatCanYouDoDesc: 'Everything you need to manage and make your server fun',
      home: 'Home',
      logout: 'Logout',
      myServers: 'My Servers',
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] relative overflow-hidden">
      {/* Navbar */}
      <Navbar
        language={language}
        onLanguageChange={handleLanguageChange}
        user={user}
        onLogout={handleLogout}
      />

      {/* Animated Background - Fixed */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Orbs with stagger animation */}
        <motion.div
          className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        />
        <motion.div
          className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        />
        <motion.div
          className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, 30, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        />

        {/* Floating particles - Reduced for performance */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${(i * 12.5) % 100}%`,
              top: `${(i * 15) % 100}%`,
              willChange: 'transform, opacity'
            }}
            animate={{
              y: [0, -80, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(88, 101, 242, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(88, 101, 242, 0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)'
        }}></div>
      </div>

      {/* Hero Section - Enhanced MEE6 Style */}
      <section className="relative z-10 min-h-screen flex overflow-hidden pt-12">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/wallpaper.jpg)',
            filter: 'brightness(0.6) contrast(1.1)'
          }}
        />

        {/* Gradient Overlay for better text visibility */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(19, 21, 31, 0.85) 0%, rgba(29, 28, 47, 0.9) 50%, rgba(33, 32, 54, 0.95) 100%)'
          }}
        />

        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
            style={{ willChange: 'transform, opacity' }}
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, -30, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"
            style={{ willChange: 'transform, opacity' }}
          />

          {/* Floating Particles - Reduced for performance */}
          {[...Array(10)].map((_, i) => {
            const colors = [
              'rgba(168, 85, 247, 0.5)',
              'rgba(59, 130, 246, 0.5)',
              'rgba(236, 72, 153, 0.4)'
            ];
            const size = 2 + (i % 3);

            return (
              <motion.div
                key={i}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeInOut"
                }}
                className="absolute"
                style={{
                  left: `${(i * 10) % 100}%`,
                  top: `${10 + (i % 5) * 15}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: colors[i % colors.length],
                  willChange: 'transform, opacity'
                }}
              />
            );
          })}

          {/* Decorative Stars - Simplified */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [0.9, 1.1, 0.9]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
              className="absolute w-1.5 h-1.5 bg-white/60 rounded-full"
              style={{
                left: `${(i * 16) % 95}%`,
                top: `${(i * 12) % 90}%`,
                willChange: 'transform, opacity'
              }}
            />
          ))}

          {/* Decorative Circles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-20 w-32 h-32 border border-purple-500/20 rounded-full"
            style={{ willChange: 'transform' }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-40 left-40 w-48 h-48 border border-blue-500/15 rounded-full"
            style={{ willChange: 'transform' }}
          />
        </div>

        {/* Forest Background */}
        <div className="absolute w-full h-full z-0 left-0 pointer-events-none overflow-hidden">
          <svg className="w-full absolute bottom-0" viewBox="0 0 1920 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 400V250C150 200 300 180 450 200C600 220 750 180 900 160C1050 140 1200 150 1350 180C1500 210 1650 190 1800 170C1920 155 1920 155 1920 155V400H0Z" fill="#0D0E15" fillOpacity="0.8" />
            <path d="M0 400V280C150 250 300 240 450 260C600 280 750 250 900 235C1050 220 1200 230 1350 255C1500 280 1650 265 1800 245C1920 232 1920 232 1920 232V400H0Z" fill="#0D0E15" fillOpacity="0.6" />
          </svg>
        </div>

        {/* Content */}
        <div className="min-h-full w-full flex items-center justify-start pt-6">
          <div className="mx-auto w-full max-w-[1240px] px-6 lg:px-12 py-6 lg:py-8">
            <div className="w-full text-center md:w-3/5 md:mx-auto lg:mx-0 lg:text-left lg:w-2/5">
              {/* Badge - Compact Animated */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-gradient-to-r from-purple-500/15 via-blue-500/15 to-cyan-500/15 border border-purple-400/30 backdrop-blur-xl shadow-[0_6px_24px_rgba(168,85,247,0.12)] hover:shadow-[0_8px_32px_rgba(168,85,247,0.2)] transition-all duration-500 group"
                style={{ willChange: 'transform, opacity' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 blur-sm opacity-50" />
                </motion.div>
                <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-blue-200 to-cyan-200 group-hover:from-purple-100 group-hover:via-blue-100 group-hover:to-cyan-100 transition-all duration-500">
                  ✨ Yeni Özellikler Eklendi
                </span>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 1, 0.4],
                    boxShadow: [
                      '0 0 0 rgba(34, 197, 94, 0)',
                      '0 0 8px rgba(34, 197, 94, 0.5)',
                      '0 0 0 rgba(34, 197, 94, 0)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-green-400"
                />
              </motion.div>

              {/* Title with Gradient */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="min-h-[127px] font-bold text-5xl lg:text-7xl mb-7 relative"
                style={{ willChange: 'transform, opacity' }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200"
                >
                  {t[language].title}
                </motion.span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.25,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-gray-300 text-base mb-10 whitespace-pre-line leading-relaxed"
                style={{ willChange: 'transform, opacity' }}
              >
                {t[language].description}
              </motion.p>

              {/* Stats Row - Modern Glassmorphism Design */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.4,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="flex flex-row flex-nowrap gap-2.5 mb-10 justify-center lg:justify-start"
                style={{ willChange: 'transform, opacity' }}
              >
                {[
                  { icon: CommandLineIcon, value: `${stats.commands || 29}+`, label: 'Komut', color: 'purple', glow: 'rgba(168, 85, 247, 0.4)', key: 'commands' },
                  { icon: ServerIcon, value: stats.guilds || '72', label: 'Sunucu', color: 'amber', glow: 'rgba(251, 191, 36, 0.4)', key: 'guilds' },
                  { icon: UserGroupIcon, value: stats.users.toLocaleString(), label: 'Kullanıcı', color: 'blue', glow: 'rgba(59, 130, 246, 0.4)', key: 'users' }
                ].map((stat, index) => {
                  const IconComponent = stat.icon;
                  const isUpdating = statsUpdating[stat.key as keyof typeof statsUpdating];
                  return (
                    <motion.div
                      key={index}
                      initial={{ scale: 0, opacity: 0, rotateY: -180 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        rotateY: 0,
                        // Real-time güncelleme animasyonu
                        ...(isUpdating && {
                          scale: [1, 1.08, 1],
                          y: [0, -4, 0]
                        })
                      }}
                      whileHover={{
                        y: -6,
                        scale: 1.02,
                        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.5 + index * 0.15,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      style={{ willChange: 'transform, opacity' }}
                      className="group relative"
                    >
                      {/* Glassmorphism Card */}
                      <div className="relative flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden transition-all duration-500 shadow-[0_6px_24px_rgba(0,0,0,0.3)] group-hover:shadow-[0_12px_36px_rgba(0,0,0,0.4)]" style={{ transform: 'translateZ(0)' }}>
                        {/* Animated Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 via-transparent to-${stat.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        {/* Glow Effect on Hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                          style={{ background: `radial-gradient(circle at center, ${stat.glow}, transparent 70%)` }}
                        />

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        </div>
                        {/* Pulse ring animasyonu - sadece güncelleme olduğunda */}
                        <AnimatePresence>
                          {isUpdating && (
                            <>
                              <motion.div
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: 1.8, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="absolute inset-0 rounded-xl border-2 border-blue-400"
                              />
                              <motion.div
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                                className="absolute inset-0 rounded-xl border-2 border-purple-400"
                              />
                              {/* Glow efekti */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.3, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl"
                              />
                            </>
                          )}
                        </AnimatePresence>

                        {/* Icon with Floating Animation */}
                        <motion.div
                          className="relative z-10"
                          animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <IconComponent className="w-6 h-6 text-white filter drop-shadow-[0_3px_10px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_4px_16px_rgba(255,255,255,0.5)] transition-all duration-500" />
                        </motion.div>

                        {/* Stats Text */}
                        <div className="relative z-10">
                          <motion.div
                            className="text-xl font-bold text-white leading-none mb-0.5 bg-clip-text"
                            animate={isUpdating ? {
                              scale: [1, 1.15, 1],
                              filter: [
                                'drop-shadow(0 0 0 rgba(96, 165, 250, 0))',
                                'drop-shadow(0 0 12px rgba(96, 165, 250, 0.8))',
                                'drop-shadow(0 0 0 rgba(96, 165, 250, 0))'
                              ]
                            } : {}}
                            transition={{ duration: 0.6 }}
                          >
                            {stat.value}
                          </motion.div>
                          <div className="text-sm font-medium text-gray-300/90 leading-none group-hover:text-white transition-colors duration-300">{stat.label}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* CTA Buttons - Ultra Modern */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.7,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="flex flex-col md:flex-row justify-center lg:justify-start items-stretch gap-4 max-w-[168px] lg:max-w-none m-auto"
                style={{ willChange: 'transform, opacity' }}
              >
                {/* Discord Button - Primary */}
                <motion.a
                  href={user ?
                    "https://discord.com/oauth2/authorize?client_id=773539215098249246&permissions=8&integration_type=0&scope=bot+applications.commands" :
                    `https://discord.com/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'https://neuroviabot.xyz/api/auth/callback')}&scope=identify%20email%20guilds&client_id=773539215098249246`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{
                    scale: 1.06,
                    y: -2
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="group relative flex shrink-0 rounded-2xl items-center justify-center gap-3 overflow-hidden"
                  style={{ willChange: 'transform' }}
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2] via-[#5865F2] to-[#4752C4] group-hover:scale-105 transition-transform duration-500" />

                  {/* Animated Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                  {/* Shadow Effect */}
                  <div className="absolute inset-0 shadow-[0_8px_32px_rgba(88,101,242,0.4)] group-hover:shadow-[0_16px_48px_rgba(88,101,242,0.6)] transition-shadow duration-500" />

                  {/* Content */}
                  <div className="relative flex items-center justify-center gap-3 px-8 py-4 text-white text-base font-bold">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 18 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="group-hover:scale-110 transition-transform duration-300"
                    >
                      <path d="M15.248 1.089A15.431 15.431 0 0011.534 0a9.533 9.533 0 00-.476.921 14.505 14.505 0 00-4.12 0A9.582 9.582 0 006.461 0a15.54 15.54 0 00-3.717 1.091C.395 4.405-.242 7.636.076 10.821A15.269 15.269 0 004.631 13c.369-.473.695-.974.975-1.499a9.896 9.896 0 01-1.536-.699c.13-.089.255-.18.377-.27 1.424.639 2.979.97 4.553.97 1.574 0 3.129-.331 4.553-.97.123.096.25.188.377.27a9.94 9.94 0 01-1.54.7c.28.525.607 1.026.976 1.498a15.2 15.2 0 004.558-2.178c.373-3.693-.639-6.895-2.676-9.733zM6.01 8.862c-.888 0-1.621-.767-1.621-1.712 0-.944.708-1.718 1.618-1.718.91 0 1.638.774 1.623 1.718-.016.945-.715 1.712-1.62 1.712zm5.98 0c-.889 0-1.62-.767-1.62-1.712 0-.944.708-1.718 1.62-1.718.912 0 1.634.774 1.618 1.718-.015.945-.713 1.712-1.618 1.712z" fill="currentColor" />
                    </svg>
                    <span className="group-hover:tracking-wide transition-all duration-300">{t[language].addToDiscord}</span>
                  </div>
                </motion.a>

                {/* Features Button - Secondary Glassmorphism */}
                <Link href="/ozellikler">
                  <motion.div
                    whileHover={{
                      scale: 1.06,
                      y: -2
                    }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative flex shrink-0 rounded-2xl items-center justify-center gap-2 overflow-hidden cursor-pointer"
                    style={{ willChange: 'transform' }}
                  >
                    {/* Glassmorphism Base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl" />

                    {/* Animated Border Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)', maskComposite: 'exclude', WebkitMaskComposite: 'xor', padding: '1px' }} />

                    {/* Static Border */}
                    <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-colors duration-500" />

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                    {/* Content */}
                    <div className="relative flex items-center justify-center gap-2 px-8 py-4 text-white text-base font-semibold">
                      <span className="group-hover:tracking-wide transition-all duration-300">{t[language].seeFeatures}</span>
                      <motion.span
                        className="inline-block"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        →
                      </motion.span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            </div>

            {/* Character Image - Right Side */}
            <div className="h-full md:w-1/2 translate-x-6 translate-y-6 md:translate-y-0 md:translate-x-0 md:absolute right-0 bottom-0 flex items-end justify-end pointer-events-none z-0">
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1
                }}
                transition={{
                  duration: 0.7,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="relative"
                style={{ willChange: 'transform, opacity' }}
              >
                <motion.div
                  className="w-full h-full relative"
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 1, 0, -1, 0]
                  }}
                  transition={{
                    y: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    },
                    rotate: {
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  style={{ willChange: 'transform' }}
                >
                  {/* Placeholder for character image */}
                  <div className="w-[400px] h-[500px] lg:w-[500px] lg:h-[600px] relative">
                    {/* Multiple Glow Layers for Depth */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-purple-500/30 to-transparent rounded-full blur-3xl"
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ willChange: 'transform, opacity' }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-full blur-2xl"
                      animate={{
                        scale: [1.1, 1, 1.1],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      style={{ willChange: 'transform, opacity' }}
                    />


                    <svg viewBox="0 0 400 600" className="w-full h-full drop-shadow-2xl relative z-10">
                      <circle cx="200" cy="150" r="80" fill="#8B5CF6" opacity="0.3" />
                      <rect x="150" y="230" width="100" height="200" rx="20" fill="#7C3AED" opacity="0.5" />
                      <rect x="100" y="250" width="60" height="150" rx="15" fill="#6D28D9" opacity="0.4" />
                      <rect x="240" y="250" width="60" height="150" rx="15" fill="#6D28D9" opacity="0.4" />
                      <text x="200" y="320" fontSize="120" fill="white" textAnchor="middle" opacity="0.8">🤖</text>
                    </svg>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Hero Style Glassmorphism */}
      <section id="features" className="relative z-10 py-20 lg:py-28 overflow-hidden" style={{
        background: 'linear-gradient(rgb(19, 21, 31) -4.84%, rgb(29, 28, 47) 34.9%, rgb(33, 32, 54) 48.6%, rgb(51, 40, 62) 66.41%, rgb(98, 61, 83) 103.41%, rgb(140, 81, 102) 132.18%)'
      }}>
        {/* Animated Background Effects - Hero Style */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, -30, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"
          />

          {/* Floating Particles - Reduced from 15 to 5 for performance */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -80, 0],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                delay: i * 2,
                ease: "easeInOut"
              }}
              className="absolute"
              style={{
                left: `${(i * 20) % 100}%`,
                top: `${20 + i * 15}%`,
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: i % 2 === 0 ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.5)'
              }}
            />
          ))}
        </div>

        {/* Forest Bottom */}
        <div className="absolute w-full h-full left-0 bottom-0 pointer-events-none overflow-hidden">
          <svg className="w-full absolute bottom-0" viewBox="0 0 1920 400" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.3">
            <path d="M0 400V250C150 200 300 180 450 200C600 220 750 180 900 160C1050 140 1200 150 1350 180C1500 210 1650 190 1800 170C1920 155 1920 155 1920 155V400H0Z" fill="#0D0E15" fillOpacity="0.8" />
            <path d="M0 400V280C150 250 300 240 450 260C600 280 750 250 900 235C1050 220 1200 230 1350 255C1500 280 1650 265 1800 245C1920 232 1920 232 1920 232V400H0Z" fill="#0D0E15" fillOpacity="0.6" />
          </svg>
        </div>

        <div className="relative w-full max-w-[1240px] mx-auto px-6 lg:px-10">
          {/* Section Header - Hero Style */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 text-4xl md:text-5xl font-bold mb-4 leading-tight"
            >
              {t[language].whatCanYouDo}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto"
            >
              {t[language].whatCanYouDoDesc}
            </motion.p>
          </motion.div>

          {/* Feature Grid - Glassmorphism Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Music Feature */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: 0,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="group relative"
            >
              {/* Glassmorphism Card */}
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 md:p-7 transition-all duration-500 ease-out hover:border-purple-500/50 hover:shadow-[0_8px_32px_rgba(168,85,247,0.2)]">
                {/* Animated Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-4xl shadow-lg mb-5 ring-1 ring-white/10 group-hover:ring-purple-400/30 transition-all duration-300"
                  >
                    🎵
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">Müzik Çal</h3>
                  <p className="text-purple-300/80 text-xs font-medium mb-3">YouTube • Spotify • SoundCloud</p>
                  <p className="text-gray-300/90 text-sm leading-relaxed mb-4">
                    Kristal kalitede müzik, sıra yönetimi ve ses kontrolü.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Sıra</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Filtre</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Lyrics</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Moderation Feature */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="group relative"
            >
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 md:p-7 transition-all duration-500 ease-out hover:border-blue-500/50 hover:shadow-[0_8px_32px_rgba(59,130,246,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-4xl shadow-lg mb-5 ring-1 ring-white/10 group-hover:ring-blue-400/30 transition-all duration-300"
                  >
                    🛡️
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors duration-300">Akıllı Moderasyon</h3>
                  <p className="text-blue-300/80 text-xs font-medium mb-3">Otomatik • Güvenli • Hızlı</p>
                  <p className="text-gray-300/90 text-sm leading-relaxed mb-4">
                    Spam ve zararlı içerik engellemesi, log kayıtları.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Auto-Mod</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Logs</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Warn</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Economy Feature */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="group relative"
            >
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 md:p-7 transition-all duration-500 ease-out hover:border-green-500/50 hover:shadow-[0_8px_32px_rgba(34,197,94,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-4xl shadow-lg mb-5 ring-1 ring-white/10 group-hover:ring-green-400/30 transition-all duration-300"
                  >
                    💰
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-200 transition-colors duration-300">Ekonomi Sistemi</h3>
                  <p className="text-green-300/80 text-xs font-medium mb-3">Para • Mağaza • Casino</p>
                  <p className="text-gray-300/90 text-sm leading-relaxed mb-4">
                    Sanal para, özel mağaza ve casino oyunları.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Daily</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Shop</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Games</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Leveling Feature */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: 0,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="group relative"
            >
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 md:p-7 transition-all duration-500 ease-out hover:border-yellow-500/50 hover:shadow-[0_8px_32px_rgba(234,179,8,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-yellow-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-4xl shadow-lg mb-5 ring-1 ring-white/10 group-hover:ring-yellow-400/30 transition-all duration-300"
                  >
                    ⭐
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors duration-300">Seviye & Çekiliş</h3>
                  <p className="text-yellow-300/80 text-xs font-medium mb-3">XP • Roller • Giveaway</p>
                  <p className="text-gray-300/90 text-sm leading-relaxed mb-4">
                    XP sistemi, seviye atlama ve heyecan verici çekilişler.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Leveling</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Ranks</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Giveaway</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Social Media Feature */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="group relative"
            >
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 md:p-7 transition-all duration-500 ease-out hover:border-pink-500/50 hover:shadow-[0_8px_32px_rgba(236,72,153,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-pink-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center text-4xl shadow-lg mb-5 ring-1 ring-white/10 group-hover:ring-pink-400/30 transition-all duration-300"
                  >
                    📱
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-200 transition-colors duration-300">Sosyal Medya</h3>
                  <p className="text-pink-300/80 text-xs font-medium mb-3">Twitch • YouTube • X (Twitter)</p>
                  <p className="text-gray-300/90 text-sm leading-relaxed mb-4">
                    Canlı yayın ve sosyal medya bildirimleri.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Twitch</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">YouTube</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">RSS</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI & Customization Feature */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="group relative"
            >
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 md:p-7 transition-all duration-500 ease-out hover:border-cyan-500/50 hover:shadow-[0_8px_32px_rgba(6,182,212,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center text-4xl shadow-lg mb-5 ring-1 ring-white/10 group-hover:ring-cyan-400/30 transition-all duration-300"
                  >
                    ✨
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors duration-300">AI & Özelleştirme</h3>
                  <p className="text-cyan-300/80 text-xs font-medium mb-3">Avatar • İsim • Kişilik</p>
                  <p className="text-gray-300/90 text-sm leading-relaxed mb-4">
                    Yapay zeka destekli özelleştirme ve branding.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">AI Chat</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Custom</span>
                    <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">Brand</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom CTA - Hero Style */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.7,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="mt-16 text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-gray-200 text-base md:text-lg mb-8"
            >
              Ve daha fazlası! <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-bold">50+ özellik</span> ile sunucunu kontrol et.
            </motion.p>
            <motion.a
              href={`https://discord.com/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'https://neuroviabot.xyz/api/auth/callback')}&scope=identify%20email%20guilds&client_id=773539215098249246`}
              whileHover={{
                scale: 1.05,
                y: -2,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 overflow-hidden rounded-2xl transition-all duration-300"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2] via-[#5865F2] to-[#4752C4] group-hover:scale-105 transition-transform duration-500"></div>

              {/* Animated Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              {/* Shadow Effect */}
              <div className="absolute inset-0 shadow-[0_8px_32px_rgba(88,101,242,0.4)] group-hover:shadow-[0_16px_48px_rgba(88,101,242,0.6)] transition-shadow duration-500"></div>

              {/* Content */}
              <div className="relative flex items-center gap-3 text-white text-base font-bold">
                <motion.svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{
                    rotate: [0, -10, 10, -10, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </motion.svg>
                <span className="group-hover:tracking-wide transition-all duration-300">Hemen Başla - Ücretsiz</span>
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </div>
            </motion.a>
          </motion.div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="relative py-24 overflow-hidden" style={{
        background: 'linear-gradient(rgb(29, 28, 47) 0%, rgb(33, 32, 54) 50%, rgb(51, 40, 62) 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Kullanıcılarımız Ne Diyor?
            </h2>
            <p className="text-xl text-gray-300">
              Neurovia ile deneyimlerini paylaşan sunucu sahipleri
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Neurovia sayesinde sunucumuzun yönetimi çok kolaylaştı. Seviye sistemi ve tepki rolleri sayesinde kullanıcılarımızı çok aktif tutuyor!",
                author: "Ahmet Y.",
                server: "GamersHub TR",
                rating: 5
              },
              {
                quote: "Moderasyon araçları gerçekten güçlü. Özellikle auto-mod ve güvenlik özellikleri spam sorununu tamamen çözdü.",
                author: "Zeynep K.",
                server: "Topluluk Merkezi",
                rating: 5
              },
              {
                quote: "Hoşgeldin mesajları ve otomasyon sistemi harika! Sunucu yönetimi artık çok daha kolay ve kullanıcılar kendilerini özel hissediyor.",
                author: "Mehmet S.",
                server: "Community Hub",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <TestimonialCard {...testimonial} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Smooth Animated & Hero-Style */}
      <footer className="relative z-10 overflow-hidden">
        {/* Background Image - Same as Hero */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/wallpaper.jpg)',
            filter: 'brightness(0.5) contrast(1.1)'
          }}
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(33, 32, 54, 0.95) 0%, rgba(51, 40, 62, 0.95) 50%, rgba(98, 61, 83, 0.95) 100%)'
          }}
        />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Forest Silhouette Top */}
        <div className="absolute w-full h-full top-0 left-0 pointer-events-none overflow-hidden opacity-30">
          <svg className="w-full absolute top-0 rotate-180" viewBox="0 0 1920 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 400V250C150 200 300 180 450 200C600 220 750 180 900 160C1050 140 1200 150 1350 180C1500 210 1650 190 1800 170C1920 155 1920 155 1920 155V400H0Z" fill="#0D0E15" fillOpacity="0.8" />
            <path d="M0 400V280C150 250 300 240 450 260C600 280 750 250 900 235C1050 220 1200 230 1350 255C1500 280 1650 265 1800 245C1920 232 1920 232 1920 232V400H0Z" fill="#0D0E15" fillOpacity="0.6" />
          </svg>
        </div>

        <div className="relative max-w-[1240px] mx-auto px-6 lg:px-10 pt-20 pb-10">
          {/* Main Footer Content - Animated */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            {/* Brand Section - Animated */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl"
                >
                  <svg
                    className="w-7 h-7 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </motion.div>
                <span className="text-white font-black text-2xl">Neurovia</span>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-gray-200 text-base leading-relaxed mb-6"
              >
                Discord sunucunu yönetmek için ihtiyacın olan her şey. Moderasyon, otomasyon, güvenlik ve daha fazlası.
              </motion.p>
              {/* Social Links - Stagger Animation */}
              <div className="flex items-center gap-3">
                {[
                  { href: "https://discord.gg/neurovia", icon: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z", delay: 0 },
                  { href: "https://twitter.com/neurovia", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", delay: 0.1 },
                  { href: "https://github.com/neurovia", icon: "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z", delay: 0.2 },
                  { href: "https://youtube.com/@neurovia", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", delay: 0.3 }
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + social.delay }}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Product - Animated */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="text-white font-bold text-lg mb-4">Ürün</h3>
              <ul className="space-y-3">
                {["Özellikler", "Sunucularım", "Botu Ekle"].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                  >
                    <a
                      href={i === 0 ? "/ozellikler" : i === 1 ? "/servers" : `https://discord.com/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'https://neuroviabot.xyz/api/auth/callback')}&scope=identify%20email%20guilds&client_id=773539215098249246`}
                      className="text-gray-200 hover:text-white transition-all text-sm hover:translate-x-1 inline-block"
                    >
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Resources - Animated */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="text-white font-bold text-lg mb-4">Kaynaklar</h3>
              <ul className="space-y-3">
                {[
                  { name: "Dokümantasyon", href: "#" },
                  { name: "Komutlar", href: "#" },
                  { name: "Destek", href: "#" },
                  { name: "Discord Sunucusu", href: "https://discord.gg/neurovia" }
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                  >
                    <a
                      href={item.href}
                      target={item.href.startsWith('http') ? "_blank" : undefined}
                      rel={item.href.startsWith('http') ? "noopener noreferrer" : undefined}
                      className="text-gray-200 hover:text-white transition-all text-sm hover:translate-x-1 inline-block"
                    >
                      {item.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Company - Animated */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-white font-bold text-lg mb-4">Şirket</h3>
              <ul className="space-y-3">
                {["Hakkımızda", "Blog", "Kariyer", "İletişim"].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.05 }}
                  >
                    <a
                      href="#"
                      className="text-gray-200 hover:text-white transition-all text-sm hover:translate-x-1 inline-block"
                    >
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom Bar - Animated */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="pt-8 border-t border-white/10"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-gray-300 text-sm"
              >
                © 2025 <span className="font-bold text-white">Neurovia</span>. Tüm hakları saklıdır.
              </motion.p>
              <div className="flex items-center gap-6">
                <motion.a
                  href="/privacy"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  whileHover={{ y: -2 }}
                  className="text-gray-300 hover:text-white transition-all text-sm"
                >
                  Gizlilik Politikası
                </motion.a>
                <motion.a
                  href="/terms"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                  whileHover={{ y: -2 }}
                  className="text-gray-300 hover:text-white transition-all text-sm"
                >
                  Kullanım Şartları
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  gradient: string;
}

function StatCard({ icon, value, label, gradient }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur transition duration-300" style={{
        backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`
      }}></div>
      <div className="relative p-8 bg-[#1A1B23] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br ${gradient} text-white`}>
          {icon}
        </div>
        <div className="text-4xl font-black text-white mb-2">{value}+</div>
        <div className="text-gray-400 font-medium">{label}</div>
      </div>
    </motion.div>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}

function FeatureCard({ icon, title, description, gradient, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group"
    >
      {/* Gradient border effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300`}></div>

      {/* Card content */}
      <div className="relative p-8 bg-[#1A1B23] border border-white/10 rounded-2xl backdrop-blur-xl h-full">
        <div className={`inline-flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${gradient} text-white transform group-hover:rotate-6 transition-transform duration-300`}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8' })}
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

