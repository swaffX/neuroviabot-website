'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const DISCORD_PERMISSIONS: Permission[] = [
  // General
  { id: 'VIEW_CHANNEL', name: 'Kanalları Görüntüle', description: 'Kanalları görüntüleyebilir', category: 'Genel' },
  { id: 'MANAGE_CHANNELS', name: 'Kanalları Yönet', description: 'Kanal oluşturabilir, düzenleyebilir ve silebilir', category: 'Genel' },
  { id: 'MANAGE_ROLES', name: 'Rolleri Yönet', description: 'Rol oluşturabilir, düzenleyebilir ve silebilir', category: 'Genel' },
  { id: 'MANAGE_GUILD', name: 'Sunucuyu Yönet', description: 'Sunucu ayarlarını değiştirebilir', category: 'Genel' },
  
  // Membership
  { id: 'KICK_MEMBERS', name: 'Üyeleri At', description: 'Üyeleri sunucudan atabilir', category: 'Üyelik' },
  { id: 'BAN_MEMBERS', name: 'Üyeleri Yasakla', description: 'Üyeleri yasaklayabilir', category: 'Üyelik' },
  { id: 'MANAGE_NICKNAMES', name: 'Takma Adları Yönet', description: 'Üyelerin takma adlarını değiştirebilir', category: 'Üyelik' },
  
  // Text
  { id: 'SEND_MESSAGES', name: 'Mesaj Gönder', description: 'Metin kanallarında mesaj gönderebilir', category: 'Metin' },
  { id: 'MANAGE_MESSAGES', name: 'Mesajları Yönet', description: 'Mesajları silebilir ve sabitleyebilir', category: 'Metin' },
  { id: 'MENTION_EVERYONE', name: '@everyone Bahset', description: '@everyone ve @here kullanabilir', category: 'Metin' },
  
  // Voice
  { id: 'CONNECT', name: 'Bağlan', description: 'Ses kanallarına bağlanabilir', category: 'Ses' },
  { id: 'SPEAK', name: 'Konuş', description: 'Ses kanallarında konuşabilir', category: 'Ses' },
  { id: 'MUTE_MEMBERS', name: 'Üyeleri Sustur', description: 'Üyeleri sessize alabilir', category: 'Ses' },
  { id: 'DEAFEN_MEMBERS', name: 'Üyeleri Sağırlaştır', description: 'Üyeleri sağırlaştırabilir', category: 'Ses' },
  { id: 'MOVE_MEMBERS', name: 'Üyeleri Taşı', description: 'Üyeleri ses kanalları arasında taşıyabilir', category: 'Ses' },
];

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
}

export default function PermissionSelector({ selectedPermissions, onChange }: PermissionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = Array.from(new Set(DISCORD_PERMISSIONS.map(p => p.category)));

  const filteredPermissions = DISCORD_PERMISSIONS.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePermission = (permissionId: string) => {
    if (selectedPermissions.includes(permissionId)) {
      onChange(selectedPermissions.filter(p => p !== permissionId));
    } else {
      onChange([...selectedPermissions, permissionId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="İzin ara..."
        className="w-full px-4 py-2 bg-[#23272f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
      />

      {/* Permissions by Category */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {categories.map(category => {
          const categoryPerms = filteredPermissions.filter(p => p.category === category);
          if (categoryPerms.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">{category}</h4>
              <div className="space-y-2">
                {categoryPerms.map(permission => {
                  const isSelected = selectedPermissions.includes(permission.id);
                  return (
                    <button
                      key={permission.id}
                      onClick={() => togglePermission(permission.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border transition ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500/50'
                          : 'bg-[#23272f] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                      }`}>
                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium text-sm">{permission.name}</div>
                        <div className="text-gray-400 text-xs mt-1">{permission.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

