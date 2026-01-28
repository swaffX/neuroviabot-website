'use client';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TicketIcon,
  GiftIcon,
  Cog6ToothIcon,
  SparklesIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Command {
  name: string;
  description: string;
  usage: string;
  permissions?: string;
  premium?: boolean;
  usageCount?: number;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactElement;
  color: string;
  commands: Command[];
}

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/50', text: 'text-green-400', glow: 'from-green-500/10' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', glow: 'from-red-500/10' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'from-yellow-500/10' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'from-blue-500/10' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'from-purple-500/10' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/50', text: 'text-pink-400', glow: 'from-pink-500/10' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/50', text: 'text-gray-400', glow: 'from-gray-500/10' },
  gold: { bg: 'bg-amber-500/10', border: 'border-amber-500/50', text: 'text-amber-400', glow: 'from-amber-500/10' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/50', text: 'text-indigo-400', glow: 'from-indigo-500/10' }
};

export default function CommandsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(text);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredCategories = useMemo(() => 
    categories.map(category => ({
      ...category,
      commands: category.commands.filter(cmd =>
        cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.commands.length > 0),
    [categories, searchQuery]
  );

  useEffect(() => {
    fetchCommands();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with /
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Skip if typing in input
      if (document.activeElement?.tagName === 'INPUT') return;

      if (!selectedCategory) return;

      const currentCategory = filteredCategories.find(c => c.id === selectedCategory);
      if (!currentCategory) return;

      const commandCount = currentCategory.commands.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedCommandIndex(prev => (prev + 1) % commandCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedCommandIndex(prev => (prev - 1 + commandCount) % commandCount);
          break;
        case 'Enter':
          e.preventDefault();
          const selectedCommand = currentCategory.commands[selectedCommandIndex];
          if (selectedCommand) {
            copyToClipboard(selectedCommand.usage);
          }
          break;
        case 'Escape':
          setSelectedCategory(null);
          setSelectedCommandIndex(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCategory, filteredCategories, selectedCommandIndex, copyToClipboard]);

  // Reset selected command index when category changes
  useEffect(() => {
    setSelectedCommandIndex(0);
  }, [selectedCategory]);

  async function fetchCommands() {
    try {
      const response = await axios.get('/api/bot-commands/commands/list');
      if (response.data.success) {
        // Category metadata mapping
        const categoryMap: Record<string, any> = {
          moderation: {
            name: 'Moderasyon', 
            icon: <ShieldCheckIcon className="w-6 h-6" />, 
            color: 'red' 
          },
          games: { 
            name: '🎮 Oyunlar', 
            icon: <SparklesIcon className="w-6 h-6" />, 
            color: 'pink' 
          },
          leveling: { 
            name: 'Seviye Sistemi', 
            icon: <ChartBarIcon className="w-6 h-6" />, 
            color: 'blue' 
          },
          utility: { 
            name: 'Genel Komutlar', 
            icon: <CommandLineIcon className="w-6 h-6" />, 
            color: 'indigo' 
          },
          setup: { 
            name: 'Yönetim Komutları', 
            icon: <Cog6ToothIcon className="w-6 h-6" />, 
            color: 'gray' 
          },
          roles: { 
            name: 'Rol Sistemleri', 
            icon: <ShieldCheckIcon className="w-6 h-6" />, 
            color: 'purple' 
          },
          quests: { 
            name: '🗺️ Görevler & Başarılar', 
            icon: <SparklesIcon className="w-6 h-6" />, 
            color: 'blue' 
          },
          tickets: { 
            name: 'Ticket Sistemi', 
            icon: <TicketIcon className="w-6 h-6" />, 
            color: 'purple' 
          },
          giveaway: { 
            name: 'Çekiliş Sistemi', 
            icon: <GiftIcon className="w-6 h-6" />, 
            color: 'pink' 
          },
          premium: { 
            name: 'Premium', 
            icon: <SparklesIcon className="w-6 h-6" />, 
            color: 'gold' 
          },
          general: { 
            name: 'Genel', 
            icon: <CommandLineIcon className="w-6 h-6" />, 
            color: 'indigo' 
          }
        };

        const transformedCategories = Object.entries(response.data.grouped).map(([key, commands]: [string, any]) => ({
          id: key,
          ...(categoryMap[key] || { 
            name: key.charAt(0).toUpperCase() + key.slice(1), 
            icon: <CommandLineIcon className="w-6 h-6" />, 
            color: 'gray' 
          }),
          commands: commands.map((cmd: any) => ({
            name: `/${cmd.name}`,
            description: cmd.description,
            usage: `/${cmd.name}${cmd.options > 0 ? ' <seçenekler>' : ''}`,
            permissions: cmd.permissions ? 'Yönetici' : undefined,
            usageCount: cmd.usageCount
          }))
        }));

        setCategories(transformedCategories);
      }
    } catch (error) {
      console.error('Failed to fetch commands:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalCommands = categories.reduce((acc, cat) => acc + cat.commands.length, 0);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#0a0b0f] via-[#13151f] to-[#1a1c2e] text-white overflow-hidden">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0b0f] via-[#13151f] to-[#1a1c2e] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 py-20 pt-32">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
            Ana Sayfaya Dön
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-6"
          >
            <CommandLineIcon className="w-12 h-12 text-purple-400" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Bot Komutları
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Neurovia'un sunduğu <span className="text-purple-400 font-bold">{totalCommands}+ komut</span> ile Discord sunucunuzu bir üst seviyeye taşıyın.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Komut ara... (örn: economy, ban, slot) - / tuşuna basarak ara"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
            </div>
            <p className="text-center text-gray-500 text-sm mt-2">
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs">/</kbd> Arama,{' '}
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs">↑</kbd>
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs">↓</kbd> Gezinme,{' '}
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs">Enter</kbd> Kopyala
            </p>
          </div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {filteredCategories.map((category, index) => {
            const colors = colorMap[category.color] || colorMap.purple;
            return (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ y: -5 }}
                className={`relative p-6 rounded-2xl border transition-all text-left ${
                  selectedCategory === category.id
                    ? `${colors.bg} ${colors.border}`
                    : 'bg-white/5 border-white/10 hover:border-purple-500/30'
                }`}
              >
                {/* Glow Effect */}
                <div className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${colors.glow} to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative flex items-center gap-4">
                  <div className={`flex-shrink-0 p-3 rounded-xl ${colors.bg} ${colors.text}`}>
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-400">
                      {category.commands.length} komut
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: selectedCategory === category.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Command Details */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {filteredCategories
                .filter(cat => cat.id === selectedCategory)
                .map(category => {
                  const colors = colorMap[category.color] || colorMap.purple;
                  return (
                    <div key={category.id} className="space-y-4">
                      {category.commands.map((command, index) => (
                        <motion.div
                          key={command.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 * index }}
                          className={`group relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border transition-all ${
                            selectedCommandIndex === index
                              ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                              : 'border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <code className={`text-lg font-bold ${colors.text}`}>
                                  {command.name}
                                </code>
                                {command.premium && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 rounded text-xs text-amber-400 font-semibold">
                                    <SparklesIcon className="w-3 h-3" />
                                    Premium
                                  </span>
                                )}
                                {command.usageCount !== undefined && command.usageCount > 0 && (
                                  <span className="text-xs text-gray-500">
                                    ({command.usageCount} kullanım)
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-300 mb-3">{command.description}</p>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="text-sm text-gray-500 font-semibold min-w-[80px]">Kullanım:</span>
                                  <div className="flex items-center gap-2 flex-1">
                                    <code className="text-sm text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                                      {command.usage}
                                    </code>
                                    <button
                                      onClick={() => copyToClipboard(command.usage)}
                                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Copy command"
                                    >
                                      {copiedCommand === command.usage ? (
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                {command.permissions && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm text-gray-500 font-semibold min-w-[80px]">Yetki:</span>
                                    <span className="text-sm text-gray-400">
                                      {command.permissions}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        {searchQuery && filteredCategories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">Komut Bulunamadı</h3>
            <p className="text-gray-500">
              "{searchQuery}" araması için sonuç bulunamadı.
            </p>
          </motion.div>
        )}

        {/* CTA Section */}
        {!selectedCategory && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-20"
          >
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Botu Sunucuna Ekle
                </h2>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  Tüm bu güçlü komutları Discord sunucunda kullanmaya başla!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=773539215098249246&scope=bot%20applications.commands&permissions=8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group px-8 py-4 text-base font-bold overflow-hidden rounded-xl transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                    <span className="relative">Botu Sunucuna Ekle</span>
                  </a>
                  <Link
                    href="/ozellikler"
                    className="px-8 py-4 text-base font-bold border border-white/20 rounded-xl hover:bg-white/5 transition-all"
                  >
                    Özellikleri Keşfet
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
