'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  LanguageIcon,
  CommandLineIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface FeatureManagerProps {
  guildId: string;
  userId: string;
}

interface Feature {
  name: string;
  enabled: boolean;
  description: string;
}

const featureDescriptions = {
  tickets: 'Ticket sistemi - Kullanıcılar destek talebi oluşturabilir',
  economy: 'Ekonomi sistemi - Para, mağaza ve ekonomi komutları',
  moderation: 'Moderasyon sistemi - Ban, kick, mute gibi moderasyon komutları',
  leveling: 'Seviye sistemi - XP kazanma ve seviye ödülleri',
  giveaways: 'Çekiliş sistemi - Çekiliş oluşturma ve yönetimi',
  music: 'Müzik sistemi - YouTube ve Spotify müzik çalma',
  games: 'Oyun sistemi - Kumar ve ekonomi oyunları',
  security: 'Güvenlik sistemi - Anti-raid ve koruma özellikleri'
};

const featureNames = {
  tickets: '🎫 Ticket Sistemi',
  economy: '💰 Ekonomi Sistemi',
  moderation: '🛡️ Moderasyon Sistemi',
  leveling: '📊 Seviye Sistemi',
  giveaways: '🎁 Çekiliş Sistemi',
  music: '🎵 Müzik Sistemi',
  games: '🎮 Oyun Sistemi',
  security: '🔒 Güvenlik Sistemi'
};


export default function FeatureManager({ guildId, userId }: FeatureManagerProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([]);
  const [activeTab, setActiveTab] = useState<'features'>('features');

  useEffect(() => {
    fetchFeatures();
  }, [guildId]);

  const fetchFeatures = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      
      // Önce bot API'den direkt özellik durumunu al
      try {
        const botResponse = await fetch(`${API_URL}/api/bot/features`, {
          credentials: 'include'
        });
        
        if (botResponse.ok) {
          const botData = await botResponse.json();
          const featureList = Object.entries(botData.features).map(([name, enabled]) => ({
            name,
            enabled: enabled as boolean,
            description: featureDescriptions[name as keyof typeof featureDescriptions] || 'Açıklama yok'
          }));
          setFeatures(featureList);
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }
      
      // Fallback: Backend API
      const response = await fetch(`${API_URL}/api/bot-commands/status/${guildId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const featureList = Object.entries(data.data.features).map(([name, enabled]) => ({
          name,
          enabled: enabled as boolean,
          description: featureDescriptions[name as keyof typeof featureDescriptions] || 'Açıklama yok'
        }));
        setFeatures(featureList);
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureName: string, currentEnabled: boolean) => {
    setToggling(featureName);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/bot-commands/execute/özellikler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guildId,
          userId,
          subcommand: currentEnabled ? 'kapat' : 'aç',
          params: {
            özellik: featureName
          }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Feature toggled:', data);
        
        // Success notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          message: `✅ ${featureNames[featureName as keyof typeof featureNames]} ${currentEnabled ? 'devre dışı bırakıldı' : 'aktifleştirildi'}`,
          type: 'success'
        }]);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
        
        // Refresh features
        await fetchFeatures();
      } else {
        const error = await response.json();
        console.error('Feature toggle error:', error);
        
        // Error notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          message: `❌ ${featureNames[featureName as keyof typeof featureNames]} değiştirilemedi: ${error.error}`,
          type: 'error'
        }]);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
      }
    } catch (error) {
      console.error('Feature toggle error:', error);
      
      // Error notification
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `❌ ${featureNames[featureName as keyof typeof featureNames]} değiştirilemedi`,
        type: 'error'
      }]);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 5000);
    } finally {
      setToggling(null);
    }
  };

  const toggleAllFeatures = async (enable: boolean) => {
    setToggling('all');
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/bot-commands/execute/özellikler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guildId,
          userId,
          subcommand: enable ? 'tümünü-aç' : 'tümünü-kapat',
          params: {}
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('All features toggled:', data);
        
        // Success notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          message: `✅ Tüm özellikler ${enable ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`,
          type: 'success'
        }]);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
        
        // Refresh features
        await fetchFeatures();
      } else {
        const error = await response.json();
        console.error('All features toggle error:', error);
        
        // Error notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          message: `❌ Tüm özellikler değiştirilemedi: ${error.error}`,
          type: 'error'
        }]);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
      }
    } catch (error) {
      console.error('All features toggle error:', error);
      
      // Error notification
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `❌ Tüm özellikler değiştirilemedi`,
        type: 'error'
      }]);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 5000);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Özellikler yükleniyor...</span>
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
          <h2 className="text-2xl font-bold text-white">Özellik Yönetimi</h2>
          <p className="text-gray-400 mt-1">Bot özelliklerini, dil ve komut ayarlarını yönetin</p>
        </div>
        
        {/* Bulk Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleAllFeatures(true)}
            disabled={toggling === 'all'}
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {toggling === 'all' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <CheckCircleIcon className="w-4 h-4" />
            )}
            Tümünü Aç
          </button>
          
          <button
            onClick={() => toggleAllFeatures(false)}
            disabled={toggling === 'all'}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {toggling === 'all' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <XCircleIcon className="w-4 h-4" />
            )}
            Tümünü Kapat
          </button>
          
          <button
            onClick={fetchFeatures}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Yenile
          </button>
        </div>
      </div>


      {/* Features List */}
      <div className="space-y-4">
        {features.map((feature) => {
          const isToggling = toggling === feature.name;
          
          return (
            <motion.div
              key={feature.name}
              layout
              className="bg-[#2c2f38] rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${feature.enabled ? 'bg-green-600' : 'bg-gray-600'}`}>
                      <Cog6ToothIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {featureNames[feature.name as keyof typeof featureNames] || feature.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${feature.enabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <span className={`text-xs font-semibold ${feature.enabled ? 'text-green-400' : 'text-gray-400'}`}>
                          {feature.enabled ? 'Aktif' : 'Devre Dışı'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleFeature(feature.name, feature.enabled)}
                    disabled={isToggling}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                      feature.enabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isToggling ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : feature.enabled ? (
                      <>
                        <XCircleIcon className="w-4 h-4" />
                        Devre Dışı Bırak
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        Aktifleştir
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
