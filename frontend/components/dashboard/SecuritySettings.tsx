'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldExclamationIcon,
  UserGroupIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface SecuritySettingsProps {
  guildId: string;
  userId: string;
}

interface SecurityConfig {
  enabled: boolean;
  antiRaid: boolean;
  antiSpam: boolean;
  antiNuke: boolean;
  verificationSystem: boolean;
  verificationLevel: 'none' | 'low' | 'medium' | 'high' | 'very_high';
  verificationChannel: string;
  verificationRole: string;
  verificationMessage: string;
  autoModeration: boolean;
  autoBan: boolean;
  autoKick: boolean;
  maxWarnings: number;
  muteRole: string;
  logChannel: string;
  trustedRoles: string[];
}

const defaultConfig: SecurityConfig = {
  enabled: false,
  antiRaid: false,
  antiSpam: false,
  antiNuke: false,
  verificationSystem: false,
  verificationLevel: 'medium',
  verificationChannel: '',
  verificationRole: '',
  verificationMessage: 'Sunucumuza hoş geldin! Lütfen aşağıdaki mesaja tepki vererek doğrulan.',
  autoModeration: false,
  autoBan: false,
  autoKick: false,
  maxWarnings: 3,
  muteRole: '',
  logChannel: '',
  trustedRoles: [],
};

