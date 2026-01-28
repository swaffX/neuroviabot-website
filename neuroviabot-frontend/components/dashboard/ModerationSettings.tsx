'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface ModerationSettingsProps {
  guildId: string;
  userId: string;
}

interface ModerationConfig {
  autoModEnabled: boolean;
  spamProtection: boolean;
  badWordsFilter: boolean;
  logChannelId: string;
  warningsEnabled: boolean;
  maxWarnings: number;
  punishments: Array<{
    warnings: number;
    action: 'mute' | 'kick' | 'ban';
    duration?: number;
  }>;
}

const defaultConfig: ModerationConfig = {
  autoModEnabled: false,
  spamProtection: true,
  badWordsFilter: true,
  logChannelId: '',
  warningsEnabled: false,
  maxWarnings: 3,
  punishments: [
    { warnings: 1, action: 'mute', duration: 300 },
    { warnings: 2, action: 'mute', duration: 1800 },
    { warnings: 3, action: 'kick' },
  ],
};

export default function ModerationSettings({ guildId, userId }: ModerationSettingsProps) {
  const [config, setConfig] = useState<ModerationConfig>(defaultConfig);
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
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/moderation`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.settings || defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching moderation settings:', error);
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
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      showNotification('❌ Kanallar yüklenemedi. Bot sunucuda olmayabilir.', 'error');
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
            category: 'moderation',
            settings: config
          }),
        });
        
        if (botResponse.ok) {
          showNotification('✅ Moderasyon ayarları başarıyla kaydedildi!', 'success');
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }
      
      // Fallback: Backend API
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/moderation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('✅ Moderasyon ayarları başarıyla kaydedildi!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving moderation settings:', error);
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

  const updateConfig = (key: keyof ModerationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addPunishment = () => {
    const newPunishment = {
      warnings: 1,
      action: 'mute' as const,
      duration: 300,
    };
    setConfig(prev => ({
      ...prev,
      punishments: [...prev.punishments, newPunishment]
    }));
  };

  const removePunishment = (index: number) => {
    setConfig(prev => ({
      ...prev,
      punishments: prev.punishments.filter((_, i) => i !== index)
    }));
  };

  const updatePunishment = (index: number, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      punishments: prev.punishments.map((punishment, i) => 
        i === index ? { ...punishment, [key]: value } : punishment
      )
    }));
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
        <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500">
          <ShieldCheckIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Moderasyon Sistemi</h2>
          <p className="text-gray-400 text-sm">Sunucunuzu otomatik olarak koruyun ve yönetin</p>
        </div>
      </div>

      {/* Auto Moderation */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
                <div>
            <h3 className="text-white font-bold text-lg">Otomatik Moderasyon</h3>
            <p className="text-gray-400 text-sm">Spam, küfür ve zararlı içerikleri engelleyin</p>
                </div>
              </div>

        <div className="space-y-4">
          {/* Enable Auto Mod */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Otomatik Moderasyonu Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Zararlı içerikleri otomatik olarak engelle</p>
            </div>
            <button
              onClick={() => updateConfig('autoModEnabled', !config.autoModEnabled)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                config.autoModEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {config.autoModEnabled ? 'Aktif' : 'Devre Dışı'}
            </button>
          </div>

          {/* Spam Protection */}
          {config.autoModEnabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Spam Koruması</h4>
                <p className="text-gray-400 text-sm">Tekrarlayan mesajları engelle</p>
              </div>
              <button
                onClick={() => updateConfig('spamProtection', !config.spamProtection)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.spamProtection
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.spamProtection ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Bad Words Filter */}
          {config.autoModEnabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
                <h4 className="text-white font-semibold">Küfür Filtresi</h4>
                <p className="text-gray-400 text-sm">Küfürlü mesajları engelle</p>
              </div>
              <button
                onClick={() => updateConfig('badWordsFilter', !config.badWordsFilter)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.badWordsFilter
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.badWordsFilter ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Log Channel */}
          {config.autoModEnabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Moderasyon Log Kanalı</label>
              <select
                value={config.logChannelId}
                onChange={(e) => updateConfig('logChannelId', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
              >
                <option value="">Log kanalı seçin...</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
              <p className="text-gray-400 text-xs mt-1">Moderasyon işlemlerinin kaydedileceği kanal</p>
            </div>
          )}
        </div>
      </div>

      {/* Warning System */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500">
            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Uyarı Sistemi</h3>
            <p className="text-gray-400 text-sm">Üyelere uyarı verin ve otomatik ceza uygulayın</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable Warnings */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Uyarı Sistemini Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Üyelere uyarı ver ve otomatik ceza uygula</p>
            </div>
            <button
              onClick={() => updateConfig('warningsEnabled', !config.warningsEnabled)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                config.warningsEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {config.warningsEnabled ? 'Aktif' : 'Devre Dışı'}
            </button>
          </div>

          {/* Max Warnings */}
          {config.warningsEnabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Maksimum Uyarı Sayısı</label>
              <input
                type="number"
                value={config.maxWarnings}
                onChange={(e) => updateConfig('maxWarnings', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                min="1"
                max="10"
              />
              <p className="text-gray-400 text-xs mt-1">Bu sayıya ulaşıldığında otomatik ceza uygulanır</p>
            </div>
          )}
        </div>
      </div>

      {/* Punishments */}
      {config.warningsEnabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500">
                <NoSymbolIcon className="w-5 h-5 text-white" />
        </div>
        <div>
                <h3 className="text-white font-bold text-lg">Ceza Sistemi</h3>
                <p className="text-gray-400 text-sm">Belirli uyarı sayısında otomatik ceza uygula</p>
              </div>
            </div>
              <button
                onClick={addPunishment}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all flex items-center gap-2"
              >
                <NoSymbolIcon className="w-4 h-4" />
                Ceza Ekle
              </button>
          </div>

          <div className="space-y-4">
            {config.punishments.map((punishment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Ceza #{index + 1}</h4>
                  <button
                    onClick={() => removePunishment(index)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-all"
                  >
                    Kaldır
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Uyarı Sayısı</label>
                    <input
                      type="number"
                      value={punishment.warnings}
                      onChange={(e) => updatePunishment(index, 'warnings', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                      min="1"
                      max="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-semibold mb-2">Ceza Türü</label>
                    <select
                      value={punishment.action}
                      onChange={(e) => updatePunishment(index, 'action', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="mute">Sustur</option>
                      <option value="kick">At</option>
                      <option value="ban">Yasakla</option>
                    </select>
                  </div>

                  {punishment.action === 'mute' && (
                    <div>
                      <label className="block text-white font-semibold mb-2">Süre (saniye)</label>
                      <input
                        type="number"
                        value={punishment.duration || 300}
                        onChange={(e) => updatePunishment(index, 'duration', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                        min="60"
                        max="86400"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {config.punishments.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <NoSymbolIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Henüz ceza kuralı eklenmemiş</p>
                <p className="text-sm">Yukarıdaki "Ceza Ekle" butonuna tıklayarak başlayın</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          className={`p-4 rounded-lg border ${
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