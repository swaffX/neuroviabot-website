'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ServerIcon,
  PlusIcon,
  Cog6ToothIcon,
  UsersIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  memberCount?: number;
  botPresent: boolean;
}

export default function ServersPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterBotPresent, setFilterBotPresent] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserAndGuilds();
  }, []);

  const fetchUserAndGuilds = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      
      // Fetch user
      const userResponse = await fetch(`${API_URL}/api/auth/user`, {
        credentials: 'include',
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      } else {
        router.push('/');
        return;
      }

      // Fetch guilds
      const guildsResponse = await fetch(`${API_URL}/api/guilds/user`, {
        credentials: 'include',
      });
      
      if (guildsResponse.ok) {
        const guildsData = await guildsResponse.json();
        setGuilds(guildsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGuildIcon = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
    }
    return null;
  };

  const handleManageServer = (guildId: string) => {
    // Instant redirect without loading - manage page will handle its own loading
    router.push(`/manage/${guildId}`);
  };

  const handleAddBot = (guildId: string) => {
    // Bot invite URL - with integration_type=0 to avoid code grant requirement
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=773539215098249246&permissions=8&integration_type=0&scope=bot+applications.commands&guild_id=${guildId}&disable_guild_select=true`;
    
    // Open invite in new tab
    const popup = window.open(inviteUrl, '_blank');
    
    // Optional: Poll for bot being added (check every 3 seconds)
    const checkInterval = setInterval(async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
        const response = await fetch(`${API_URL}/api/guilds/user`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const updatedGuild = data.find((g: any) => g.id === guildId);
          
          // If bot is now present, redirect
          if (updatedGuild?.botPresent) {
            clearInterval(checkInterval);
            router.push(`/manage`);
          }
        }
      } catch (error) {
        console.error('Error checking bot status:', error);
      }
    }, 3000);
    
    // Stop checking after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  };

  const handleLogout = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Filter and search guilds
  const filteredGuilds = guilds.filter(guild => {
    const matchesSearch = guild.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterBotPresent === null || guild.botPresent === filterBotPresent;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] relative overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-lg">Sunucular yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] relative">
      {/* Static Background - removed animations for performance */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-15"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-15"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(88, 101, 242, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(88, 101, 242, 0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Back to Home Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-6 z-10"
        >
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all group"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Ana Sayfa</span>
          </Link>
        </motion.div>

        {/* User Profile - Top Right */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 right-6 z-10 flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <img
              src={
                user.avatar
                  ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                  : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`
              }
              alt={user.username}
              className="w-8 h-8 rounded-full"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">{user.username}</p>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <main className="max-w-[1400px] mx-auto px-6 py-24 pb-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-6 ring-2 ring-white/10"
            >
              <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400">
              Sunucu Yönetimi
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Discord sunucularınızı profesyonelce yönetin, ayarlarınızı özelleştirin.
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-gray-300 font-medium text-sm">
                  {loading ? 'Yükleniyor...' : `${filteredGuilds.length} Sunucu`}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-gray-300 font-medium text-sm">
                  {guilds.filter(g => g.botPresent).length} Bot Aktif
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-gray-300 font-medium text-sm">
                  {guilds.filter(g => !g.botPresent).length} Bot Eklenebilir
                </span>
              </div>
            </div>
          </motion.div>

            {/* Search, Filter and View Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col md:flex-row gap-4 mb-8"
            >
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sunucu ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterBotPresent(null)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    filterBotPresent === null
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setFilterBotPresent(true)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    filterBotPresent === true
                      ? 'bg-green-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Bot Var
                </button>
                <button
                  onClick={() => setFilterBotPresent(false)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    filterBotPresent === false
                      ? 'bg-gray-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Bot Yok
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Grid görünümü"
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Liste görünümü"
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {filteredGuilds.length === 0 && searchQuery ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-20"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-500/10 mb-6">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Sunucu Bulunamadı</h2>
                <p className="text-gray-400 text-lg mb-6">"{searchQuery}" için sonuç bulunamadı.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-all"
                >
                  Aramayı Temizle
                </button>
              </motion.div>
            ) : guilds.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-20"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-500/10 mb-6">
                  <ServerIcon className="w-12 h-12 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Sunucu Bulunamadı</h2>
                <p className="text-gray-400 text-lg mb-6">Yönetici olduğun sunucu bulunamadı.</p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Discord'da bir sunucuya yönetici izni aldığında burada görünecektir.</p>
              </motion.div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                {filteredGuilds.map((guild, index) => (
                  <motion.div
                    key={guild.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: Math.min(index * 0.05, 0.4)
                    }}
                    whileHover={{ 
                      y: -4,
                      transition: { duration: 0.2 }
                    }}
                    className="group relative"
                  >
                    {/* Static gradient border - no animation for performance */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-75 blur-md transition-opacity duration-300" />
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-pink-500/5 rounded-2xl blur-2xl transition-all duration-500"></div>
                    
                    {/* Card content */}
                    <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-2xl border-2 border-white/10 group-hover:border-purple-500/30 rounded-2xl p-6 h-full flex flex-col shadow-xl group-hover:shadow-2xl group-hover:shadow-purple-500/20 transition-all duration-500">
                      {/* Server Icon & Info */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          {getGuildIcon(guild) ? (
                            <img
                              src={getGuildIcon(guild)!}
                              alt={guild.name}
                              className="w-16 h-16 rounded-2xl"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                              <span className="text-white text-2xl font-black">
                                {guild.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {guild.owner && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                              <ShieldCheckIcon className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-lg truncate mb-1">
                            {guild.name}
                          </h3>
                          {guild.memberCount && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <UsersIcon className="w-4 h-4" />
                              <span>{guild.memberCount.toLocaleString()} üye</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-4">
                        {guild.botPresent ? (
                          <motion.div 
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                          >
                            <motion.span 
                              className="w-2 h-2 bg-green-400 rounded-full"
                              animate={{ 
                                scale: [1, 1.3, 1],
                                opacity: [1, 0.7, 1]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            ></motion.span>
                            <span className="text-green-400 text-sm font-medium">Bot Aktif</span>
                          </motion.div>
                        ) : (
                          <motion.div 
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/30"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                          >
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            <span className="text-gray-400 text-sm font-medium">Bot Yok</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="mt-auto">
                        {guild.botPresent ? (
                          <motion.button
                            onClick={() => handleManageServer(guild.id)}
                            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.7 }}
                          >
                            {/* Animated background */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
                              initial={{ x: '-100%' }}
                              whileHover={{ x: '0%' }}
                              transition={{ duration: 0.3 }}
                            />
                            
                            {/* Shine effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              initial={{ x: '-100%' }}
                              whileHover={{ x: '100%' }}
                              transition={{ duration: 0.6 }}
                            />
                            
                            <Cog6ToothIcon className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300 relative z-10" />
                            <span className="relative z-10">Yönet</span>
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => handleAddBot(guild.id)}
                            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.7 }}
                          >
                            {/* Animated background */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600"
                              initial={{ x: '-100%' }}
                              whileHover={{ x: '0%' }}
                              transition={{ duration: 0.3 }}
                            />
                            
                            {/* Shine effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              initial={{ x: '-100%' }}
                              whileHover={{ x: '100%' }}
                              transition={{ duration: 0.6 }}
                            />
                            
                            <PlusIcon className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300 relative z-10" />
                            <span className="relative z-10">Botu Ekle</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </main>
      </div>
    </div>
  );
}