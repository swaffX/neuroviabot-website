'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  HashtagIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '../EmptyState';
import LoadingSkeleton from '../LoadingSkeleton';
import ConfirmDialog from './shared/ConfirmDialog';
import SearchBar from '../ui/SearchBar';
import { useSocket } from '@/contexts/SocketContext';

interface Channel {
  id: string;
  name: string;
  type: number;
  position: number;
  parentId: string | null;
  topic: string | null;
  nsfw: boolean;
}

interface ChannelManagerProps {
  guildId: string;
  userId: string;
}

const CHANNEL_TYPES = {
  0: { name: 'Text', icon: HashtagIcon, color: 'text-gray-400' },
  2: { name: 'Voice', icon: SpeakerWaveIcon, color: 'text-green-400' },
  4: { name: 'Category', icon: FolderIcon, color: 'text-yellow-400' },
};

export default function ChannelManager({ guildId, userId }: ChannelManagerProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({ 
    name: '', 
    type: 0, 
    topic: '', 
    nsfw: false, 
    parent: '' 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; channelId: string | null; channelName: string }>({
    open: false,
    channelId: null,
    channelName: ''
  });

  // Socket.IO for real-time updates
  const { socket } = useSocket();

  // Filter channels based on search query
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const query = searchQuery.toLowerCase();
    return channels.filter(channel => 
      channel.name.toLowerCase().includes(query) ||
      channel.id.includes(query) ||
      (channel.topic && channel.topic.toLowerCase().includes(query))
    );
  }, [channels, searchQuery]);

  useEffect(() => {
    fetchChannels();
  }, [guildId]);

  // Real-time channel updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleChannelCreated = (data: any) => {
      if (data.guildId === guildId) {
        setChannels(prev => [...prev, data.channel].sort((a, b) => a.position - b.position));
      }
    };

    const handleChannelUpdated = (data: any) => {
      if (data.guildId === guildId) {
        setChannels(prev => prev.map(ch => 
          ch.id === data.channel.id ? { ...ch, ...data.channel } : ch
        ).sort((a, b) => a.position - b.position));
      }
    };

    const handleChannelDeleted = (data: any) => {
      if (data.guildId === guildId) {
        setChannels(prev => prev.filter(ch => ch.id !== data.channelId));
      }
    };

    socket.on('channel_created', handleChannelCreated);
    socket.on('channel_updated', handleChannelUpdated);
    socket.on('channel_deleted', handleChannelDeleted);

    return () => {
      socket.off('channel_created', handleChannelCreated);
      socket.off('channel_updated', handleChannelUpdated);
      socket.off('channel_deleted', handleChannelDeleted);
    };
  }, [socket, guildId]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-management/${guildId}/channels`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }

      const data = await response.json();
      setChannels(data.channels || []);
    } catch (err: any) {
      console.error('Error fetching channels:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim()) {
      alert('Kanal adı gereklidir!');
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-management/${guildId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newChannel.name,
          type: newChannel.type,
          topic: newChannel.topic || undefined,
          nsfw: newChannel.nsfw,
          parent: newChannel.parent || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create channel');
      }

      await fetchChannels();
      setCreatingChannel(false);
      setNewChannel({ name: '', type: 0, topic: '', nsfw: false, parent: '' });
    } catch (err: any) {
      console.error('Error creating channel:', err);
      alert('Kanal oluşturulamadı: ' + err.message);
    }
  };

  const handleDeleteChannel = async () => {
    if (!deleteConfirm.channelId) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-management/${guildId}/channels/${deleteConfirm.channelId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ executor: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete channel');
      }

      await fetchChannels();
      setDeleteConfirm({ open: false, channelId: null, channelName: '' });
    } catch (err: any) {
      console.error('Error deleting channel:', err);
      alert('Kanal silinemedi: ' + err.message);
    }
  };

  const openDeleteConfirm = (channel: Channel) => {
    setDeleteConfirm({
      open: true,
      channelId: channel.id,
      channelName: channel.name
    });
  };

  if (loading) {
    return <LoadingSkeleton type="list" />;
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">Hata: {error}</p>
        <button
          onClick={fetchChannels}
          className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (channels.length === 0) {
    return <EmptyState type="default" title="Kanal Bulunamadı" description="Bu sunucuda henüz kanal bulunmuyor." />;
  }

  const categories = filteredChannels.filter(c => c.type === 4);
  const textChannels = filteredChannels.filter(c => c.type === 0);
  const voiceChannels = filteredChannels.filter(c => c.type === 2);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Kanal Yönetimi</h2>
          <p className="text-gray-400 mt-1">Sunucu kanallarını yönetin</p>
        </div>
        <button
          onClick={() => setCreatingChannel(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Kanal
        </button>
      </div>

      {/* Create Channel Modal */}
      {creatingChannel && (
        <div className="bg-[#2c2f38] rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Yeni Kanal Oluştur</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Kanal Türü</label>
              <select
                value={newChannel.type}
                onChange={(e) => setNewChannel({ ...newChannel, type: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#23272f] border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={0}>📝 Metin Kanalı</option>
                <option value={2}>🔊 Ses Kanalı</option>
                <option value={4}>📁 Kategori</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Kanal Adı</label>
              <input
                type="text"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#23272f] border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                placeholder="yeni-kanal"
              />
            </div>
            {newChannel.type === 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Konu (İsteğe Bağlı)</label>
                  <input
                    type="text"
                    value={newChannel.topic}
                    onChange={(e) => setNewChannel({ ...newChannel, topic: e.target.value })}
                    className="w-full px-4 py-2 bg-[#23272f] border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Kanal konusu..."
                  />
                </div>
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newChannel.nsfw}
                    onChange={(e) => setNewChannel({ ...newChannel, nsfw: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">NSFW Kanalı</span>
                </label>
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCreateChannel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                <CheckIcon className="w-5 h-5" />
                Oluştur
              </button>
              <button
                onClick={() => {
                  setCreatingChannel(false);
                  setNewChannel({ name: '', type: 0, topic: '', nsfw: false, parent: '' });
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                <XMarkIcon className="w-5 h-5" />
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {channels.length > 0 && (
        <div className="mb-4">
          <SearchBar
            placeholder="Kanal ara (isim, ID veya konu)..."
            onSearch={setSearchQuery}
            className="w-full"
          />
        </div>
      )}

      {/* Channels List */}
      <div className="space-y-6">
        {filteredChannels.length === 0 && searchQuery ? (
          <div className="text-center py-8 text-gray-400">
            <p>"{searchQuery}" için sonuç bulunamadı</p>
          </div>
        ) : (
          <>
        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FolderIcon className="w-5 h-5 text-yellow-400" />
              Kategoriler ({categories.length})
            </h3>
            <div className="space-y-2">
              {categories.map((channel) => (
                <ChannelItem key={channel.id} channel={channel} onDelete={openDeleteConfirm} />
              ))}
            </div>
          </div>
        )}

        {/* Text Channels */}
        {textChannels.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <HashtagIcon className="w-5 h-5 text-gray-400" />
              Metin Kanalları ({textChannels.length})
            </h3>
            <div className="space-y-2">
              {textChannels.map((channel) => (
                <ChannelItem key={channel.id} channel={channel} onDelete={openDeleteConfirm} />
              ))}
            </div>
          </div>
        )}

        {/* Voice Channels */}
        {voiceChannels.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <SpeakerWaveIcon className="w-5 h-5 text-green-400" />
              Ses Kanalları ({voiceChannels.length})
            </h3>
            <div className="space-y-2">
              {voiceChannels.map((channel) => (
                <ChannelItem key={channel.id} channel={channel} onDelete={openDeleteConfirm} />
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Kanalı Sil"
        message={`"${deleteConfirm.channelName}" kanalını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteChannel}
        onClose={() => setDeleteConfirm({ open: false, channelId: null, channelName: '' })}
        type="danger"
      />
    </div>
  );
}

function ChannelItem({ channel, onDelete }: { channel: Channel; onDelete: (channel: Channel) => void }) {
  const typeInfo = CHANNEL_TYPES[channel.type as keyof typeof CHANNEL_TYPES] || CHANNEL_TYPES[0];
  const Icon = typeInfo.icon;

  return (
    <div className="bg-[#2c2f38] rounded-lg border border-white/10 p-4 hover:border-white/20 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${typeInfo.color}`} />
          <div>
            <h3 className="text-white font-semibold">{channel.name}</h3>
            {channel.topic && <p className="text-sm text-gray-400 mt-1">{channel.topic}</p>}
            <p className="text-xs text-gray-500 mt-1">
              {typeInfo.name} • Position: {channel.position}
              {channel.nsfw && ' • NSFW'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(channel)}
            className="p-2 hover:bg-red-500/10 rounded-lg transition text-gray-400 hover:text-red-400"
            title="Sil"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
