'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '../EmptyState';
import LoadingSkeleton from '../LoadingSkeleton';
import ColorPicker from './shared/ColorPicker';
import ConfirmDialog from './shared/ConfirmDialog';
import SearchBar from '../ui/SearchBar';

interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  hoist: boolean;
  mentionable: boolean;
  managed: boolean;
  memberCount: number;
}

interface RoleEditorProps {
  guildId: string;
  userId: string;
}

export default function RoleEditor({ guildId, userId }: RoleEditorProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Socket.IO for real-time updates
  const { socket } = useSocket();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', color: '#99AAB5', hoist: false, mentionable: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; roleId: string | null; roleName: string }>({
    open: false,
    roleId: null,
    roleName: ''
  });

  // Filter roles based on search query
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const query = searchQuery.toLowerCase();
    return roles.filter(role => 
      role.name.toLowerCase().includes(query) ||
      role.id.includes(query)
    );
  }, [roles, searchQuery]);

  useEffect(() => {
    fetchRoles();
  }, [guildId]);

  // Real-time role updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleRoleCreated = (data: any) => {
      if (data.guildId === guildId) {
        setRoles(prev => [...prev, data.role].sort((a, b) => b.position - a.position));
      }
    };

    const handleRoleUpdated = (data: any) => {
      if (data.guildId === guildId) {
        setRoles(prev => prev.map(role => 
          role.id === data.role.id ? { ...role, ...data.role } : role
        ).sort((a, b) => b.position - a.position));
      }
    };

    const handleRoleDeleted = (data: any) => {
      if (data.guildId === guildId) {
        setRoles(prev => prev.filter(role => role.id !== data.roleId));
      }
    };

    socket.on('role_created', handleRoleCreated);
    socket.on('role_updated', handleRoleUpdated);
    socket.on('role_deleted', handleRoleDeleted);

    return () => {
      socket.off('role_created', handleRoleCreated);
      socket.off('role_updated', handleRoleUpdated);
      socket.off('role_deleted', handleRoleDeleted);
    };
  }, [socket, guildId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-management/${guildId}/roles`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data = await response.json();
      setRoles(data.roles || []);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      alert('Rol adı gereklidir!');
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-management/${guildId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newRole.name,
          color: parseInt(newRole.color.replace('#', ''), 16),
          hoist: newRole.hoist,
          mentionable: newRole.mentionable,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      await fetchRoles();
      setCreatingRole(false);
      setNewRole({ name: '', color: '#99AAB5', hoist: false, mentionable: false });
    } catch (err: any) {
      console.error('Error creating role:', err);
      alert('Rol oluşturulamadı: ' + err.message);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirm.roleId) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guild-management/${guildId}/roles/${deleteConfirm.roleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ executor: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete role');
      }

      await fetchRoles();
      setDeleteConfirm({ open: false, roleId: null, roleName: '' });
    } catch (err: any) {
      console.error('Error deleting role:', err);
      alert('Rol silinemedi: ' + err.message);
    }
  };

  const openDeleteConfirm = (role: Role) => {
    setDeleteConfirm({
      open: true,
      roleId: role.id,
      roleName: role.name
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
          onClick={fetchRoles}
          className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (roles.length === 0) {
    return <EmptyState type="default" title="Rol Bulunamadı" description="Bu sunucuda henüz rol bulunmuyor." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Rol Yönetimi</h2>
          <p className="text-gray-400 mt-1">Sunucu rollerini yönetin</p>
        </div>
        <button
          onClick={() => setCreatingRole(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Rol
        </button>
      </div>

      {/* Create Role Modal */}
      {creatingRole && (
        <div className="bg-[#2c2f38] rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Yeni Rol Oluştur</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rol Adı</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#23272f] border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                placeholder="Yeni Rol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Renk</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                  className="flex-1 px-4 py-2 bg-[#23272f] border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRole.hoist}
                  onChange={(e) => setNewRole({ ...newRole, hoist: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Ayrı Göster</span>
              </label>
              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRole.mentionable}
                  onChange={(e) => setNewRole({ ...newRole, mentionable: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Etiketlenebilir</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateRole}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                <CheckIcon className="w-5 h-5" />
                Oluştur
              </button>
              <button
                onClick={() => {
                  setCreatingRole(false);
                  setNewRole({ name: '', color: '#99AAB5', hoist: false, mentionable: false });
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
      {roles.length > 0 && (
        <div className="mb-4">
          <SearchBar
            placeholder="Rol ara (isim veya ID)..."
            onSearch={setSearchQuery}
            className="w-full"
          />
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-2">
        {filteredRoles.length === 0 && searchQuery ? (
          <div className="text-center py-8 text-gray-400">
            <p>"{searchQuery}" için sonuç bulunamadı</p>
          </div>
        ) : (
          filteredRoles.map((role) => (
          <div
            key={role.id}
            className="bg-[#2c2f38] rounded-lg border border-white/10 p-4 hover:border-white/20 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: `#${role.color.toString(16).padStart(6, '0')}` }}
                />
                <div>
                  <h3 className="text-white font-semibold">{role.name}</h3>
                  <p className="text-sm text-gray-400">
                    {role.memberCount} üye • Position: {role.position}
                    {role.managed && ' • Yönetilen'}
                    {role.hoist && ' • Ayrı Gösterilen'}
                    {role.mentionable && ' • Etiketlenebilir'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!role.managed && (
                  <>
                    <button
                      onClick={() => setEditingRole(role.id)}
                      className="p-2 hover:bg-white/5 rounded-lg transition text-gray-400 hover:text-white"
                      title="Düzenle"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(role)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition text-gray-400 hover:text-red-400"
                      title="Sil"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Rolü Sil"
        message={`"${deleteConfirm.roleName}" rolünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteRole}
        onClose={() => setDeleteConfirm({ open: false, roleId: null, roleName: '' })}
        type="danger"
      />
    </div>
  );
}
