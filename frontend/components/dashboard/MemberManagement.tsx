'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSkeleton from '../LoadingSkeleton';
import EmptyState from '../EmptyState';
import ErrorBoundary from '../ErrorBoundary';

interface MemberManagementProps {
  guildId: string;
  userId: string;
}

interface Member {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  nickname: string | null;
  roles: Array<{ id: string; name: string; color: number }>;
  joinedAt: string;
}

export default function MemberManagement({ guildId, userId }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchMembers();
  }, [guildId, page, search]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(
        `${API_URL}/api/guild-management/${guildId}/members?page=${page}&limit=20&search=${search}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      showNotification('Üyeler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, memberId: string, memberName: string) => {
    if (!confirm(`${memberName} kullanıcısına ${action} işlemini uygulamak istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const endpoints: Record<string, string> = {
        kick: `${API_URL}/api/guild-management/${guildId}/members/${memberId}/kick`,
        ban: `${API_URL}/api/guild-management/${guildId}/members/${memberId}/ban`,
        timeout: `${API_URL}/api/guild-management/${guildId}/members/${memberId}/timeout`,
      };

      const response = await fetch(endpoints[action], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Dashboard action', duration: action === 'timeout' ? 600 : undefined }),
      });

      if (response.ok) {
        showNotification(`${memberName} ${action === 'kick' ? 'atıldı' : action === 'ban' ? 'yasaklandı' : 'susturuldu'}`, 'success');
        fetchMembers();
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      showNotification(`İşlem başarısız: ${error}`, 'error');
    }
  };

  if (loading && members.length === 0) {
    return <LoadingSkeleton type="list" />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-8 h-8 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Üye Yönetimi</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Üye ara..."
            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <EmptyState 
          type="members" 
          title="Üye Bulunamadı"
          description={search ? 'Arama kriterlerinize uygun üye bulunamadı.' : 'Sunucuda üye bulunmuyor.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <img
                    src={
                      member.avatar
                        ? `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`
                        : `https://cdn.discordapp.com/embed/avatars/${member.discriminator && member.discriminator !== "0" ? parseInt(member.discriminator) % 5 : parseInt(member.id) % 5}.png`
                    }
                    alt={member.username}
                    className="w-12 h-12 rounded-full"
                  />

                  {/* User Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {member.nickname || member.username}
                      </span>
                      {member.discriminator && member.discriminator !== "0" && (
                        <span className="text-gray-500 text-sm">#{member.discriminator}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {member.roles.slice(0, 3).map((role) => (
                        <span
                          key={role.id}
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}20` : '#ffffff10',
                            color: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#ffffff',
                          }}
                        >
                          {role.name}
                        </span>
                      ))}
                      {member.roles.length > 3 && (
                        <span className="text-gray-500 text-xs">+{member.roles.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction('timeout', member.id, member.username)}
                    className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 transition-all"
                    title="Sustur"
                  >
                    <ClockIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleAction('kick', member.id, member.username)}
                    className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 transition-all"
                    title="At"
                  >
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleAction('ban', member.id, member.username)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all"
                    title="Yasakla"
                  >
                    <NoSymbolIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Önceki
          </button>
          <span className="text-gray-400">
            Sayfa {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

