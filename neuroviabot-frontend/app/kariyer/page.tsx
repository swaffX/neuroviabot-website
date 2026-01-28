'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, BriefcaseIcon, RocketLaunchIcon, HeartIcon } from '@heroicons/react/24/outline';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="h-20"></div>
      
      <div className="max-w-6xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-10">
          <ArrowLeftIcon className="w-5 h-5" />
          Ana Sayfaya Dön
        </Link>

        <div className="text-center mb-16">
          <BriefcaseIcon className="w-16 h-16 text-purple-400 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Kariyer Fırsatları
          </h1>
          <p className="text-xl text-gray-300">Neurovia ekibine katılın</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
            <RocketLaunchIcon className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">İnovasyon</h3>
            <p className="text-gray-400">Yeni teknolojilerle çalışın ve Discord ekosistemini geliştirin</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
            <HeartIcon className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Takım Ruhu</h3>
            <p className="text-gray-400">Tutkulu ve yetenekli bir ekiple çalışın</p>
          </div>
          <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-2xl p-6">
            <BriefcaseIcon className="w-10 h-10 text-pink-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Esneklik</h3>
            <p className="text-gray-400">Uzaktan çalışma ve esnek saatler</p>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Açık Pozisyonlar</h2>
          <p className="text-gray-400 mb-4">Şu anda aktif pozisyon bulunmamaktadır. Gelecekteki fırsatlar için bizi takip edin!</p>
          <Link href="/destek" className="inline-block px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
            İletişime Geç
          </Link>
        </div>
      </div>
    </div>
  );
}
