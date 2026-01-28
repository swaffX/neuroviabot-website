'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface PremiumSettingsProps {
  guildId: string;
  userId: string;
}

export default function PremiumSettings({ guildId, userId }: PremiumSettingsProps) {
  const [premium, setPremium] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPremiumStatus();
  }, [guildId]);

  const fetchPremiumStatus = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/premium/guild/${guildId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPremium(data.premium);
      }
    } catch (error) {
      console.error('Error fetching premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const isPremium = premium && premium.plan !== 'free';

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${
          isPremium
            ? 'from-purple-600/20 to-pink-600/20 border-purple-500'
            : 'from-gray-800/50 to-gray-900/50 border-gray-700'
        } border rounded-xl p-6`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${
              isPremium ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 'bg-gray-700'
            } flex items-center justify-center`}>
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white capitalize">
                {premium?.plan || 'Free'} Plan
              </h3>
              <p className="text-gray-400 text-sm">
                {isPremium ? 'Premium aktif' : 'Ücretsiz plan'}
              </p>
            </div>
          </div>
          
          {!isPremium && (
            <Link
              href="/premium"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition flex items-center gap-2"
            >
              <ArrowUpIcon className="w-4 h-4" />
              Yükselt
            </Link>
          )}
        </div>

        {isPremium && premium.expiresAt && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <ClockIcon className="w-4 h-4" />
            <span>
              Bitiş: {new Date(premium.expiresAt).toLocaleDateString('tr-TR')}
            </span>
          </div>
        )}

        {/* Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Aktif Özellikler:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {isPremium ? (
              // Premium Features
              [
                'Sınırsız Tepki Rolleri',
                'Gelişmiş Otomasyon',
                'Öncelikli Destek',
                'Özel Komutlar (Sınırsız)',
                'Gelişmiş İstatistikler',
                'Özel Bot Durumu',
                'Sunucu Yedekleme',
                'Gelişmiş Güvenlik',
                'Özel Hoşgeldin Mesajları',
                'İleri Seviye Moderasyon'
              ].map((feature: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))
            ) : (
              // Free Features
              [
                'Temel Moderasyon',
                'Hoşgeldin Mesajları',
                'Seviye Sistemi',
                'Tepki Rolleri (5 adet)',
                'Temel Komutlar',
                'Sunucu İstatistikleri'
              ].map((feature: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Usage Stats (Mock) */}
      {isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Kullanım İstatistikleri</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">∞</div>
              <div className="text-sm text-gray-400">Özel Komutlar</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">✓</div>
              <div className="text-sm text-gray-400">Gelişmiş İstatistikler</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">✓</div>
              <div className="text-sm text-gray-400">Öncelikli Destek</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">∞</div>
              <div className="text-sm text-gray-400">Tepki Rolleri</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upgrade CTA */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6 text-center"
        >
          <SparklesIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Premium ile Daha Fazlası
          </h3>
          <p className="text-gray-400 mb-4">
            Sunucunuzu bir sonraki seviyeye taşıyacak özel özelliklerin kilidini açın
          </p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold transition"
          >
            <SparklesIcon className="w-5 h-5" />
            Premium'a Geç
          </Link>
        </motion.div>
      )}
    </div>
  );
}

