'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '@/contexts/SocketContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGuildFeatures } from '@/hooks/useGuildFeatures';
import LoadingSkeleton from '../LoadingSkeleton';

interface ServerStatsSettingsProps {
  guildId: string;
  userId: string;
}

interface StatsSettings {
  enabled: boolean;
  categoryId: string | null;
  channelIds: {
    members: string | null;
    bots: string | null;
    total: string | null;
  };
  channelNames: {
    members: string;
    bots: string;
    total: string;
  };
  autoUpdate: boolean;
  updateInterval: number;
}

interface CurrentStats {
  members: number;
  bots: number;
  total: number;
}

export default function ServerStatsSettings({ guildId, userId }: ServerStatsSettingsProps) {
  const [settings, setSettings] = useState<StatsSettings | null>(null);
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { socket, on, off } = useSocket();
  const { showNotification } = useNotification();
  
  // Feature Detection - Automatically detect if server stats is enabled
  const { features, isFeatureEnabled } = useGuildFeatures(guildId);

  useEffect(() => {
    fetchSettings();
    fetchCurrentStats();
  }, [guildId]);

  useEffect(() => {
    if (!socket) return;

    const handleStatsUpdated = (data: any) => {
      if (data.guildId === guildId) {
        showNotification('📊 Server stats güncellendi!', 'success');
        setCurrentStats(data.stats);
      }
    };

    const handleSettingsUpdated = (data: any) => {
      if (data.guildId === guildId) {
        showNotification('⚙️ Ayarlar güncellendi!', 'success');
        fetchSettings();
      }
    };

    const handleStatsToggled = (data: any) => {
      if (data.guildId === guildId) {
        showNotification(
          data.enabled ? '✅ Server stats etkinleştirildi!' : '❌ Server stats devre dışı bırakıldı!',
          data.enabled ? 'success' : 'info'
        );
        fetchSettings();
      }
    };

    const handleStatsDeleted = (data: any) => {
      if (data.guildId === guildId) {
        showNotification('🗑️ Server stats kanalları silindi!', 'success');
        fetchSettings();
        setCurrentStats(null);
      }
    };

    // Join guild room
    socket.emit('join_guild', guildId);

    // Listen to events
    on('server_stats_updated', handleStatsUpdated);
    on('server_stats_settings_updated', handleSettingsUpdated);
    on('server_stats_toggled', handleStatsToggled);
    on('server_stats_deleted', handleStatsDeleted);

    return () => {
      socket.emit('leave_guild', guildId);
      off('server_stats_updated', handleStatsUpdated);
      off('server_stats_settings_updated', handleSettingsUpdated);
      off('server_stats_toggled', handleStatsToggled);
      off('server_stats_deleted', handleStatsDeleted);
    };
  }, [socket, guildId]);

  const fetchSettings = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/server-stats/${guildId}/settings`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      showNotification('Ayarlar yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStats = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/server-stats/${guildId}/current`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentStats(data.stats);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const handleToggle = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/server-stats/${guildId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          enabled: !settings.enabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          settings.enabled ? 'Server stats devre dışı bırakıldı' : 'Server stats etkinleştirildi',
          'success'
        );
        await fetchSettings();
        await fetchCurrentStats();
      } else {
        showNotification(data.error || 'Bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      showNotification('Toggle işlemi başarısız', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetup = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/server-stats/${guildId}/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Server stats kanalları oluşturuldu!', 'success');
        await fetchSettings();
        await fetchCurrentStats();
      } else {
        showNotification(data.error || 'Bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Setup error:', error);
      showNotification('Setup işlemi başarısız', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/server-stats/${guildId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Stats güncellendi!', 'success');
        await fetchCurrentStats();
      } else {
        showNotification(data.error || 'Bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      showNotification('Güncelleme başarısız', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateChannelNames = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/server-stats/${guildId}/channel-names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          channelNames: settings.channelNames,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Kanal isimleri güncellendi!', 'success');
      } else {
        showNotification(data.error || 'Bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Channel names update error:', error);
      showNotification('İsim güncelleme başarısız', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Server stats kanallarını silmek istediğinize emin misiniz?')) {
      return;
    }

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/server-stats/${guildId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Server stats kanalları silindi', 'success');
        await fetchSettings();
      } else {
        showNotification(data.error || 'Bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Silme işlemi başarısız', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="settings" />;
  }

  if (!settings) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-400">Ayarlar yüklenemedi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#2c2f38] rounded-xl border border-white/10 p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Server Stats</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Sunucu istatistiklerini voice channel'larda real-time gösterin. Members, Bots ve Total Members sayısı otomatik güncellenir.
            </p>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  settings.enabled
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    İşleniyor...
                  </>
                ) : settings.enabled ? (
                  <>
                    <XMarkIcon className="w-5 h-5" />
                    Devre Dışı Bırak
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Etkinleştir
                  </>
                )}
              </button>

              {!settings.enabled && (
                <button
                  onClick={handleSetup}
                  disabled={saving}
                  className="px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-2"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Kanalları Oluştur
                </button>
              )}

              {settings.enabled && (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-6 py-3 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-2"
                  >
                    {updating ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <ArrowPathIcon className="w-5 h-5" />
                    )}
                    Manuel Güncelle
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-6 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                    Sil
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={`px-4 py-2 rounded-lg ${settings.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'} font-bold`}>
            {settings.enabled ? 'Aktif' : 'Devre Dışı'}
          </div>
        </div>
      </motion.div>

      {/* Current Stats */}
      {currentStats && settings.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-[#2c2f38] rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <UsersIcon className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-white">Members</h3>
            </div>
            <p className="text-3xl font-black text-white">{currentStats.members}</p>
          </div>

          <div className="bg-[#2c2f38] rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Cog6ToothIcon className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-bold text-white">Bots</h3>
            </div>
            <p className="text-3xl font-black text-white">{currentStats.bots}</p>
          </div>

          <div className="bg-[#2c2f38] rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-bold text-white">Total</h3>
            </div>
            <p className="text-3xl font-black text-white">{currentStats.total}</p>
          </div>
        </motion.div>
      )}

      {/* Channel Names Settings */}
      {settings.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#2c2f38] rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Cog6ToothIcon className="w-6 h-6 text-blue-500" />
            Kanal İsimleri
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            <code className="bg-black/30 px-2 py-1 rounded">{'{count}'}</code> yerine gerçek sayı gelecektir.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-gray-300 font-semibold text-sm mb-2 block">
                👥 Members Kanalı
              </label>
              <input
                type="text"
                value={settings.channelNames.members}
                onChange={(e) => setSettings({ ...settings, channelNames: { ...settings.channelNames, members: e.target.value } })}
                className="w-full px-4 py-3 bg-[#23272f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="👥 Members: {count}"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold text-sm mb-2 block">
                🤖 Bots Kanalı
              </label>
              <input
                type="text"
                value={settings.channelNames.bots}
                onChange={(e) => setSettings({ ...settings, channelNames: { ...settings.channelNames, bots: e.target.value } })}
                className="w-full px-4 py-3 bg-[#23272f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="🤖 Bots: {count}"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold text-sm mb-2 block">
                📊 Total Members Kanalı
              </label>
              <input
                type="text"
                value={settings.channelNames.total}
                onChange={(e) => setSettings({ ...settings, channelNames: { ...settings.channelNames, total: e.target.value } })}
                className="w-full px-4 py-3 bg-[#23272f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="📊 Total Members: {count}"
              />
            </div>

            <button
              onClick={handleUpdateChannelNames}
              disabled={saving}
              className="mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  İsimleri Kaydet
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Auto Update Settings */}
      {settings.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#2c2f38] rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Otomatik Güncelleme</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 font-semibold mb-1">Otomatik Güncelleme</p>
              <p className="text-gray-400 text-sm">Kanallar otomatik olarak güncellensin mi?</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold ${settings.autoUpdate ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {settings.autoUpdate ? 'Açık' : 'Kapalı'}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-300 font-semibold mb-1">Güncelleme Sıklığı</p>
            <p className="text-gray-400 text-sm mb-2">Her {settings.updateInterval} dakikada bir güncelle</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

