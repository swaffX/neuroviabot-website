'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface RoleReactionSettingsProps {
  guildId: string;
  userId: string;
}

interface RoleReactionConfig {
  enabled: boolean;
  reactions: Array<{
    id: string;
    messageId: string;
    channelId: string;
    emoji: string;
    roleId: string;
    enabled: boolean;
  }>;
}

const defaultConfig: RoleReactionConfig = {
  enabled: false,
  reactions: [],
};

export default function RoleReactionSettings({ guildId, userId }: RoleReactionSettingsProps) {
  const [config, setConfig] = useState<RoleReactionConfig>(defaultConfig);
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
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/role-reactions`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.settings || defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching role reaction settings:', error);
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
        const textChannels = (data.channels || []).filter((channel: any) => channel.type === 0 || channel.type === 'GUILD_TEXT');
        setChannels(textChannels);
      } else {
        console.error('Failed to fetch channels:', response.status);
        setChannels([]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
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
      } else {
        console.error('Failed to fetch roles:', response.status);
        setRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
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
            category: 'role-reactions',
            settings: config
          }),
        });
        
        if (botResponse.ok) {
          showNotification('✅ Tepki rol ayarları başarıyla kaydedildi!', 'success');
          return;
        }
      } catch (botError) {
        console.error('Bot API hatası:', botError);
      }
      
      // Fallback: Backend API
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/role-reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('✅ Tepki rol ayarları başarıyla kaydedildi!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving role reaction settings:', error);
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

  const updateConfig = (key: keyof RoleReactionConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addReaction = () => {
    const newReaction = {
      id: Date.now().toString(),
      messageId: '',
      channelId: '',
      emoji: '👍',
      roleId: '',
      enabled: true,
    };
    setConfig(prev => ({
      ...prev,
      reactions: [...prev.reactions, newReaction]
    }));
  };

  const removeReaction = (id: string) => {
    setConfig(prev => ({
      ...prev,
      reactions: prev.reactions.filter(reaction => reaction.id !== id)
    }));
  };

  const updateReaction = (id: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      reactions: prev.reactions.map(reaction => 
        reaction.id === id ? { ...reaction, [key]: value } : reaction
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
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
          <UserGroupIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Tepki Rolleri</h2>
          <p className="text-gray-400 text-sm">Mesajlara tepki vererek rol kazanma sistemi</p>
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
            <p className="text-gray-400 text-sm">Tepki rol sistemi genel ayarları</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable Role Reactions */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Tepki Rol Sistemini Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Mesajlara tepki vererek rol kazanma</p>
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
        </div>
      </div>

      {/* Reaction Rules */}
      {config.enabled && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Tepki Kuralları</h3>
                <p className="text-gray-400 text-sm">Hangi tepki hangi rolü verecek</p>
              </div>
            </div>
            <button
              onClick={addReaction}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Kural Ekle
            </button>
          </div>

          <div className="space-y-4">
            {config.reactions.map((reaction, index) => (
              <motion.div
                key={reaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Kural #{index + 1}</h4>
                  <button
                    onClick={() => removeReaction(reaction.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Kanal</label>
                      <select
                        value={reaction.channelId}
                        onChange={(e) => updateReaction(reaction.id, 'channelId', e.target.value)}
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

                    <div>
                      <label className="block text-white font-semibold mb-2">Mesaj ID</label>
                      <input
                        type="text"
                        value={reaction.messageId}
                        onChange={(e) => updateReaction(reaction.id, 'messageId', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        placeholder="Mesaj ID'sini girin..."
                      />
                      <p className="text-gray-400 text-xs mt-1">Mesajın sağ tık → ID Kopyala</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Emoji</label>
                      <input
                        type="text"
                        value={reaction.emoji}
                        onChange={(e) => updateReaction(reaction.id, 'emoji', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        placeholder="👍 veya :thumbsup:"
                        maxLength={10}
                      />
                      <p className="text-gray-400 text-xs mt-1">Emoji veya emoji kodu</p>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Verilecek Rol</label>
                      <select
                        value={reaction.roleId}
                        onChange={(e) => updateReaction(reaction.id, 'roleId', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
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

                  <div className="flex items-center justify-between p-3 bg-gray-600/50 rounded-lg">
                    <div>
                      <h5 className="text-white font-semibold">Kuralı Etkinleştir</h5>
                      <p className="text-gray-400 text-sm">Bu tepki kuralını aktif olarak kullan</p>
                    </div>
                    <button
                      onClick={() => updateReaction(reaction.id, 'enabled', !reaction.enabled)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        reaction.enabled
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {reaction.enabled ? 'Aktif' : 'Devre Dışı'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {config.reactions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Henüz tepki kuralı eklenmemiş</p>
                <p className="text-sm">Yukarıdaki "Kural Ekle" butonuna tıklayarak başlayın</p>
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
