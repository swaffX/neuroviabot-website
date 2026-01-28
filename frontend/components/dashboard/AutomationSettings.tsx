'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface AutomationSettingsProps {
  guildId: string;
  userId: string;
}

interface AutomationConfig {
  autoRoleEnabled: boolean;
  autoRole: string;
  scheduledMessagesEnabled: boolean;
  scheduledMessages: Array<{
    id: string;
    channelId: string;
    message: string;
    interval: number;
    intervalType: 'minutes' | 'hours' | 'days';
    enabled: boolean;
  }>;
}

const defaultConfig: AutomationConfig = {
  autoRoleEnabled: false,
  autoRole: '',
  scheduledMessagesEnabled: false,
  scheduledMessages: [],
};

export default function AutomationSettings({ guildId, userId }: AutomationSettingsProps) {
  const [config, setConfig] = useState<AutomationConfig>(defaultConfig);
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
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/automation`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.settings || defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching automation settings:', error);
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
        const textChannels = (data.channels || []).filter((channel: any) => channel.type === 'text' || channel.type === 0);
        setChannels(textChannels);
      } else {
        setChannels([
          { id: '1', name: 'genel', type: 'text' },
          { id: '2', name: 'duyurular', type: 'text' },
          { id: '3', name: 'otomasyon', type: 'text' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      setChannels([
        { id: '1', name: 'genel', type: 'text' },
        { id: '2', name: 'duyurular', type: 'text' },
        { id: '3', name: 'otomasyon', type: 'text' },
      ]);
    }
  };

  const fetchRoles = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/roles`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        setRoles([
          { id: '1', name: 'Admin', color: '#ff0000' },
          { id: '2', name: 'Moderator', color: '#00ff00' },
          { id: '3', name: 'Member', color: '#0000ff' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([
        { id: '1', name: 'Admin', color: '#ff0000' },
        { id: '2', name: 'Moderator', color: '#00ff00' },
        { id: '3', name: 'Member', color: '#0000ff' },
      ]);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-settings/${guildId}/settings/automation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('✅ Otomasyon ayarları başarıyla kaydedildi!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving automation settings:', error);
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

  const updateConfig = (key: keyof AutomationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addScheduledMessage = () => {
    const newMessage = {
      id: Date.now().toString(),
      channelId: '',
      message: '',
      interval: 60,
      intervalType: 'minutes' as const,
      enabled: true,
    };
    setConfig(prev => ({
      ...prev,
      scheduledMessages: [...prev.scheduledMessages, newMessage]
    }));
  };

  const removeScheduledMessage = (id: string) => {
    setConfig(prev => ({
      ...prev,
      scheduledMessages: prev.scheduledMessages.filter(msg => msg.id !== id)
    }));
  };

  const updateScheduledMessage = (id: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      scheduledMessages: prev.scheduledMessages.map(msg => 
        msg.id === id ? { ...msg, [key]: value } : msg
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
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
          <Cog6ToothIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Otomasyon Sistemi</h2>
          <p className="text-gray-400 text-sm">Otomatik rol verme ve zamanlanmış mesajlar</p>
        </div>
      </div>

      {/* Auto Role Settings */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
            <UserGroupIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Otomatik Rol</h3>
            <p className="text-gray-400 text-sm">Yeni üyelere otomatik rol verin</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable Auto Role */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Otomatik Rol Sistemini Etkinleştir</h4>
              <p className="text-gray-400 text-sm">Yeni üyelere otomatik rol ver</p>
            </div>
            <button
              onClick={() => updateConfig('autoRoleEnabled', !config.autoRoleEnabled)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                config.autoRoleEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {config.autoRoleEnabled ? 'Aktif' : 'Devre Dışı'}
            </button>
          </div>

          {/* Role Selection */}
          {config.autoRoleEnabled && (
            <div>
              <label className="block text-white font-semibold mb-2">Verilecek Rol</label>
              <select
                value={config.autoRole}
                onChange={(e) => updateConfig('autoRole', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                <option value="">Rol seçin...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <p className="text-gray-400 text-xs mt-1">Yeni üyelere verilecek rol</p>
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Messages */}
      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Zamanlanmış Mesajlar</h3>
              <p className="text-gray-400 text-sm">Belirli aralıklarla otomatik mesaj gönderin</p>
            </div>
          </div>
          <button
            onClick={addScheduledMessage}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Mesaj Ekle
          </button>
        </div>

        <div className="space-y-4">
          {config.scheduledMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Mesaj #{index + 1}</h4>
                <button
                  onClick={() => removeScheduledMessage(message.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-all"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Kanal</label>
                  <select
                    value={message.channelId}
                    onChange={(e) => updateScheduledMessage(message.id, 'channelId', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
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
                  <label className="block text-white font-semibold mb-2">Mesaj İçeriği</label>
                  <textarea
                    value={message.message}
                    onChange={(e) => updateScheduledMessage(message.id, 'message', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    rows={3}
                    placeholder="Gönderilecek mesaj içeriği..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Aralık</label>
                    <input
                      type="number"
                      value={message.interval}
                      onChange={(e) => updateScheduledMessage(message.id, 'interval', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-semibold mb-2">Zaman Birimi</label>
                    <select
                      value={message.intervalType}
                      onChange={(e) => updateScheduledMessage(message.id, 'intervalType', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="minutes">Dakika</option>
                      <option value="hours">Saat</option>
                      <option value="days">Gün</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-600/50 rounded-lg">
                  <div>
                    <h5 className="text-white font-semibold">Mesajı Etkinleştir</h5>
                    <p className="text-gray-400 text-sm">Bu mesajı aktif olarak gönder</p>
                  </div>
                  <button
                    onClick={() => updateScheduledMessage(message.id, 'enabled', !message.enabled)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      message.enabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {message.enabled ? 'Aktif' : 'Devre Dışı'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {config.scheduledMessages.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Henüz zamanlanmış mesaj eklenmemiş</p>
              <p className="text-sm">Yukarıdaki "Mesaj Ekle" butonuna tıklayarak başlayın</p>
            </div>
          )}
        </div>
      </div>

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
