'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, SparklesIcon, UsersIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="h-20"></div>
      
      <div className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
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
          className="text-center mb-16"
        >
          <div className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-6">
            <SparklesIcon className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Hakkımızda
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discord sunucularını güçlendiren, toplulukları bir araya getiren modern bot platformu
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8"
          >
            <RocketLaunchIcon className="w-12 h-12 text-purple-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Vizyonumuz</h2>
            <p className="text-gray-300 leading-relaxed">
              Neurovia, Discord topluluklarını daha etkileşimli, güvenli ve yönetilebilir hale getirmek için geliştirilmiştir.
              Amacımız, sunucu sahiplerine kapsamlı araçlar sunarak topluluk deneyimini en üst düzeye çıkarmaktır.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8"
          >
            <UsersIcon className="w-12 h-12 text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Misyonumuz</h2>
            <p className="text-gray-300 leading-relaxed">
              Her büyüklükteki Discord sunucusuna, profesyonel seviyede moderasyon, ekonomi ve etkileşim araçları sağlamak.
              Kullanıcı dostu arayüz ve güçlü özelliklerle toplulukları büyütmek.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold mb-6">Özelliklerimiz</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-purple-400 mb-2">🪙 NRC Ekonomi</h3>
              <p className="text-gray-400">Kapsamlı ekonomi sistemi ile sunucunuzu canlandırın</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">🛡️ Moderasyon</h3>
              <p className="text-gray-400">Gelişmiş auto-mod ve manuel moderasyon araçları</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-2">📊 Analytics</h3>
              <p className="text-gray-400">Detaylı sunucu istatistikleri ve raporlar</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Bizimle İletişime Geçin</h2>
          <p className="text-gray-400 mb-6">Sorularınız veya önerileriniz için bize ulaşın</p>
          <Link
            href="/destek"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Destek Al
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
