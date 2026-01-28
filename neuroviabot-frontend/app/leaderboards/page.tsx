'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

export default function GlobalLeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<'neurocoin' | 'earnings' | 'quests' | 'marketplace'>('neurocoin');

  const tabs = [
    { id: 'neurocoin', name: 'NeuroCoin', icon: CurrencyDollarIcon },
    { id: 'earnings', name: 'Kazançlar', icon: ChartBarIcon },
    { id: 'quests', name: 'Görevler', icon: TrophyIcon },
    { id: 'marketplace', name: 'Pazar', icon: ShoppingBagIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <TrophyIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Global Sıralamalar</h1>
              <p className="text-gray-400">Tüm sunuculardaki en iyi kullanıcılar</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="text-center p-12 bg-gray-800/30 rounded-xl">
          <TrophyIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Yakında</h3>
          <p className="text-gray-400">Global sıralamalar yakında aktif olacak!</p>
        </div>
      </div>
    </div>
  );
}

