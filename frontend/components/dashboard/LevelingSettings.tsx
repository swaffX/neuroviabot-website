'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  TrophyIcon,
  GiftIcon,
  Cog6ToothIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useSocket } from '@/contexts/SocketContext';
import { useNotification } from '@/contexts/NotificationContext';

interface LevelingSettingsProps {
  guildId: string;
  userId: string;
}

interface LevelingConfig {
  enabled: boolean;
  xpPerMessage: number;
  cooldown: number;
  announceChannelId: string;
  roleRewards: Array<{
    level: number;
    roleId: string;
    roleName: string;
  }>;
  levelUpMessage: string;
  showLevelUpMessage: boolean;
}

const defaultConfig: LevelingConfig = {
  enabled: false,
  xpPerMessage: 15,
  cooldown: 60,
  announceChannelId: '',
  roleRewards: [],
  levelUpMessage: '🎉 {user} seviye {level}\'e yükseldi!',
  showLevelUpMessage: true,
};

export default function LevelingSettings({ guildId, userId }: LevelingSettingsProps) {
  const [config, setConfig] = useState<LevelingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const { socket } = useSocket();
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchSettings();
    fetchChannels();
    fetchRoles();
  }, [guildId]);

  // Socket.IO listener for real-time leveling settings updates
  useEffect(() => {
    if (!socket) return;

    const handleLevelingUpdate = (data: any) => {
      if (data.guildId === guildId) {
        console.log('[LevelingSettings] Real-time update received:', data);
        setConfig(prev => ({
          ...prev,
          ...data.settings
        }));
        showNotification('Seviye ayarları güncellendi', 'success');
      }
    };

    socket.on('leveling_settings_update', handleLevelingUpdate);

    return () => {
      socket.off('leveling_settings_update', handleLevelingUpdate);
    };
  }, [socket, guildId]);

  const fetchSettings = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/leveling`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || defaultConfig;
        // Ensure roleRewards is always an array
        setConfig({
          ...settings,
          roleRewards: Array.isArray(settings.roleRewards) ? settings.roleRewards : []
        });
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching leveling settings:', error);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-management/${guildId}/channels`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const textChannels = (data.channels || []).filter((channel: any) => 
          channel.type === 'GUILD_TEXT' || channel.type === 'text' || channel.type === 0
        );
        setChannels(textChannels);
      } else {
        setChannels([]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      showNotification('❌ Kanallar yüklenemedi. Bot sunucuda olmayabilir.', 'error');
      setChannels([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-management/${guildId}/roles`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showNotification('❌ Roller yüklenemedi. Bot sunucuda olmayabilir.', 'error');
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
            category: 'leveling',
            settings: config
          }),
        });
        
        if (botResponse.ok) {
          showNotification('✅ Seviye sistemi ayarları başarıyla kaydedildi!', 'success');
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }
      
      // Fallback: Backend API
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/leveling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('✅ Seviye sistemi ayarları başarıyla kaydedildi!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving leveling settings:', error);
      showNotification('❌ Ayarlar kaydedilemedi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof LevelingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addRoleReward = () => {
    const newReward = {
      level: 5,
      roleId: '',
      roleName: '',
    };
    setConfig(prev => ({
      ...prev,
      roleRewards: [...prev.roleRewards, newReward]
    }));
  };

  const removeRoleReward = (index: number) => {
    setConfig(prev => ({
      ...prev,
      roleRewards: prev.roleRewards.filter((_, i) => i !== index)
    }));
  };

  const updateRoleReward = (index: number, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      roleRewards: (prev.roleRewards || []).map((reward, i) => 
        i === index ? { ...reward, [key]: value } : reward
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
        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
          <ChartBarIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Seviye Sistemi</h2>
          <p className="text-gray-400 text-sm">Aktif üyeleri ödüllendirin ve seviye kazandırın</p>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
            <Cog6ToothIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
            <h3 className="text-white font-bold text-lg">Temel Ayarlar</h3>
            <p className="text-gray-400 text-sm">Seviye sistemi genel ayarları</p>
                  </div>
                </div>

        <div className="space-y-4">
          {/* Enable Leveling */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
              <h4 className="text-white font-semibold">Seviye Sistemini Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Üyeler mesaj göndererek XP kazansın</p>
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

          {/* XP Per Message */}
          {config.enabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Mesaj Başına XP</label>
                <input
                type="number"
                value={config.xpPerMessage}
                onChange={(e) => updateConfig('xpPerMessage', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                min="1"
                max="100"
              />
              <p className="text-gray-400 text-xs mt-1">Her mesaj için verilecek XP miktarı</p>
            </div>
          )}

          {/* Cooldown */}
          {config.enabled && (
            <div>
              <label className="block text-white font-semibold mb-2">XP Kazanma Süresi (saniye)</label>
              <input
                type="number"
                value={config.cooldown}
                onChange={(e) => updateConfig('cooldown', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                min="1"
                max="3600"
              />
              <p className="text-gray-400 text-xs mt-1">XP kazanmak için bekleme süresi</p>
            </div>
          )}

          {/* Announce Channel */}
          {config.enabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Duyuru Kanalı</label>
              <select
                value={config.announceChannelId}
                onChange={(e) => updateConfig('announceChannelId', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                <option value="">Duyuru kanalı seçin...</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
              <p className="text-gray-400 text-xs mt-1">Seviye atlama mesajlarının gönderileceği kanal</p>
                </div>
              )}
        </div>
      </div>

      {/* Level Up Messages */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500">
              <StarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Seviye Atlama Mesajları</h3>
              <p className="text-gray-400 text-sm">Seviye atladığında gönderilecek mesaj</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Show Level Up Message */}
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Seviye Atlama Mesajını Göster</h4>
                <p className="text-gray-400 text-sm">Seviye atladığında mesaj gönder</p>
              </div>
              <button
                onClick={() => updateConfig('showLevelUpMessage', !config.showLevelUpMessage)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.showLevelUpMessage
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {config.showLevelUpMessage ? 'Aktif' : 'Devre Dışı'}
              </button>
            </div>

            {/* Level Up Message */}
            {config.showLevelUpMessage && (
              <div>
                <label className="block text-white font-semibold mb-2">Seviye Atlama Mesajı</label>
                <textarea
                  value={config.levelUpMessage}
                  onChange={(e) => updateConfig('levelUpMessage', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  rows={3}
                  placeholder="🎉 {user} seviye {level}'e yükseldi!"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Kullanılabilir değişkenler: {'{user}'}, {'{level}'}, {'{xp}'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Rewards */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Seviye Ödülleri</h3>
                <p className="text-gray-400 text-sm">Belirli seviyelerde otomatik rol verin</p>
              </div>
            </div>
            <button
              onClick={addRoleReward}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
            >
              <GiftIcon className="w-4 h-4" />
              Ödül Ekle
            </button>
                </div>

          <div className="space-y-4">
            {(config.roleRewards || []).map((reward, index) => (
                    <motion.div
                      key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Ödül #{index + 1}</h4>
                  <button
                    onClick={() => removeRoleReward(index)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-all"
                  >
                    Kaldır
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Seviye</label>
                    <input
                          type="number"
                      value={reward.level}
                      onChange={(e) => updateRoleReward(index, 'level', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      min="1"
                      max="1000"
                        />
                      </div>
                  
                  <div>
                    <label className="block text-white font-semibold mb-2">Rol</label>
                    <select
                      value={reward.roleId}
                      onChange={(e) => {
                        const selectedRole = roles.find(r => r.id === e.target.value);
                        updateRoleReward(index, 'roleId', e.target.value);
                        updateRoleReward(index, 'roleName', selectedRole?.name || '');
                      }}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Rol seçin...</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                    </motion.div>
                  ))}
            
            {config.roleRewards.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <TrophyIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Henüz seviye ödülü eklenmemiş</p>
                <p className="text-sm">Yukarıdaki "Ödül Ekle" butonuna tıklayarak başlayın</p>
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
    </div>
  );
}