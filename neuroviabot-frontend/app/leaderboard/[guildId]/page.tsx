'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrophyIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  xp: number;
  level: number;
  nextLevelXP: number;
  progress: number;
}

export default function LeaderboardPage() {
  const params = useParams();
  const guildId = params.guildId as string;
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [guildId, filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(
        `${API_URL}/api/leveling/${guildId}/leaderboard?limit=100`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-orange-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-yellow-600';
    return 'from-blue-500 to-purple-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSkeleton type="list" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href={`/manage/${guildId}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Sunucu Ayarlarına Dön
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <TrophyIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">Seviye Sıralaması</h1>
                <p className="text-gray-400">En aktif üyeleri keşfedin</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-3 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
              >
                Tüm Zamanlar
              </button>
              <button
                onClick={() => setFilter('monthly')}
                className={`px-4 py-3 rounded-lg font-semibold transition ${
                  filter === 'monthly'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
              >
                Bu Ay
              </button>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        {filteredLeaderboard.length === 0 ? (
          <EmptyState
            type="default"
            title="Sıralama Yok"
            description="Henüz bu sunucuda seviye kazanan kullanıcı yok."
          />
        ) : (
          <div className="space-y-3">
            {filteredLeaderboard.map((user, index) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 transition group"
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRankColor(
                      user.rank
                    )} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-white font-black text-lg">
                      {getRankIcon(user.rank)}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={user.avatar || `https://cdn.discordapp.com/embed/avatars/${user.rank % 5}.png`}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border-2 border-purple-500"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full px-2 py-0.5 text-xs font-bold text-purple-400 border border-purple-500">
                      {user.level}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">
                      {user.username}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{user.xp.toLocaleString()} XP</span>
                      <span>•</span>
                      <span>{user.progress}% to level {user.level + 1}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="hidden sm:block w-48">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${user.progress}%` }}
                        transition={{ duration: 1, delay: index * 0.05 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