export default function SecuritySettings({ guildId, userId }: SecuritySettingsProps) {
  const [config, setConfig] = useState<SecurityConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([]);

  useEffect(() => {
    fetchSettings();
    fetchChannels();
    fetchRoles();
  }, [guildId]);

  const fetchSettings = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/security`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.settings || defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
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

  const fetchRoles = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guilds/${guildId}/roles`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('✅ Güvenlik ayarları başarıyla kaydedildi!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
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

  const updateConfig = (key: keyof SecurityConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleTrustedRole = (roleId: string) => {
    setConfig(prev => ({
      ...prev,
      trustedRoles: prev.trustedRoles.includes(roleId)
        ? prev.trustedRoles.filter(id => id !== roleId)
        : [...prev.trustedRoles, roleId]
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
          <ShieldExclamationIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Güvenlik Sistemi</h2>
          <p className="text-gray-400 text-sm">Sunucunuzu zararlı aktivitelerden koruyun</p>
        </div>
      </div>

      {/* Basic Security Settings */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
            <Cog6ToothIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Temel Güvenlik</h3>
            <p className="text-gray-400 text-sm">Güvenlik sistemi genel ayarları</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable Security */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Güvenlik Sistemini Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Sunucuyu otomatik olarak koru</p>
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

          {/* Anti-Raid */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Anti-Raid Koruması</h4>
                <p className="text-gray-400 text-sm">Toplu üye katılımını engelle</p>
              </div>
              <button
                onClick={() => updateConfig('antiRaid', !config.antiRaid)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.antiRaid
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.antiRaid ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Anti-Spam */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Anti-Spam Koruması</h4>
                <p className="text-gray-400 text-sm">Spam mesajları engelle</p>
              </div>
              <button
                onClick={() => updateConfig('antiSpam', !config.antiSpam)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.antiSpam
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.antiSpam ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}

          {/* Anti-Nuke */}
          {config.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Anti-Nuke Koruması</h4>
                <p className="text-gray-400 text-sm">Sunucu yıkımını engelle</p>
              </div>
              <button
                onClick={() => updateConfig('antiNuke', !config.antiNuke)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.antiNuke
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.antiNuke ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Verification System */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Doğrulama Sistemi</h3>
              <p className="text-gray-400 text-sm">Yeni üyeleri doğrulayın</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Enable Verification */}
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Doğrulama Sistemini Etkinleştir</h4>
                <p className="text-gray-400 text-sm">Yeni üyeler doğrulanmalı</p>
              </div>
              <button
                onClick={() => updateConfig('verificationSystem', !config.verificationSystem)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.verificationSystem
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.verificationSystem ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>

            {/* Verification Level */}
            {config.verificationSystem && (
              <div>
                <label className="block text-white font-semibold mb-2">Doğrulama Seviyesi</label>
                <select
                  value={config.verificationLevel}
                  onChange={(e) => updateConfig('verificationLevel', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">Yok</option>
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="very_high">Çok Yüksek</option>
                </select>
                <p className="text-gray-400 text-xs mt-1">Discord doğrulama seviyesi</p>
              </div>
            )}

            {/* Verification Channel */}
            {config.verificationSystem && (
              <div>
                <label className="block text-white font-semibold mb-2">Doğrulama Kanalı</label>
                <select
                  value={config.verificationChannel}
                  onChange={(e) => updateConfig('verificationChannel', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Kanal seçin...</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-xs mt-1">Doğrulama mesajının gönderileceği kanal</p>
              </div>
            )}

            {/* Verification Role */}
            {config.verificationSystem && (
              <div>
                <label className="block text-white font-semibold mb-2">Doğrulama Rolü</label>
                <select
                  value={config.verificationRole}
                  onChange={(e) => updateConfig('verificationRole', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Rol seçin...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-xs mt-1">Doğrulama sonrası verilecek rol</p>
              </div>
            )}

            {/* Verification Message */}
            {config.verificationSystem && (
              <div>
                <label className="block text-white font-semibold mb-2">Doğrulama Mesajı</label>
                <textarea
                  value={config.verificationMessage}
                  onChange={(e) => updateConfig('verificationMessage', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Sunucumuza hoş geldin! Lütfen aşağıdaki mesaja tepki vererek doğrulan."
                />
                <p className="text-gray-400 text-xs mt-1">Doğrulama mesajı içeriği</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto Moderation */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500">
              <ExclamationTriangleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Otomatik Moderasyon</h3>
              <p className="text-gray-400 text-sm">Otomatik ceza sistemi</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Auto Moderation */}
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Otomatik Moderasyon</h4>
                <p className="text-gray-400 text-sm">Kuralları otomatik uygula</p>
              </div>
              <button
                onClick={() => updateConfig('autoModeration', !config.autoModeration)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.autoModeration
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.autoModeration ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>

            {/* Max Warnings */}
            {config.autoModeration && (
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
                <p className="text-gray-400 text-xs mt-1">Bu sayıya ulaşıldığında otomatik ceza</p>
              </div>
            )}

            {/* Mute Role */}
            {config.autoModeration && (
              <div>
                <label className="block text-white font-semibold mb-2">Susturma Rolü</label>
                <select
                  value={config.muteRole}
                  onChange={(e) => updateConfig('muteRole', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                >
                  <option value="">Rol seçin...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-xs mt-1">Susturma için kullanılacak rol</p>
              </div>
            )}

            {/* Log Channel */}
            {config.autoModeration && (
              <div>
                <label className="block text-white font-semibold mb-2">Log Kanalı</label>
                <select
                  value={config.logChannel}
                  onChange={(e) => updateConfig('logChannel', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                >
                  <option value="">Kanal seçin...</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-xs mt-1">Güvenlik işlemlerinin kaydedileceği kanal</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trusted Roles */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
              <UserGroupIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Güvenilir Roller</h3>
              <p className="text-gray-400 text-sm">Güvenlik kurallarından muaf tutulacak roller</p>
            </div>
          </div>

          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded border-2 border-gray-600 cursor-pointer"
                    style={{ backgroundColor: config.trustedRoles.includes(role.id) ? '#10b981' : 'transparent' }}
                    onClick={() => toggleTrustedRole(role.id)}
                  />
                  <span className="text-white font-medium">{role.name}</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {config.trustedRoles.includes(role.id) ? 'Güvenilir' : 'Normal'}
                </span>
              </div>
            ))}
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
