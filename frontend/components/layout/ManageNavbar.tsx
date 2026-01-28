'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  Bars3Icon,
  ServerIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getDiscordGuildIconUrl } from '@/lib/discord';

interface ManageNavbarProps {
  user?: any;
  guild?: any;
  guilds?: any[];
  onLogout?: () => void;
  onSidebarToggle?: () => void;
  unreadCount?: number;
}

export default function ManageNavbar({
  user,
  guild,
  guilds = [],
  onLogout,
  onSidebarToggle,
  unreadCount = 0
}: ManageNavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-transparent backdrop-blur-xl border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-pink-500/5" />
      </div>

      <div className="relative h-20 px-6 flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger */}
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2.5 rounded-xl hover:bg-white/5 transition-all group"
          >
            <Bars3Icon className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
          </button>

          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all">Neurovia</span>
              <span className="text-xs text-gray-400 font-medium">Server Management</span>
            </div>
          </Link>

          {/* Back to Servers */}
          <Link
            href="/servers"
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all" />
            <ArrowLeftIcon className="relative w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors group-hover:-translate-x-1 duration-300" />
            <span className="relative text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
              Sunuculara Dön
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Server Switcher */}
          {guild && guilds.length > 1 && (
            <div className="relative hidden lg:block">
              <button
                onClick={() => setServerMenuOpen(!serverMenuOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all group"
              >
                <div className="relative">
                  {guild.icon ? (
                    <img
                      src={getDiscordGuildIconUrl(guild.id, guild.icon, 64)}
                      alt={guild.name}
                      className="w-8 h-8 rounded-lg"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-black">{guild.name?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start max-w-[150px]">
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors truncate w-full">
                    {guild.name}
                  </span>
                  <span className="text-xs text-gray-500">{guilds.length} sunucu</span>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-all duration-300 ${serverMenuOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              <AnimatePresence>
                {serverMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setServerMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-3 w-80 rounded-2xl bg-gray-800/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-blue-500/10 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                        <h3 className="text-white font-bold text-sm">Sunucu Değiştir</h3>
                        <p className="text-gray-400 text-xs mt-1">Yönetmek için bir sunucu seçin</p>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2">
                        {guilds.map((g, index) => (
                          <motion.div
                            key={g.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link
                              href={`/manage/${g.id}`}
                              onClick={() => setServerMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${g.id === guild.id
                                  ? 'bg-blue-500/10 border border-blue-500/30'
                                  : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                                }`}
                            >
                              {g.icon ? (
                                <img
                                  src={getDiscordGuildIconUrl(g.id, g.icon, 64)}
                                  alt={g.name}
                                  className="w-12 h-12 rounded-xl"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                  <span className="text-white text-lg font-black">{g.name.charAt(0)}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{g.name}</p>
                                <p className="text-gray-400 text-xs">{g.memberCount || 'N/A'} üye</p>
                              </div>
                              {g.id === guild.id && (
                                <CheckCircleIcon className="w-5 h-5 text-blue-400" />
                              )}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity" />
                  <img
                    src={
                      user.avatar
                        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`
                    }
                    alt={user.username}
                    className="relative w-9 h-9 rounded-full ring-2 ring-white/10 group-hover:ring-purple-500/50 transition-all"
                  />
                </div>
                <span className="hidden sm:inline text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                  {user.username}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-all duration-300 ${userMenuOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-3 w-64 rounded-2xl bg-gray-800/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-purple-500/10 z-50 overflow-hidden"
                    >
                      {/* User Info Header */}
                      <div className="p-4 border-b border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={
                                user.avatar
                                  ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                                  : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`
                              }
                              alt={user.username}
                              className="w-12 h-12 rounded-full ring-2 ring-purple-500/50"
                            />
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold text-sm truncate">{user.username}</p>
                              {(user?.id === '315875588906680330' || user?.id === '413081778031427584') && (
                                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 text-purple-300">
                                  DEV
                                </span>
                              )}
                            </div>
                            {user.discriminator && user.discriminator !== '0' && (
                              <p className="text-gray-400 text-xs">#{user.discriminator}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href="/"
                          className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium">Ana Sayfa</span>
                        </Link>
                        <Link
                          href="/servers"
                          className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                            <ServerIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Sunucularım</span>
                        </Link>

                        {(user?.id === '315875588906680330' || user?.id === '413081778031427584') && (
                          <Link
                            href="/dev-panel"
                            className="flex items-center gap-3 px-3 py-2.5 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl transition-all group"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                              <Cog6ToothIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Developer Panel</span>
                          </Link>
                        )}

                        <div className="my-2 h-px bg-white/10" />

                        {onLogout && (
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                              <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Çıkış Yap</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
