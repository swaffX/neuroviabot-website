'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ServerIcon,
  UsersIcon,
  HashtagIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import LoadingSkeleton from '../LoadingSkeleton';
import { getDiscordGuildIconUrl } from '@/lib/discord';

interface ServerOverviewProps {
  guildId: string;
  userId: string;
}

interface GuildInfo {
  name: string;
  icon: string | null;
  banner: string | null;
  description: string | null;
  memberCount: number;
  onlineCount: number;
  channelCount: number;
  roleCount: number;
  boostLevel: number;
  boostCount: number;
  createdAt: string;
}

export default function ServerOverview({ guildId, userId }: ServerOverviewProps) {
  const [guildInfo, setGuildInfo] = useState<GuildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuildInfo();
  }, [guildId]);

  const fetchGuildInfo = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

      // Fetch guild basic info
      const guildResponse = await fetch(`${API_URL}/api/guilds/${guildId}`, {
        credentials: 'include',
      });

      // Fetch REAL bot stats from bot server
      const statsResponse = await fetch(`${API_URL}/api/bot/stats/${guildId}`, {
        credentials: 'include',
      });

      if (guildResponse.ok && statsResponse.ok) {
        const guildData = await guildResponse.json();
        const statsData = await statsResponse.json();

        setGuildInfo({
          name: guildData.name,
          icon: guildData.icon,
          banner: guildData.banner,
          description: guildData.description,
          memberCount: statsData?.stats?.memberCount || 0,
          onlineCount: statsData?.stats?.onlineMembers || 0,
          channelCount: statsData?.stats?.channelCount || 0,
          roleCount: statsData?.stats?.roleCount || 0,
          boostLevel: statsData?.stats?.boostLevel || 0,
          boostCount: statsData?.stats?.boostCount || 0,
          createdAt: statsData?.stats?.guildCreatedAt || null,
        });
      } else if (guildResponse.ok) {
        // Fallback to basic guild data if stats fail
        const guildData = await guildResponse.json();
        setGuildInfo(guildData);
      }
    } catch (error) {
      console.error('Error fetching guild info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="stats" />;
  }

  if (!guildInfo) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-400">Sunucu bilgileri yüklenemedi.</p>
      </div>
    );
  }

  const stats = [
    {
      icon: UsersIcon,
      label: 'Toplam Üye',
      value: guildInfo.memberCount?.toLocaleString() || '0',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: UsersIcon,
      label: 'Çevrimiçi Üye',
      value: guildInfo.onlineCount?.toLocaleString() || '0',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: HashtagIcon,
      label: 'Toplam Kanal',
      value: guildInfo.channelCount?.toString() || '0',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: ShieldCheckIcon,
      label: 'Toplam Rol',
      value: guildInfo.roleCount?.toString() || '0',
      gradient: 'from-yellow-500 to-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Server Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-start gap-6">
          {/* Server Icon */}
          <div className="relative">
            {guildInfo.icon ? (
              <img
                src={getDiscordGuildIconUrl(guildId, guildInfo.icon, 128)}
                alt={guildInfo.name}
                className="w-24 h-24 rounded-2xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <ServerIcon className="w-12 h-12 text-white" />
              </div>
            )}

            {/* Boost Badge */}
            {guildInfo.boostLevel > 0 && (
              <div className="absolute -top-2 -right-2 px-2 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 flex items-center gap-1">
                <SparklesIcon className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-bold">Level {guildInfo.boostLevel}</span>
              </div>
            )}
          </div>

          {/* Server Details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-black text-white mb-2">{guildInfo.name}</h2>
            {guildInfo.description && (
              <p className="text-gray-400 mb-4">{guildInfo.description}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                <span className="text-gray-400 text-sm">Oluşturulma: </span>
                <span className="text-white text-sm font-medium">
                  {new Date(guildInfo.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>

              {guildInfo.boostCount > 0 && (
                <div className="px-3 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30">
                  <span className="text-pink-400 text-sm font-medium">
                    {guildInfo.boostCount} Boost
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="relative group"
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.gradient} rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-300`} />

              <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Graph Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <ChartBarIcon className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Aktivite Grafiği</h3>
        </div>

        <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
          <div className="text-center">
            <ChartBarIcon className="w-16 h-16 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aktivite verileri yakında eklenecek</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

