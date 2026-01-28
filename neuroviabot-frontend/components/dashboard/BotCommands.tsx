'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CommandLineIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface Command {
  name: string;
  description: string;
  category: string;
  subcommands: Array<{
    name: string;
    description: string;
  }>;
}

interface CommandHistory {
  id: number;
  command: string;
  subcommand: string;
  user: string;
  userId: string;
  timestamp: number;
  success: boolean;
  result: string;
}

interface BotCommandsProps {
  guildId: string;
  userId: string;
}

const categoryColors = {
  admin: 'from-red-500 to-pink-500',
  moderation: 'from-orange-500 to-red-500',
  economy: 'from-green-500 to-emerald-500',
  leveling: 'from-blue-500 to-cyan-500',
  giveaway: 'from-purple-500 to-violet-500',
  welcome: 'from-yellow-500 to-amber-500',
  roles: 'from-indigo-500 to-purple-500',
  info: 'from-gray-500 to-slate-500',
  music: 'from-green-500 to-emerald-500',
  games: 'from-purple-500 to-pink-500',
  backup: 'from-blue-500 to-indigo-500',
  security: 'from-red-500 to-orange-500',
  analytics: 'from-indigo-500 to-purple-500',
  custom: 'from-cyan-500 to-blue-500',
  premium: 'from-yellow-500 to-amber-500',
};

const categoryIcons = {
  admin: Cog6ToothIcon,
  moderation: ExclamationTriangleIcon,
  economy: CommandLineIcon,
  leveling: ClockIcon,
  giveaway: CommandLineIcon,
  welcome: InformationCircleIcon,
  roles: CommandLineIcon,
  info: InformationCircleIcon,
  music: PlayIcon,
  games: CommandLineIcon,
  backup: Cog6ToothIcon,
  security: ExclamationTriangleIcon,
  analytics: ClockIcon,
  custom: CommandLineIcon,
  premium: CommandLineIcon,
};

export default function BotCommands({ guildId, userId }: BotCommandsProps) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [commandParams, setCommandParams] = useState<{ [key: string]: any }>({});
  const [showParams, setShowParams] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([]);

  useEffect(() => {
    fetchCommands();
    fetchHistory();
  }, [guildId]);

  const fetchCommands = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/bot-commands/commands/${guildId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommands(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/bot-commands/history/${guildId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data.commands);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const executeCommand = async (command: string, subcommand?: string) => {
    const commandKey = subcommand ? `${command}_${subcommand}` : command;
    setExecuting(commandKey);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      
      // Parametreleri hazırla
      let params = commandParams[commandKey] || {};
      
      // Özellikler komutu için özellik parametresini ekle
      if (command === 'özellikler' && subcommand) {
        if (!params.özellik) {
          // Subcommand'a göre varsayılan özellik belirle
          params = {
            ...params,
            özellik: 'leveling' // Varsayılan özellik
          };
        }
      }
      
      const response = await fetch(`${API_URL}/api/bot-commands/execute/${command}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guildId,
          userId,
          subcommand,
          params
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Command executed:', data);
        
        // Success notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          message: `✅ ${command}${subcommand ? ` ${subcommand}` : ''} komutu başarıyla çalıştırıldı`,
          type: 'success'
        }]);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
        
        await fetchHistory();
      } else {
        const error = await response.json();
        console.error('Command execution error:', error);
        
        // Error notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          message: `❌ ${command}${subcommand ? ` ${subcommand}` : ''} komutu hatası: ${error.error}`,
          type: 'error'
        }]);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
      }
    } catch (error) {
      console.error('Command execution error:', error);
      
      // Error notification
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `❌ ${command}${subcommand ? ` ${subcommand}` : ''} komutu hatası: ${errorMessage}`,
        type: 'error'
      }]);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 5000);
    } finally {
      setExecuting(null);
    }
  };

  const updateCommandParams = (commandKey: string, key: string, value: any) => {
    setCommandParams(prev => ({
      ...prev,
      [commandKey]: {
        ...prev[commandKey],
        [key]: value
      }
    }));
  };

  const filteredCommands = selectedCategory === 'all' 
    ? commands 
    : commands.filter(cmd => cmd.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(commands.map(cmd => cmd.category)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Komutlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`p-4 rounded-lg border ${
              notification.type === 'success'
                ? 'bg-green-900/20 border-green-500/30 text-green-300'
                : 'bg-red-900/20 border-red-500/30 text-red-300'
            }`}
          >
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Bot Komutları</h2>
          <p className="text-gray-400 mt-1">Bot komutlarını web arayüzünden yönetin</p>
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category === 'all' ? 'Tümü' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Commands List */}
      <div className="space-y-4">
        {filteredCommands.map((command) => {
          const Icon = categoryIcons[command.category as keyof typeof categoryIcons] || CommandLineIcon;
          const isExpanded = expandedCommand === command.name;
          const hasSubcommands = command.subcommands.length > 0;
          
          return (
            <motion.div
              key={command.name}
              layout
              className="bg-[#2c2f38] rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Command Header */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${categoryColors[command.category as keyof typeof categoryColors] || 'from-gray-500 to-slate-500'}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{command.name}</h3>
                      <p className="text-gray-400 text-sm">{command.description}</p>
                      <span className="inline-block mt-1 px-2 py-1 rounded text-xs font-semibold bg-gray-700 text-gray-300">
                        {command.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Expand Button */}
                    {hasSubcommands && (
                      <button
                        onClick={() => setExpandedCommand(isExpanded ? null : command.name)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    )}

                    {/* Execute Button */}
                    <button
                      onClick={() => executeCommand(command.name)}
                      disabled={executing === command.name}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {executing === command.name ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                      Çalıştır
                    </button>
                  </div>
                </div>
              </div>

              {/* Subcommands */}
              <AnimatePresence>
                {isExpanded && hasSubcommands && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/10 bg-[#23272f]"
                  >
                    <div className="p-6 space-y-3">
                      {command.subcommands.map((subcommand) => {
                        const subcommandKey = `${command.name}_${subcommand.name}`;
                        const isExecuting = executing === subcommandKey;
                        
                        return (
                          <div key={subcommand.name} className="flex items-center justify-between p-4 bg-[#2c2f38] rounded-lg">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold">{subcommand.name}</h4>
                              <p className="text-gray-400 text-sm">{subcommand.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Parameters Button */}
                              <button
                                onClick={() => setShowParams(showParams === subcommandKey ? null : subcommandKey)}
                                className="px-3 py-1.5 rounded-lg bg-gray-600 text-gray-300 hover:bg-gray-500 transition-colors text-sm"
                              >
                                Parametreler
                              </button>
                              
                              {/* Execute Subcommand Button */}
                              <button
                                onClick={() => executeCommand(command.name, subcommand.name)}
                                disabled={isExecuting}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isExecuting ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <PlayIcon className="w-4 h-4" />
                                )}
                                Çalıştır
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Command History */}
      <div className="bg-[#2c2f38] rounded-xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-lg mb-4">Komut Geçmişi</h3>
        
        {history.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Henüz komut çalıştırılmamış</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-[#23272f] rounded-lg">
                <div className="flex items-center gap-4">
                  {item.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-white font-semibold">
                      {item.command}{item.subcommand ? ` ${item.subcommand}` : ''}
                    </p>
                    <p className="text-gray-400 text-sm">{item.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">
                    {new Date(item.timestamp).toLocaleString('tr-TR')}
                  </p>
                  {item.result && (
                    <p className="text-gray-300 text-xs mt-1">{item.result}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
