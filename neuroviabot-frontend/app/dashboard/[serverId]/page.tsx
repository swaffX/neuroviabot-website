'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  HandRaisedIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BoltIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  BellIcon,
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  HashtagIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

// Feature Categories (MEE6 style)
const categories = [
  {
    id: 'welcome',
    name: 'Hoşgeldin & Hoşçakal',
    description: 'Yeni üyeleri karşılayın ve ayrılan üyelere veda edin',
    icon: HandRaisedIcon,
    color: 'from-blue-500 to-cyan-500',
    premium: false,
    features: [
      {
        id: 'welcomeMessage',
        name: 'Karşılama Mesajı',
        description: 'Yeni üyelere özel karşılama mesajı gönderin',
        settings: ['channelId', 'message', 'embed']
      },
      {
        id: 'leaveMessage',
        name: 'Ayrılma Mesajı',
        description: 'Ayrılan üyeler için mesaj gönderin',
        settings: ['channelId', 'message']
      },
    ]
  },
  {
    id: 'roles',
    name: 'Tepki Rolleri',
    description: 'Üyelerin tepki vererek rol almasını sağlayın',
    icon: UserGroupIcon,
    color: 'from-purple-500 to-pink-500',
    premium: true,
    features: [
      {
        id: 'reactionRoles',
        name: 'Tepki Rolleri',
        description: 'Mesajlara tepki vererek rol kazanma sistemi',
        settings: ['messageId', 'roles']
      },
    ]
  },
  {
    id: 'moderation',
    name: 'Moderasyon',
    description: 'Sunucunuzu otomatik olarak koruyun',
    icon: ShieldCheckIcon,
    color: 'from-red-500 to-orange-500',
    premium: false,
    features: [
      {
        id: 'autoMod',
        name: 'Otomatik Moderasyon',
        description: 'Spam, küfür ve zararlı içerikleri engelleyin',
        settings: ['enabled', 'spamProtection', 'badWords', 'logChannel']
      },
      {
        id: 'warnings',
        name: 'Uyarı Sistemi',
        description: 'Üyelere uyarı verin ve otomatik ceza uygulayın',
        settings: ['enabled', 'maxWarnings', 'punishments']
      },
    ]
  },
  {
    id: 'leveling',
    name: 'Seviye Sistemi',
    description: 'Aktif üyeleri ödüllendirin',
    icon: ChartBarIcon,
    color: 'from-green-500 to-emerald-500',
    premium: false,
    features: [
      {
        id: 'xpSystem',
        name: 'XP Sistemi',
        description: 'Mesaj başına XP kazanma sistemi',
        settings: ['enabled', 'xpPerMessage', 'cooldown', 'announceChannel']
      },
      {
        id: 'roleRewards',
        name: 'Seviye Ödülleri',
        description: 'Belirli seviyelerde otomatik rol verin',
        settings: ['rewards']
      },
    ]
  },
  {
    id: 'automation',
    name: 'Otomasyon',
    description: 'Sunucu yönetimini otomatikleştirin',
    icon: BoltIcon,
    color: 'from-yellow-500 to-amber-500',
    premium: true,
    features: [
      {
        id: 'autoRole',
        name: 'Otomatik Rol',
        description: 'Yeni üyelere otomatik rol verin',
        settings: ['enabled', 'roleId']
      },
      {
        id: 'scheduled',
        name: 'Zamanlanmış Mesajlar',
        description: 'Belirli zamanlarda mesaj gönderin',
        settings: ['messages']
      },
    ]
  },
  {
    id: 'general',
    name: 'Genel Ayarlar',
    description: 'Bot yapılandırması',
    icon: Cog6ToothIcon,
    color: 'from-gray-500 to-slate-500',
    premium: false,
    features: [
      {
        id: 'prefix',
        name: 'Komut Öneki',
        description: 'Bot komutları için önek belirleyin',
        settings: ['prefix']
      },
      {
        id: 'language',
        name: 'Dil',
        description: 'Bot dilini seçin',
        settings: ['language']
      },
    ]
  },
];

