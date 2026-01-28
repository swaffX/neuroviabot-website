'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface WelcomeSettingsProps {
  guildId: string;
  userId: string;
}

interface WelcomeConfig {
  enabled: boolean;
  channelId: string;
  message: string;
  embed: boolean;
  imageUrl: string;
  leaveEnabled: boolean;
  leaveChannelId: string;
  leaveMessage: string;
}

const defaultConfig: WelcomeConfig = {
  enabled: false,
  channelId: '',
  message: 'Hoş geldin {user}! Sunucumuza katıldığın için teşekkürler!',
  embed: true,
  imageUrl: '',
  leaveEnabled: false,
  leaveChannelId: '',
  leaveMessage: '{user} sunucumuzdan ayrıldı. Görüşmek üzere!',
};

export default function WelcomeSettings({ guildId, userId }: WelcomeSettingsProps) {
  const [config, setConfig] = useState<WelcomeConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([]);

  useEffect(() => {
    fetchSettings();
    fetchChannels();
  }, [guildId]);

  const fetchSettings = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/welcome`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.settings || defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching welcome settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/channels`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only text channels for welcome messages
        const textChannels = (data.channels || []).filter((channel: any) => channel.type === 'text' || channel.type === 0);
        setChannels(textChannels);
      } else {
        // No channels available
        setChannels([]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      // Show error message to user
      showNotification('❌ Kanallar yüklenemedi. Bot sunucuda olmayabilir.', 'error');
      setChannels([]);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      
      // Önce bot'a ayarları gönder
      try {
        const botResponse = await fetch(`${API_URL}/api/bot/settings/${guildId}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            category: 'welcome',
            settings: config
          }),
        });
        
        if (botResponse.ok) {
          showNotification('✅ Karşılama ayarları başarıyla kaydedildi!', 'success');
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }
      
      // Fallback: Backend API
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('✅ Karşılama ayarları başarıyla kaydedildi!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving welcome settings:', error);
      showNotification('❌ Ayarlar kaydedilemedi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const updateConfig = (key: keyof WelcomeConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Ayarlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
          <UserPlusIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Karşılama Sistemi</h2>
          <p className="text-gray-400 text-sm">Yeni üyeleri karşılayın ve ayrılanları uğurlayın</p>
        </div>
      </div>

      {/* Welcome Settings */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
            <UserPlusIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Karşılama Mesajları</h3>
            <p className="text-gray-400 text-sm">Yeni üyeler için özel mesajlar</p>
          </div>
        </div>

        <div className="space-y-4">
        {/* Enable Welcome */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Karşılama Mesajlarını Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Yeni üyeler geldiğinde mesaj gönder</p>
            </div>
            <button
              onClick={() => updateConfig('enabled', !config.enabled)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                config.enabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {config.enabled ? 'Aktif' : 'Devre Dışı'}
            </button>
          </div>

          {/* Channel Selection */}
          {config.enabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Kanal Seçin</label>
              <select
                value={config.channelId}
                onChange={(e) => updateConfig('channelId', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                <option value="">Kanal seçin...</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
          )}

            {/* Welcome Message */}
          {config.enabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Karşılama Mesajı</label>
              <textarea
                value={config.message}
                onChange={(e) => updateConfig('message', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                rows={3}
                placeholder="Hoş geldin {user}! Sunucumuza katıldığın için teşekkürler!"
              />
              <p className="text-gray-400 text-xs mt-1">
                Kullanılabilir değişkenler: {'{user}'}, {'{server}'}, {'{memberCount}'}
              </p>
            </div>
          )}

          {/* Embed Toggle */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Embed Mesaj Kullan</h4>
                <p className="text-gray-400 text-sm">Mesajı güzel bir embed olarak gönder</p>
              </div>
              <button
                onClick={() => updateConfig('embed', !config.embed)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.embed
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.embed ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}
        </div>
            </div>

      {/* Leave Settings */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
            <UserMinusIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
            <h3 className="text-white font-bold text-lg">Veda Mesajları</h3>
            <p className="text-gray-400 text-sm">Ayrılan üyeler için mesajlar</p>
                  </div>
                </div>

        <div className="space-y-4">
          {/* Enable Leave */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Veda Mesajlarını Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Üyeler ayrıldığında mesaj gönder</p>
            </div>
            <button
              onClick={() => updateConfig('leaveEnabled', !config.leaveEnabled)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                config.leaveEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {config.leaveEnabled ? 'Aktif' : 'Devre Dışı'}
            </button>
            </div>

          {/* Leave Channel Selection */}
          {config.leaveEnabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Kanal Seçin</label>
              <select
                value={config.leaveChannelId}
                onChange={(e) => updateConfig('leaveChannelId', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
              >
                <option value="">Kanal seçin...</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Leave Message */}
          {config.leaveEnabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Veda Mesajı</label>
              <textarea
                value={config.leaveMessage}
                onChange={(e) => updateConfig('leaveMessage', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                rows={3}
                placeholder="{user} sunucumuzdan ayrıldı. Görüşmek üzere!"
              />
              <p className="text-gray-400 text-xs mt-1">
                Kullanılabilir değişkenler: {'{user}'}, {'{server}'}, {'{memberCount}'}
              </p>
            </div>
        )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Kaydediliyor...
            </>
          ) : (
            <>
              <Cog6ToothIcon className="w-4 h-4" />
              Ayarları Kaydet
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {notifications.map((notification) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 p-4 rounded-lg border z-50 ${
            notification.type === 'success'
              ? 'bg-green-900/20 border-green-500/30 text-green-300'
              : 'bg-red-900/20 border-red-500/30 text-red-300'
          }`}
        >
          {notification.message}
        </motion.div>
      ))}
    </div>
  );
}