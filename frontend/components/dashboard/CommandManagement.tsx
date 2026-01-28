'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CommandLineIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface Command {
  name: string;
  description: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  essential: boolean;
  enabled: boolean;
  permissions: string | null;
  usage: string;
  usageCount?: number;
}

interface CommandManagementProps {
  guildId: string;
}

export default function CommandManagement({ guildId }: CommandManagementProps) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [categories, setCategories] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCommands();
  }, [guildId]);

  const fetchCommands = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await axios.get(`${API_URL}/api/bot-commands/guild/${guildId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setCommands(response.data.commands);
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommand = async (commandName: string, currentlyEnabled: boolean) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await axios.post(
        `${API_URL}/api/bot-commands/guild/${guildId}/toggle`,
        { commandName },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update local state
        setCommands(prev => 
          prev.map(cmd => 
            cmd.name === `/${commandName}` 
              ? { ...cmd, enabled: !currentlyEnabled }
              : cmd
          )
        );
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Komut toggle başarısız');
    }
  };

  const filteredCommands = commands.filter(cmd => {
    const matchesSearch = 
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || cmd.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const stats = {
    total: commands.length,
    enabled: commands.filter(c => c.enabled).length,
    disabled: commands.filter(c => !c.enabled).length,
    essential: commands.filter(c => c.essential).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
            <CommandLineIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Komut Yönetimi</h2>
            <p className="text-sm text-gray-400">Bot komutlarını kontrol et</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam', value: stats.total, icon: CommandLineIcon, color: 'purple' },
          { label: 'Aktif', value: stats.enabled, icon: CheckCircleIcon, color: 'green' },
          { label: 'Devre Dışı', value: stats.disabled, icon: XCircleIcon, color: 'red' },
          { label: 'Zorunlu', value: stats.essential, icon: ShieldCheckIcon, color: 'blue' }
        ].map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <StatIcon className={`w-4 h-4 text-${stat.color}-400`} />
                <p className="text-xs font-medium text-gray-400">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Komut ara..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="">Tüm Kategoriler</option>
          {Object.entries(categories).map(([key, cat]: [string, any]) => (
            <option key={key} value={key}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Commands List */}
      <div className="space-y-6">
        {Object.entries(groupedCommands).map(([category, cmds]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{categories[category]?.icon || '📦'}</span>
              {categories[category]?.name || category}
              <span className="text-sm font-normal text-gray-400">({cmds.length})</span>
            </h3>

            <div className="grid gap-3">
              {cmds.map((command) => (
                <motion.div
                  key={command.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 bg-white/5 border rounded-xl transition-all ${
                    command.enabled
                      ? 'border-white/10 hover:border-purple-500/30'
                      : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-purple-400 font-bold">{command.name}</code>
                        {command.essential && (
                          <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400 font-semibold">
                            Zorunlu
                          </span>
                        )}
                        {command.permissions && (
                          <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-400 font-semibold">
                            Yönetici
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">{command.description}</p>
                      {command.usageCount !== undefined && command.usageCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {command.usageCount} kez kullanıldı
                        </p>
                      )}
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => !command.essential && toggleCommand(command.name.slice(1), command.enabled)}
                      disabled={command.essential}
                      className={`relative w-14 h-8 rounded-full transition-all ${
                        command.enabled
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gray-600'
                      } ${command.essential ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}`}
                    >
                      <motion.div
                        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                        animate={{ x: command.enabled ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {filteredCommands.length === 0 && (
          <div className="p-12 text-center">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Komut bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}

