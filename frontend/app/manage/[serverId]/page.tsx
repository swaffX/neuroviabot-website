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
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import BotCommands from '../../../components/dashboard/BotCommands';
import FeatureManager from '../../../components/dashboard/FeatureManager';
import WelcomeSettings from '../../../components/dashboard/WelcomeSettings';
import ModerationSettings from '../../../components/dashboard/ModerationSettings';
import LevelingSettings from '../../../components/dashboard/LevelingSettings';
import BackupSettings from '../../../components/dashboard/BackupSettings';
import SecuritySettings from '../../../components/dashboard/SecuritySettings';
import AnalyticsSettings from '../../../components/dashboard/AnalyticsSettings';
import AutomationSettings from '../../../components/dashboard/AutomationSettings';
import RoleReactionSettings from '../../../components/dashboard/RoleReactionSettings';
import PremiumSettings from '../../../components/dashboard/PremiumSettings';
import ServerOverview from '../../../components/dashboard/ServerOverview';
import MemberManagement from '../../../components/dashboard/MemberManagement';
import RoleEditor from '../../../components/dashboard/RoleEditor';
import ChannelManager from '../../../components/dashboard/ChannelManager';
import AuditLog from '../../../components/dashboard/AuditLog';
import ServerStatsSettings from '../../../components/dashboard/ServerStatsSettings';
import { useSocket } from '@/contexts/SocketContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { DocumentTextIcon, UsersIcon } from '@heroicons/react/24/outline';
import ManageNavbar from '@/components/layout/ManageNavbar';
import { getDiscordGuildIconUrl } from '@/lib/discord';

// Feature Categories - NEW MANAGEMENT CATEGORIES FIRST
const categories = [
  {
    id: 'overview',
    name: 'Genel Bakış',
    description: 'Sunucu istatistikleri ve genel bilgiler',
    icon: ChartBarIcon,
    color: 'from-blue-500 to-cyan-500',
    premium: false,
  },
  {
    id: 'members',
    name: 'Üye Yönetimi',
    description: 'Üyeleri yönetin, at, yasaklayın veya susturun',
    icon: UsersIcon,
    color: 'from-purple-500 to-pink-500',
    premium: false,
  },
  {
    id: 'roles',
    name: 'Rol Yönetimi',
    description: 'Rolleri oluşturun, düzenleyin ve yönetin',
    icon: ShieldCheckIcon,
    color: 'from-green-500 to-emerald-500',
    premium: false,
  },
  {
    id: 'channels',
    name: 'Kanal Yönetimi',
    description: 'Kanalları oluşturun, düzenleyin ve silin',
    icon: HashtagIcon,
    color: 'from-yellow-500 to-amber-500',
    premium: false,
  },
  {
    id: 'audit',
    name: 'Denetim Kaydı',
    description: 'Sunucu değişikliklerini ve işlemleri takip edin',
    icon: DocumentTextIcon,
    color: 'from-red-500 to-orange-500',
    premium: false,
  },
  {
    id: 'server-stats',
    name: 'Server Stats',
    description: 'Real-time sunucu istatistikleri (Members, Bots, Total)',
    icon: ChartBarIcon,
    color: 'from-cyan-500 to-blue-500',
    premium: false,
  },
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
    id: 'reaction-roles',
    name: 'Tepki Rolleri',
    description: 'Üyelerin tepki vererek rol almasını sağlayın',
    icon: UserGroupIcon,
    color: 'from-purple-500 to-pink-500',
    premium: false, // Changed to false for now
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
    id: 'backup',
    name: 'Yedekleme',
    description: 'Sunucu yedekleme ve geri yükleme sistemi',
    icon: ShieldCheckIcon,
    color: 'from-blue-500 to-indigo-500',
    premium: true,
    features: [
      {
        id: 'backupSystem',
        name: 'Yedekleme Sistemi',
        description: 'Sunucu ayarlarını yedekle ve geri yükle',
        settings: ['create', 'restore', 'list', 'delete', 'schedule']
      },
    ]
  },
  {
    id: 'security',
    name: 'Güvenlik',
    description: 'Sunucu güvenlik ve doğrulama sistemi',
    icon: ShieldCheckIcon,
    color: 'from-red-500 to-orange-500',
    premium: false,
    features: [
      {
        id: 'guardSystem',
        name: 'Guard Sistemi',
        description: 'Anti-raid ve güvenlik koruması',
        settings: ['enabled', 'raidProtection', 'spamProtection', 'logChannel']
      },
      {
        id: 'verificationSystem',
        name: 'Doğrulama Sistemi',
        description: 'Yeni üye doğrulama ve onay sistemi',
        settings: ['enabled', 'method', 'role', 'timeout']
      },
    ]
  },
  {
    id: 'analytics',
    name: 'Analitik',
    description: 'Sunucu istatistikleri ve analitik raporlar',
    icon: ChartBarIcon,
    color: 'from-indigo-500 to-purple-500',
    premium: false,
    features: [
      {
        id: 'statistics',
        name: 'İstatistikler',
        description: 'Detaylı sunucu ve bot istatistikleri',
        settings: ['bot', 'server', 'activity', 'leaderboard']
      },
      {
        id: 'analytics',
        name: 'Analitik Raporlar',
        description: 'Komut kullanımı ve performans analizi',
        settings: ['commands', 'errors', 'performance', 'users']
      },
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Premium özellikler ve abonelik yönetimi',
    icon: SparklesIcon,
    color: 'from-yellow-500 to-amber-500',
    premium: true,
    features: [
      {
        id: 'premiumFeatures',
        name: 'Premium Özellikler',
        description: 'Premium kullanıcılar için özel özellikler',
        settings: ['status', 'features', 'benefits', 'upgrade']
      },
    ]
  },
];

