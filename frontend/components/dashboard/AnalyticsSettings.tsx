'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsSettingsProps {
  guildId: string;
  userId: string;
}

interface AnalyticsConfig {
  enabled: boolean;
  trackMessages: boolean;
  trackJoins: boolean;
  trackLeaves: boolean;
  trackCommands: boolean;
  trackVoice: boolean;
  logChannel: string;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  reportChannel: string;
  analytics: {
    totalMessages: number;
    totalJoins: number;
    totalLeaves: number;
    totalCommands: number;
    totalVoiceTime: number;
    activeUsers: number;
    topChannels: Array<{
      id: string;
      name: string;
      messages: number;
    }>;
    topUsers: Array<{
      id: string;
      name: string;
      messages: number;
    }>;
  };
}

const defaultConfig: AnalyticsConfig = {
  enabled: false,
  trackMessages: true,
  trackJoins: true,
  trackLeaves: true,
  trackCommands: true,
  trackVoice: false,
  logChannel: '',
  dailyReports: false,
  weeklyReports: false,
  monthlyReports: false,
  reportChannel: '',
  analytics: {
    totalMessages: 0,
    totalJoins: 0,
    totalLeaves: 0,
    totalCommands: 0,
    totalVoiceTime: 0,
    activeUsers: 0,
    topChannels: [],
    topUsers: [],
  },
};

export default function AnalyticsSettings({ guildId, userId }: AnalyticsSettingsProps) {
  const [config, setConfig] = useState<AnalyticsConfig>(defaultConfig);
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
      
      // Önce bot'tan gerçek analitik verilerini al
      try {
        const botResponse = await fetch(`${API_URL}/api/bot/analytics/${guildId}`, {
          credentials: 'include',
        });
        
        if (botResponse.ok) {
          const botData = await botResponse.json();
          setConfig({
            ...defaultConfig,
            analytics: botData.analytics || defaultConfig.analytics,
            enabled: botData.enabled || false
          });
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }
      
      // Fallback: Backend API
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/analytics`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.settings || defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching analytics settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guilds/${guildId}/channels`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('✅ Analitik ayarları başarıyla kaydedildi!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving analytics settings:', error);
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

  const updateConfig = (key: keyof AnalyticsConfig, value: any) => {
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
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
          <ChartBarIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Analitik Sistemi</h2>
          <p className="text-gray-400 text-sm">Sunucu aktivitelerini takip edin ve analiz edin</p>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Cog6ToothIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Temel Ayarlar</h3>
            <p className="text-gray-400 text-sm">Analitik sistemi genel ayarları</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable Analytics */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Analitik Sistemini Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Sunucu aktivitelerini takip et</p>
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

          {/* Track Messages */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Mesaj Takibi</h4>
                <p className="text-gray-400 text-sm">Mesaj sayısını ve aktivitelerini takip et</p>
              </div>
              <button
                onClick={() => updateConfig('trackMessages', !config.trackMessages)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.trackMessages
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.trackMessages ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Track Joins */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Katılım Takibi</h4>
                <p className="text-gray-400 text-sm">Yeni üye katılımlarını takip et</p>
              </div>
              <button
                onClick={() => updateConfig('trackJoins', !config.trackJoins)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.trackJoins
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.trackJoins ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Track Leaves */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Ayrılma Takibi</h4>
                <p className="text-gray-400 text-sm">Üye ayrılmalarını takip et</p>
              </div>
              <button
                onClick={() => updateConfig('trackLeaves', !config.trackLeaves)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.trackLeaves
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.trackLeaves ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Track Commands */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Komut Takibi</h4>
                <p className="text-gray-400 text-sm">Bot komutlarının kullanımını takip et</p>
              </div>
              <button
                onClick={() => updateConfig('trackCommands', !config.trackCommands)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.trackCommands
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.trackCommands ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Track Voice */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Ses Takibi</h4>
                <p className="text-gray-400 text-sm">Ses kanalı aktivitelerini takip et</p>
              </div>
              <button
                onClick={() => updateConfig('trackVoice', !config.trackVoice)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.trackVoice
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.trackVoice ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reports Settings */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Rapor Ayarları</h3>
              <p className="text-gray-400 text-sm">Otomatik rapor gönderimi</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Daily Reports */}
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Günlük Raporlar</h4>
                <p className="text-gray-400 text-sm">Her gün aktivite raporu gönder</p>
              </div>
              <button
                onClick={() => updateConfig('dailyReports', !config.dailyReports)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.dailyReports
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.dailyReports ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>

            {/* Weekly Reports */}
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Haftalık Raporlar</h4>
                <p className="text-gray-400 text-sm">Her hafta aktivite raporu gönder</p>
              </div>
              <button
                onClick={() => updateConfig('weeklyReports', !config.weeklyReports)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.weeklyReports
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.weeklyReports ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>

            {/* Monthly Reports */}
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Aylık Raporlar</h4>
                <p className="text-gray-400 text-sm">Her ay aktivite raporu gönder</p>
              </div>
              <button
                onClick={() => updateConfig('monthlyReports', !config.monthlyReports)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.monthlyReports
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.monthlyReports ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>

            {/* Report Channel */}
            {(config.dailyReports || config.weeklyReports || config.monthlyReports) && (
              <div>
                <label className="block text-white font-semibold mb-2">Rapor Kanalı</label>
                <select
                  value={config.reportChannel}
                  onChange={(e) => updateConfig('reportChannel', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Kanal seçin...</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-xs mt-1">Raporların gönderileceği kanal</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Overview */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Analitik Özeti</h3>
              <p className="text-gray-400 text-sm">Sunucu aktivite istatistikleri</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Toplam Mesaj</h4>
                  <p className="text-2xl font-bold text-blue-400">{config.analytics.totalMessages.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Toplam Katılım</h4>
                  <p className="text-2xl font-bold text-green-400">{config.analytics.totalJoins.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Toplam Ayrılma</h4>
                  <p className="text-2xl font-bold text-red-400">{config.analytics.totalLeaves.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500">
                  <Cog6ToothIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Toplam Komut</h4>
                  <p className="text-2xl font-bold text-purple-400">{config.analytics.totalCommands.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Ses Süresi</h4>
                  <p className="text-2xl font-bold text-yellow-400">{Math.floor(config.analytics.totalVoiceTime / 3600)}h</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Aktif Kullanıcı</h4>
                  <p className="text-2xl font-bold text-pink-400">{config.analytics.activeUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
