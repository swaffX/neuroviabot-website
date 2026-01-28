'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface BackupSettingsProps {
  guildId: string;
  userId: string;
}

interface BackupConfig {
  enabled: boolean;
  autoBackup: boolean;
  backupInterval: number; // hours
  maxBackups: number;
  includeChannels: boolean;
  includeRoles: boolean;
  includeSettings: boolean;
  includeMessages: boolean;
  backups: Array<{
    id: string;
    name: string;
    date: string;
    size: string;
    type: 'manual' | 'auto';
  }>;
}

const defaultConfig: BackupConfig = {
  enabled: false,
  autoBackup: false,
  backupInterval: 24,
  maxBackups: 10,
  includeChannels: true,
  includeRoles: true,
  includeSettings: true,
  includeMessages: false,
  backups: [],
};

export default function BackupSettings({ guildId, userId }: BackupSettingsProps) {
  const [config, setConfig] = useState<BackupConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([]);

  useEffect(() => {
    fetchSettings();
  }, [guildId]);

  const fetchSettings = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/backup`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.settings || defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching backup settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('✅ Yedekleme ayarları başarıyla kaydedildi!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving backup settings:', error);
      showNotification('❌ Ayarlar kaydedilemedi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/backup/create`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        showNotification('✅ Yedekleme başarıyla oluşturuldu!', 'success');
        fetchSettings(); // Refresh backup list
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      showNotification('❌ Yedekleme oluşturulamadı', 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/backup/${backupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showNotification('✅ Yedekleme silindi!', 'success');
        fetchSettings(); // Refresh backup list
      } else {
        throw new Error('Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      showNotification('❌ Yedekleme silinemedi', 'error');
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/backup/${backupId}/download`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backupId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showNotification('✅ Yedekleme indirildi!', 'success');
      } else {
        throw new Error('Failed to download backup');
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      showNotification('❌ Yedekleme indirilemedi', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const updateConfig = (key: keyof BackupConfig, value: any) => {
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
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
          <CloudArrowUpIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Yedekleme Sistemi</h2>
          <p className="text-gray-400 text-sm">Sunucunuzun ayarlarını ve verilerini yedekleyin</p>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
            <Cog6ToothIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Temel Ayarlar</h3>
            <p className="text-gray-400 text-sm">Yedekleme sistemi genel ayarları</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable Backup */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Yedekleme Sistemini Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Sunucu verilerini yedekleyebilsin</p>
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

          {/* Auto Backup */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Otomatik Yedekleme</h4>
                <p className="text-gray-400 text-sm">Belirli aralıklarla otomatik yedekleme yap</p>
              </div>
              <button
                onClick={() => updateConfig('autoBackup', !config.autoBackup)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.autoBackup
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.autoBackup ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Backup Interval */}
          {config.enabled && config.autoBackup && (
            <div>
              <label className="block text-white font-semibold mb-2">Yedekleme Aralığı (saat)</label>
              <input
                type="number"
                value={config.backupInterval}
                onChange={(e) => updateConfig('backupInterval', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                min="1"
                max="168"
              />
              <p className="text-gray-400 text-xs mt-1">Otomatik yedekleme aralığı</p>
            </div>
          )}

          {/* Max Backups */}
          {config.enabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Maksimum Yedekleme Sayısı</label>
              <input
                type="number"
                value={config.maxBackups}
                onChange={(e) => updateConfig('maxBackups', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                min="1"
                max="50"
              />
              <p className="text-gray-400 text-xs mt-1">Saklanacak maksimum yedekleme sayısı</p>
            </div>
          )}
        </div>
      </div>

      {/* Backup Content Settings */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <DocumentArrowDownIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Yedekleme İçeriği</h3>
              <p className="text-gray-400 text-sm">Hangi verilerin yedekleneceğini seçin</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="text-white font-semibold">Kanallar</h4>
                  <p className="text-gray-400 text-sm">Kanal ayarları ve yapısı</p>
                </div>
                <button
                  onClick={() => updateConfig('includeChannels', !config.includeChannels)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    config.includeChannels
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {config.includeChannels ? 'Aktif' : 'Devre Dışı'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="text-white font-semibold">Roller</h4>
                  <p className="text-gray-400 text-sm">Rol ayarları ve izinleri</p>
                </div>
                <button
                  onClick={() => updateConfig('includeRoles', !config.includeRoles)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    config.includeRoles
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {config.includeRoles ? 'Aktif' : 'Devre Dışı'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="text-white font-semibold">Bot Ayarları</h4>
                  <p className="text-gray-400 text-sm">Bot konfigürasyonu</p>
                </div>
                <button
                  onClick={() => updateConfig('includeSettings', !config.includeSettings)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    config.includeSettings
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {config.includeSettings ? 'Aktif' : 'Devre Dışı'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="text-white font-semibold">Mesajlar</h4>
                  <p className="text-gray-400 text-sm">Kanal mesajları (dikkat: büyük boyut)</p>
                </div>
                <button
                  onClick={() => updateConfig('includeMessages', !config.includeMessages)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    config.includeMessages
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {config.includeMessages ? 'Aktif' : 'Devre Dışı'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Backup */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                <CloudArrowUpIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Manuel Yedekleme</h3>
                <p className="text-gray-400 text-sm">Hemen yedekleme oluşturun</p>
              </div>
            </div>
            <button
              onClick={createBackup}
              disabled={creatingBackup}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creatingBackup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-4 h-4" />
                  Yedekleme Oluştur
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Backup List */}
      {config.enabled && config.backups.length > 0 && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500">
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Yedeklemeler</h3>
              <p className="text-gray-400 text-sm">Mevcut yedeklemelerinizi yönetin</p>
            </div>
          </div>

          <div className="space-y-3">
            {config.backups.map((backup, index) => (
              <motion.div
                key={backup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <DocumentArrowDownIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{backup.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{backup.date}</span>
                      <span>{backup.size}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        backup.type === 'auto' 
                          ? 'bg-blue-900/30 text-blue-300' 
                          : 'bg-green-900/30 text-green-300'
                      }`}>
                        {backup.type === 'auto' ? 'Otomatik' : 'Manuel'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadBackup(backup.id)}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
                    title="İndir"
                  >
                    <CloudArrowDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBackup(backup.id)}
                    className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
                    title="Sil"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