export default function ServerDashboard() {
  const params = useParams();
  const router = useRouter();
  const serverId = params?.serverId as string;
  const { showNotification } = useNotification();

  const [activeCategory, setActiveCategory] = useState('overview');
  const [guild, setGuild] = useState<any>(null);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [initialLoading, setInitialLoading] = useState(true); // Only for initial page load
  const [user, setUser] = useState<any>(null);
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [guildMenuOpen, setGuildMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Socket.IO with real-time updates and notifications
  const { socket, on, off } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleSettingsUpdated = (data: any) => {
      showNotification(`⚙️ ${data.setting || 'Ayar'} güncellendi!`, 'success');
      if (activeCategory === data.category || !data.category) {
        fetchGuildSettings();
      }
    };

    const handleMemberAction = (data: any) => {
      showNotification(`👤 ${data.action}: ${data.memberName || 'Üye'}`, 'info');
      if (activeCategory === 'members') {
        // Trigger re-fetch in MemberManagement component
      }
    };

    const handleRoleUpdate = (data: any) => {
      showNotification(`🎭 Rol güncellendi: ${data.roleName || 'Rol'}`, 'info');
      if (activeCategory === 'roles') {
        // Trigger re-fetch in RoleEditor component
      }
    };

    const handleChannelUpdate = (data: any) => {
      showNotification(`#️⃣ Kanal güncellendi: ${data.channelName || 'Kanal'}`, 'info');
      if (activeCategory === 'channels') {
        // Trigger re-fetch in ChannelManager component
      }
    };

    // Each component handles its own guild room joining
    // Listen to events
    on('settings_updated', handleSettingsUpdated);
    on('member_action', handleMemberAction);
    on('role_update', handleRoleUpdate);
    on('channel_update', handleChannelUpdate);

    return () => {
      // Clean up listeners
      off('settings_updated', handleSettingsUpdated);
      off('member_action', handleMemberAction);
      off('role_update', handleRoleUpdate);
      off('channel_update', handleChannelUpdate);
    };
  }, [socket, serverId, activeCategory]);

  useEffect(() => {
    // Initial data load
    const loadInitialData = async () => {
      setInitialLoading(true);
      await Promise.all([
        fetchUser(),
        fetchUserGuilds(),
        fetchNotifications(),
        serverId ? fetchGuildData() : Promise.resolve(),
        serverId ? fetchGuildSettings() : Promise.resolve(),
      ]);
      setInitialLoading(false);
    };

    loadInitialData();
  }, [serverId]);

  // NO LOADING on category change - instant switch

  // ESC tuşu ile dropdown kapatma
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && guildMenuOpen) {
        setGuildMenuOpen(false);
      }
    };

    if (guildMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [guildMenuOpen]);

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

  const fetchUserGuilds = async () => {
    try {
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guilds/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const withBot = data.filter((g: any) => g.botPresent);
        setGuilds(withBot);
      }
    } catch (error) {
      console.error('Failed to fetch guilds:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/notifications/notifications`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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
      // NO setLoading here - only initial load shows loading
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

      // Önce bot API'den ayarları al
      try {
        const botResponse = await fetch(`${API_URL}/api/bot/settings/${serverId}`, {
          credentials: 'include',
        });
        if (botResponse.ok) {
          const botData = await botResponse.json();
          setSettings(botData);
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }

      // Fallback: Backend API
      const response = await fetch(`${API_URL}/api/guild-settings/${serverId}/settings`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
    // NO finally setLoading - only initial load controls loading state
  };

  const toggleFeature = async (category: string, featureId: string, currentValue: boolean) => {
    try {
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

      // Önce bot API'ye gönder
      try {
        const botResponse = await fetch(`${API_URL}/api/bot/settings/${serverId}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            category: category,
            settings: {
              [featureId]: !currentValue
            }
          }),
        });

        if (botResponse.ok) {
          // Refresh settings to get latest from server
          await fetchGuildSettings();
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }

      // Fallback: Backend API
      const categoryMap: any = {
        'welcome': 'welcome',
        'roles': 'autorole',
        'moderation': 'moderation',
        'leveling': 'leveling',
        'automation': 'autorole',
        'general': 'general'
      };

      const backendCategory = categoryMap[category] || category;

      const response = await fetch(`${API_URL}/api/guild-settings/${serverId}/settings/${backendCategory}`, {
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
        // Refresh settings to get latest from server
        await fetchGuildSettings();
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const updateSetting = async (category: string, key: string, value: any) => {
    try {
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

      // Önce bot API'ye gönder
      try {
        const botResponse = await fetch(`${API_URL}/api/bot/settings/${serverId}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            category: category,
            settings: {
              [key]: value
            }
          }),
        });

        if (botResponse.ok) {
          await fetchGuildSettings();
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }

      // Fallback: Backend API
      const categoryMap: any = {
        'welcome': 'welcome',
        'roles': 'autorole',
        'moderation': 'moderation',
        'leveling': 'leveling',
        'automation': 'autorole',
        'general': 'general'
      };

      const backendCategory = categoryMap[category] || category;

      const response = await fetch(`${API_URL}/api/guild-settings/${serverId}/settings/${backendCategory}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          [key]: value
        }),
      });

      if (response.ok) {
        await fetchGuildSettings();
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const API_URL = (process.env as any).NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

        {/* Loading Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-gray-900/50 backdrop-blur-xl border border-white/10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full"
            />
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Ayarlar Yükleniyor</h3>
              <p className="text-gray-400">Sunucu ayarları getiriliyor...</p>
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-purple-500 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Custom Manage Navbar */}
      <ManageNavbar
        user={user}
        guild={guild}
        guilds={guilds}
        onLogout={handleLogout}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        unreadCount={unreadCount}
      />

      <div className="flex pt-16 relative z-10">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}

        {/* Sidebar with smooth animations */}
        <motion.aside
          initial={false}
          animate={{
            x: 0,
            opacity: 1
          }}
          transition={{ duration: 0.15, type: "tween", ease: "easeOut" }}
          className={`fixed left-0 top-16 bottom-0 w-72 bg-gray-900/80 backdrop-blur-xl border-r border-white/10 shadow-2xl z-40 flex flex-col transition-transform duration-200 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
        >
          {/* Server Info with gradient */}
          <motion.div
            initial={false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="p-6 border-b border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10"
          >
            <div className="relative">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl blur-md opacity-50"></div>
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center border-2 border-white/20 overflow-hidden">
                    {guild?.icon ? (
                      <img
                        src={getDiscordGuildIconUrl(guild.id, guild.icon, 128)}
                        alt={guild.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-black">
                        {guild?.name?.charAt(0) || 'S'}
                      </span>
                    )}
                  </div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm leading-tight break-words">{guild?.name || 'Server'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-gray-400 text-xs">{guild?.memberCount || 0} üye</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scrollable content with custom scrollbar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-800/30 hover:scrollbar-thumb-purple-500/70">
            {/* Categories with stagger animation */}
            <div className="p-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">Kategoriler</p>
              {categories.map((category, index) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    initial={false}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 relative group ${isActive
                        ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-lg shadow-purple-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {/* Indicator line */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold text-sm flex-1 text-left">{category.name}</span>
                    {category.premium && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <SparklesIcon className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 ml-0 lg:ml-72 p-4 lg:p-8 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: {
                  duration: 0.15,
                  ease: [0.4, 0, 0.2, 1] // Cubic bezier for smooth easing
                }
              }}
              exit={{
                opacity: 0,
                x: 20,
                transition: { duration: 0.1 }
              }}
              style={{ willChange: 'transform, opacity' }} // Hardware acceleration
            >
              {/* Category Header - Hero Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8 relative overflow-hidden rounded-3xl border border-white/10"
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-900/95 backdrop-blur-xl">
                  {currentCategory && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${currentCategory.color} opacity-10`} />
                  )}
                </div>

                {/* Animated Glow Effect */}
                {currentCategory && (
                  <motion.div
                    className={`absolute -inset-1 bg-gradient-to-r ${currentCategory.color} opacity-20 blur-2xl`}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}

                {/* Content */}
                <div className="relative z-10 p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {currentCategory && (
                      <>
                        {/* Icon with Animation */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            delay: 0.1
                          }}
                          className="relative"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${currentCategory.color} rounded-3xl blur-xl opacity-50`} />
                          <div className={`relative p-5 rounded-3xl bg-gradient-to-br ${currentCategory.color} shadow-2xl`}>
                            <currentCategory.icon className="w-12 h-12 text-white" />
                          </div>
                        </motion.div>

                        {/* Text Content */}
                        <div className="flex-1">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-white">
                                {currentCategory.name}
                              </h1>
                              {currentCategory.premium && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-yellow-500/30"
                                >
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  >
                                    <SparklesIcon className="w-5 h-5" />
                                  </motion.div>
                                  PREMIUM
                                </motion.span>
                              )}
                            </div>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-gray-300 text-lg max-w-2xl"
                            >
                              {currentCategory.description}
                            </motion.p>
                          </motion.div>

                          {/* Stats or Info Cards */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-wrap gap-3 mt-6"
                          >
                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              <span className="text-sm font-medium text-gray-300">Aktif</span>
                            </div>
                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2">
                              <Cog6ToothIcon className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium text-gray-300">Özelleştirilebilir</span>
                            </div>
                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2">
                              <BoltIcon className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-medium text-gray-300">Anlık Güncelleme</span>
                            </div>
                          </motion.div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Features */}
              <div className="space-y-4">
                {/* NEW MANAGEMENT COMPONENTS */}
                {activeCategory === 'overview' && (
                  <ServerOverview
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {activeCategory === 'members' && (
                  <MemberManagement
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {activeCategory === 'roles' && (
                  <RoleEditor
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {activeCategory === 'channels' && (
                  <ChannelManager
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {activeCategory === 'audit' && (
                  <AuditLog
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {activeCategory === 'server-stats' && (
                  <ServerStatsSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {activeCategory === 'reaction-roles' && (
                  <RoleReactionSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* EXISTING COMPONENTS */}
                {/* Bot Commands Component */}
                {activeCategory === 'commands' && (
                  <BotCommands
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}



                {/* Feature Manager Component */}
                {activeCategory === 'features' && (
                  <FeatureManager
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* Welcome Settings Component */}
                {activeCategory === 'welcome' && (
                  <WelcomeSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* Moderation Settings Component */}
                {activeCategory === 'moderation' && (
                  <ModerationSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* Leveling Settings Component */}
                {activeCategory === 'leveling' && (
                  <LevelingSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* Backup Settings Component */}
                {activeCategory === 'backup' && (
                  <BackupSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* Security Settings Component */}
                {activeCategory === 'security' && (
                  <SecuritySettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* Analytics Settings Component */}
                {activeCategory === 'analytics' && (
                  <AnalyticsSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* Automation Settings Component */}
                {activeCategory === 'automation' && (
                  <AutomationSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {activeCategory === 'premium' && (
                  <PremiumSettings
                    guildId={serverId}
                    userId={user?.id || 'unknown'}
                  />
                )}

                {/* Other Features */}
                {activeCategory !== 'overview' && activeCategory !== 'members' && activeCategory !== 'channels' && activeCategory !== 'audit' && activeCategory !== 'server-stats' && activeCategory !== 'commands' && activeCategory !== 'features' && activeCategory !== 'welcome' && activeCategory !== 'moderation' && activeCategory !== 'leveling' && activeCategory !== 'music' && activeCategory !== 'games' && activeCategory !== 'backup' && activeCategory !== 'security' && activeCategory !== 'analytics' && activeCategory !== 'automation' && activeCategory !== 'roles' && activeCategory !== 'reaction-roles' && activeCategory !== 'custom' && activeCategory !== 'premium' && currentCategory?.features?.map((feature) => {
                  // Map categories to backend format
                  const categoryMap: any = {
                    'welcome': 'welcome',
                    'roles': 'autorole',
                    'moderation': 'moderation',
                    'leveling': 'leveling',
                    'automation': 'autorole',
                    'general': 'general'
                  };

                  const backendCategory = categoryMap[activeCategory] || activeCategory;
                  const isEnabled = settings[backendCategory]?.enabled !== false && settings[backendCategory]?.[feature.id] !== false;
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
                                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                                    }`}
                                />
                              </button>
                            )}

                            {/* Toggle */}
                            <button
                              onClick={() => toggleFeature(activeCategory, feature.id, isEnabled)}
                              className={`relative w-14 h-7 rounded-full transition-all ${isEnabled
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gray-600'
                                }`}
                            >
                              <span
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-7' : ''
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

