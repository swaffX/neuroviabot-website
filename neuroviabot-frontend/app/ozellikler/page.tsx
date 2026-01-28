'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TicketIcon,
  GiftIcon,
  SparklesIcon,
  BoltIcon,
  CommandLineIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  ArrowsRightLeftIcon,
  ChartPieIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

export default function FeaturesPage() {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');

  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Advanced Auto-Moderation',
      description: 'Gelişmiş otomatik moderasyon',
      gradient: 'from-red-500 to-rose-500',
      bgGradient: 'from-red-500/10 to-rose-500/10',
      tags: ['Spam Protection', 'Link Filter', 'Word Filter', 'Raid Protection'],
      status: 'active'
    },
    {
      icon: UserGroupIcon,
      title: 'Reaction Roles',
      description: 'Emoji ile rol verme sistemi',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-500/10 to-purple-500/10',
      tags: ['Bot Messages', 'Multiple Roles', 'Custom Emojis', 'Auto-Setup'],
      status: 'active'
    },
    {
      icon: ChartBarIcon,
      title: 'Leveling & XP System',
      description: 'Seviye ve deneyim sistemi',
      gradient: 'from-blue-500 to-indigo-500',
      bgGradient: 'from-blue-500/10 to-indigo-500/10',
      tags: ['XP Kazanımı', 'Rol Ödülleri', 'Leaderboard', 'Özelleştirilebilir'],
      status: 'active'
    },
    {
      icon: TicketIcon,
      title: 'Ticket System',
      description: 'Profesyonel destek sistemi',
      gradient: 'from-cyan-500 to-teal-500',
      bgGradient: 'from-cyan-500/10 to-teal-500/10',
      tags: ['Support', 'Categories', 'Transcript', 'Auto-Close'],
      status: 'active'
    },
    {
      icon: GiftIcon,
      title: 'Giveaways',
      description: 'Çekiliş ve etkinlik sistemi',
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-500/10 to-rose-500/10',
      tags: ['Auto Giveaway', 'Winner Selection', 'Requirements', 'Multi-Prize'],
      status: 'active'
    },
    {
      icon: SparklesIcon,
      title: 'Quest System',
      description: 'Görev ve başarım sistemi',
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-500/10 to-purple-500/10',
      tags: ['Daily Quests', 'Rewards', 'Achievements', 'Progress Tracking'],
      status: 'active'
    },
    {
      icon: CommandLineIcon,
      title: 'Custom Commands',
      description: 'Özel komut oluşturma',
      gradient: 'from-gray-500 to-slate-500',
      bgGradient: 'from-gray-500/10 to-slate-500/10',
      tags: ['Custom Responses', 'Variables', 'Embeds', 'Permissions'],
      status: 'active'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: 'Developer Bot Panel',
      description: 'Geliştiriciler için yönetim paneli',
      gradient: 'from-yellow-500 to-amber-500',
      bgGradient: 'from-yellow-500/10 to-amber-500/10',
      tags: ['Bot Stats', 'Command Manager', 'Database Tools', 'System Control'],
      status: 'active'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] relative overflow-hidden">
      <Navbar 
        language={language}
        onLanguageChange={setLanguage}
        user={user}
        onLogout={logout}
      />

      {/* Animated Background - Fixed with prefers-reduced-motion */}
      <div className="fixed inset-0 z-0">
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
          style={{ willChange: 'transform' }}
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
        />
      </div>

      {/* Hero Header */}
      <section className="relative z-10 pt-32 pb-20" style={{
        background: 'linear-gradient(rgb(19, 21, 31) -4.84%, rgb(29, 28, 47) 34.9%, rgb(33, 32, 54) 48.6%, rgb(51, 40, 62) 66.41%, rgb(98, 61, 83) 103.41%, rgb(140, 81, 102) 132.18%)'
      }}>
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
              Ana Sayfaya Dön
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-6"
            >
              <BoltIcon className="w-12 h-12 text-purple-400" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200">
              Güçlü Özellikler
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Neurovia ile Discord sunucunuzu profesyonel bir platforma dönüştürün. 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-bold"> {features.length}+ özellik</span> ile tam kontrol.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid - Hero Style Glassmorphism */}
      <section className="relative z-10 py-20 lg:py-28 overflow-hidden" style={{
        background: 'linear-gradient(rgb(19, 21, 31) -4.84%, rgb(29, 28, 47) 34.9%, rgb(33, 32, 54) 48.6%, rgb(51, 40, 62) 66.41%, rgb(98, 61, 83) 103.41%, rgb(140, 81, 102) 132.18%)'
      }}>
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.5,
                  delay: index * 0.05,
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
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 md:p-7 transition-all duration-500 ease-out hover:shadow-[0_8px_32px_rgba(168,85,247,0.2)]" style={{
                  borderColor: feature.gradient.includes('purple') ? 'rgba(168, 85, 247, 0.1)' :
                               feature.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.1)' :
                               feature.gradient.includes('green') ? 'rgba(34, 197, 94, 0.1)' :
                               feature.gradient.includes('yellow') ? 'rgba(234, 179, 8, 0.1)' :
                               feature.gradient.includes('pink') ? 'rgba(236, 72, 153, 0.1)' :
                               feature.gradient.includes('cyan') ? 'rgba(6, 182, 212, 0.1)' :
                               'rgba(255, 255, 255, 0.1)'
                }}>
                  {/* Animated Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.bgGradient} flex items-center justify-center text-4xl shadow-lg mb-5 ring-1 ring-white/10 transition-all duration-300`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 group-hover:text-purple-200 transition-colors duration-300">
                      {feature.title}
                      {feature.status === 'active' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Aktif
                        </span>
                      )}
                      {feature.status === 'beta' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Beta
                        </span>
                      )}
                      {feature.status === 'soon' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Yakında
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-400/90 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {feature.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Hero Style */}
      <section className="relative z-10 px-6 pb-32" style={{
        background: 'linear-gradient(rgb(29, 28, 47) 0%, rgb(33, 32, 54) 50%, rgb(51, 40, 62) 100%)'
      }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-12 text-center"
          >
            {/* Animated Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 opacity-50"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200">
                Hemen Başlayın
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Neurovia'u sunucunuza ekleyin ve tüm bu özelliklerin keyfini çıkarın!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="https://discord.com/oauth2/authorize?client_id=773539215098249246&scope=bot%20applications.commands&permissions=8"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.05,
                    y: -2
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 overflow-hidden rounded-2xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2] via-[#5865F2] to-[#4752C4] group-hover:scale-105 transition-transform duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="absolute inset-0 shadow-[0_8px_32px_rgba(88,101,242,0.4)] group-hover:shadow-[0_16px_48px_rgba(88,101,242,0.6)] transition-shadow duration-500"></div>
                  <span className="relative text-white text-lg font-bold">Botu Ekle</span>
                </motion.a>
                <Link href="/komutlar">
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      y: -2
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl"></div>
                    <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-colors duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative text-white text-lg font-semibold">Komutları Gör</span>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
