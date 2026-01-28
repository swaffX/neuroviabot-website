'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  UserIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Mock data
      setProfile({
        id: userId,
        username: 'User#1234',
        avatar: null,
        bio: 'NeuroCoin trader & gamer',
        color: '#8B5CF6',
        badges: ['🏆', '💎', '🔥'],
        balance: { total: 125000, wallet: 75000, bank: 50000 },
        stats: {
          level: 42,
          messages: 15420,
          voiceTime: 128,
          gameWins: 234,
          tradeCount: 67,
          achievements: 18
        },
        streak: 45
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 text-white"
        >
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl">
              <UserIcon className="w-16 h-16" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black mb-2">{profile.username}</h1>
              {profile.bio && <p className="text-purple-200 italic">"{profile.bio}"</p>}
              {profile.badges.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {profile.badges.map((badge: string, i: number) => (
                    <span key={i} className="text-2xl">{badge}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-purple-200 text-sm">Seviye</p>
              <p className="text-5xl font-black">{profile.stats.level}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
            label="Toplam NRC"
            value={`${profile.balance.total.toLocaleString()}`}
            color="from-purple-500 to-blue-500"
          />
          <StatCard
            icon={<TrophyIcon className="w-6 h-6" />}
            label="Başarılar"
            value={`${profile.stats.achievements}/50`}
            color="from-yellow-500 to-amber-500"
          />
          <StatCard
            icon={<ClockIcon className="w-6 h-6" />}
            label="Streak"
            value={`${profile.streak} gün 🔥`}
            color="from-red-500 to-orange-500"
          />
        </div>

        {/* Activity Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-purple-400" />
            Aktivite İstatistikleri
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">💬 Mesajlar</p>
              <p className="text-2xl font-bold text-white">{profile.stats.messages.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">🎤 Sesli Sohbet</p>
              <p className="text-2xl font-bold text-white">{profile.stats.voiceTime}h</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">🎮 Oyun Zaferleri</p>
              <p className="text-2xl font-bold text-white">{profile.stats.gameWins}</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">🛒 Ticaretler</p>
              <p className="text-2xl font-bold text-white">{profile.stats.tradeCount}</p>
            </div>
          </div>
        </motion.div>

        {/* NRC Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingBagIcon className="w-6 h-6 text-purple-400" />
            NeuroCoin Portföyü
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
              <p className="text-gray-300 text-sm mb-1">💵 Cüzdan</p>
              <p className="text-3xl font-bold text-white">{profile.balance.wallet.toLocaleString()} NRC</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
              <p className="text-gray-300 text-sm mb-1">🏦 Banka</p>
              <p className="text-3xl font-bold text-white">{profile.balance.bank.toLocaleString()} NRC</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

