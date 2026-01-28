'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  CurrencyDollarIcon,
  CubeIcon,
  TrophyIcon,
  GiftIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

interface GamesSettingsProps {
  guildId: string;
  userId: string;
}

interface GameCommand {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  category: 'casino' | 'economy';
}

const gameCommands: GameCommand[] = [
  {
    name: 'blackjack',
    description: 'Blackjack oyunu oyna',
    icon: CurrencyDollarIcon,
    color: 'from-green-500 to-emerald-500',
    category: 'casino'
  },
  {
    name: 'slots',
    description: 'Slot makinesi oyna',
    icon: SparklesIcon,
    color: 'from-purple-500 to-pink-500',
    category: 'casino'
  },
  {
    name: 'dice',
    description: 'Zar atma oyunu',
    icon: CubeIcon,
    color: 'from-blue-500 to-cyan-500',
    category: 'casino'
  },
  {
    name: 'coinflip',
    description: 'Yazı tura oyunu',
    icon: CurrencyDollarIcon,
    color: 'from-yellow-500 to-amber-500',
    category: 'casino'
  },
  {
    name: 'shop',
    description: 'Mağazayı görüntüle',
    icon: ShoppingBagIcon,
    color: 'from-indigo-500 to-purple-500',
    category: 'economy'
  },
  {
    name: 'buy',
    description: 'Ürün satın al',
    icon: GiftIcon,
    color: 'from-emerald-500 to-teal-500',
    category: 'economy'
  },
  {
    name: 'inventory',
    description: 'Envanterini görüntüle',
    icon: TrophyIcon,
    color: 'from-orange-500 to-red-500',
    category: 'economy'
  },
];

export default function GamesSettings({ guildId, userId }: GamesSettingsProps) {
  const [selectedCategory, setSelectedCategory] = useState<'casino' | 'economy'>('casino');
  const [balance, setBalance] = useState(1000);
  const [inventory, setInventory] = useState<any[]>([]);

  const categories = [
    { id: 'casino', name: 'Kumar Oyunları', icon: CubeIcon },
    { id: 'economy', name: 'Ekonomi', icon: CurrencyDollarIcon },
  ];

  const filteredCommands = gameCommands.filter(cmd => cmd.category === selectedCategory);

  const executeCommand = async (commandName: string, params: any = {}) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/bot-commands/execute/${commandName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guildId,
          userId,
          ...params
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update state based on command
        if (commandName === 'buy') {
          setBalance(prev => prev - (params.price || 0));
        } else if (commandName === 'shop') {
          // Refresh shop data
        }
      }

      return result;
    } catch (error) {
      console.error(`Error executing ${commandName}:`, error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
          <SparklesIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Oyunlar</h2>
          <p className="text-gray-400 text-sm">Eğlenceli oyunlar ve kumar sistemi</p>
        </div>
      </div>

      {/* Balance Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Bakiye</h3>
              <p className="text-gray-400 text-sm">Mevcut paranız</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">{balance.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">💰 Para</p>
          </div>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex gap-2 p-1 bg-gray-800/50 rounded-lg">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCommands.map((command, index) => {
          const Icon = command.icon;
          return (
            <motion.div
              key={command.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${command.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">/{command.name}</h3>
                  <p className="text-gray-400 text-xs mt-1">{command.description}</p>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => executeCommand(command.name)}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Oyna
                </button>
                <button
                  onClick={() => executeCommand(command.name, { help: true })}
                  className="px-3 py-2 bg-white/10 text-gray-400 text-xs rounded-lg hover:bg-white/20 hover:text-white transition-all"
                >
                  ?
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Hızlı İşlemler</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => executeCommand('shop')}
            className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
          >
            🛒 Mağazayı Aç
          </button>
          <button
            onClick={() => executeCommand('inventory')}
            className="p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
          >
            🎒 Envanter
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Son Aktiviteler</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Blackjack kazandınız!</p>
              <p className="text-gray-400 text-xs">+500 para</p>
            </div>
            <span className="text-gray-400 text-xs">2 dk önce</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Slot oynadınız</p>
              <p className="text-gray-400 text-xs">-100 para</p>
            </div>
            <span className="text-gray-400 text-xs">5 dk önce</span>
          </div>
        </div>
      </div>
    </div>
  );
}