export default function ServerDashboard() {
  const params = useParams();
  const router = useRouter();
  const serverId = params?.serverId as string;
  
  const [activeCategory, setActiveCategory] = useState('welcome');
  const [guild, setGuild] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [notifications] = useState(3); // Mock notifications

  useEffect(() => {
    fetchUser();
    if (serverId) {
      fetchGuildData();
      fetchGuildSettings();
    }
  }, [serverId]);

  const fetchUser = async () => {
    try {
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/auth/user`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchGuildData = async () => {
    try {
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guilds/${serverId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setGuild(data);
      }
    } catch (error) {
      console.error('Failed to fetch guild:', error);
    }
  };

  const fetchGuildSettings = async () => {
    try {
      setLoading(true);
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guilds/${serverId}/settings`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (category: string, featureId: string, currentValue: boolean) => {
    try {
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guilds/${serverId}/settings/${category}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          [featureId]: !currentValue
        }),
      });
      
      if (response.ok) {
        // Update local state
        setSettings((prev: any) => ({
          ...prev,
          [category]: {
            ...prev[category],
            [featureId]: !currentValue
          }
        }));
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#23272f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 text-lg font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#23272f]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#2c2f38] border-b border-white/10 z-50 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </div>
          <span className="text-xl font-black text-white">NeuroViaBot</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
            <BellIcon className="w-6 h-6 text-gray-300" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              {user && (
                <>
                  <img
                    src={user.avatar 
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`
                    }
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white font-semibold text-sm">{user.username}</span>
                </>
              )}
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#2c2f38] border border-white/10 shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-white font-semibold text-sm">{user?.username}</p>
                    {user?.discriminator && user.discriminator !== '0' && (
                      <p className="text-gray-400 text-xs">#{user.discriminator}</p>
                    )}
                  </div>
                  <div className="p-2">
                    <Link
                      href="/"
                      className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors text-sm"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Ana Sayfa
                    </Link>
                    <Link
                      href="/servers"
                      className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors text-sm"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Sunucularım
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#2c2f38] border-r border-white/10 overflow-y-auto">
          {/* Server Info */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl font-black">
                  {guild?.name?.charAt(0) || 'S'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm truncate">{guild?.name || 'Server'}</h3>
                <p className="text-gray-400 text-xs">{guild?.memberCount || 0} üye</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="p-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${
                    isActive
                      ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-sm flex-1 text-left">{category.name}</span>
                  {category.premium && (
                    <SparklesIcon className="w-4 h-4 text-yellow-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Back Button */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <Link
              href="/servers"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="font-semibold text-sm">Sunuculara Dön</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Category Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-3">
                  {currentCategory && (
                    <>
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentCategory.color}`}>
                        <currentCategory.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                          {currentCategory.name}
                          {currentCategory.premium && (
                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-xs font-bold text-white flex items-center gap-1">
                              <SparklesIcon className="w-4 h-4" />
                              PREMIUM
                            </span>
                          )}
                        </h1>
                        <p className="text-gray-400 mt-1">{currentCategory.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                {currentCategory?.features?.map((feature) => {
                  const isEnabled = settings[activeCategory]?.[feature.id] !== false;
                  const isExpanded = expandedFeature === feature.id;

                  return (
                    <motion.div
                      key={feature.id}
                      layout
                      className="bg-[#2c2f38] rounded-xl border border-white/10 overflow-hidden"
                    >
                      {/* Feature Header */}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-1">{feature.name}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Expand Button */}
                            {isEnabled && (
                              <button
                                onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <ChevronDownIcon
                                  className={`w-5 h-5 text-gray-400 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}

                            {/* Toggle */}
                            <button
                              onClick={() => toggleFeature(activeCategory, feature.id, isEnabled)}
                              className={`relative w-14 h-7 rounded-full transition-all ${
                                isEnabled
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <span
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                  isEnabled ? 'translate-x-7' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Settings Panel */}
                      <AnimatePresence>
                        {isExpanded && isEnabled && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-white/10 bg-[#23272f]"
                          >
                            <div className="p-6 space-y-4">
                              {feature.settings.map((setting) => (
                                <div key={setting} className="space-y-2">
                                  <label className="text-gray-300 font-semibold text-sm capitalize flex items-center gap-2">
                                    {setting === 'channelId' && <HashtagIcon className="w-4 h-4" />}
                                    {setting.replace(/([A-Z])/g, ' $1').trim()}
                                  </label>
                                  {setting.includes('message') || setting.includes('Message') ? (
                                    <textarea
                                      className="w-full px-4 py-3 bg-[#2c2f38] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                                      rows={3}
                                      placeholder={`${setting} giriniz...`}
                                    />
                                  ) : setting === 'channelId' ? (
                                    <select className="w-full px-4 py-3 bg-[#2c2f38] border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none">
                                      <option value="">Kanal seçiniz...</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      className="w-full px-4 py-3 bg-[#2c2f38] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                      placeholder={`${setting} giriniz...`}
                                    />
                                  )}
                                </div>
                              ))}
                              
                              <button className="mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5" />
                                Kaydet
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
