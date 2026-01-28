#!/bin/bash

echo "🔧 AuditLog.tsx Tam Düzeltme Scripti"
echo "====================================="

cd /root/neuroviabot-website/frontend

echo "📝 AuditLog.tsx dosyasını yeniden oluşturuyor..."

cat > components/dashboard/AuditLog.tsx << 'EOFAUDITLOG'
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSkeleton from '../LoadingSkeleton';
import EmptyState from '../EmptyState';
import { useNotification } from '@/contexts/NotificationContext';
import { useSocket } from '@/contexts/SocketContext';

interface AuditLogProps {
  guildId: string;
  userId: string;
}

interface AuditEntry {
  id: string;
  type: string;
  userId: string;
  targetId: string;
  action: string;
  details: any;
  severity: 'info' | 'warning' | 'danger';
  timestamp: string;
}

const severityColors = {
  info: 'from-blue-500 to-cyan-500',
  warning: 'from-yellow-500 to-orange-500',
  danger: 'from-red-500 to-pink-600',
};

const severityIcons = {
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  danger: ShieldCheckIcon,
};

export default function AuditLog({ guildId, userId }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', userId: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showNotification } = useNotification();
  const { socket, on, off } = useSocket();

  // Memoize fetchLogs with primitive dependencies
  const fetchLogs = useCallback(async () => {
    if (!guildId) {
      console.log('[AuditLog] No guildId, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filter.type && { type: filter.type }),
        ...(filter.userId && { userId: filter.userId }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/audit/${guildId}?${params}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('[AuditLog] Error fetching logs:', error);
      showNotification('Denetim günlükleri yüklenirken hata oluştu', 'error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [guildId, page, filter.type, filter.userId, showNotification]);

  // Fetch logs when dependencies change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Socket.IO listeners
  useEffect(() => {
    if (!socket || !guildId) {
      console.log('[AuditLog] Socket or guildId not available:', { socket: !!socket, guildId });
      return;
    }

    console.log('[AuditLog] Setting up socket listeners for guild:', guildId);

    const handleNewLog = (entry: AuditEntry) => {
      console.log('[AuditLog] New audit log entry received:', entry);
      if (entry.guildId === guildId) {
        setLogs((prev) => [entry, ...prev].slice(0, 20));
      }
    };

    on('audit_log_entry', handleNewLog);

    return () => {
      off('audit_log_entry', handleNewLog);
    };
  }, [socket, guildId, on, off]);

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(filter.type && { type: filter.type }),
        ...(filter.userId && { userId: filter.userId }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/audit/${guildId}/export?${params}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification('Denetim günlükleri başarıyla dışa aktarıldı', 'success');
    } catch (error) {
      console.error('[AuditLog] Error exporting logs:', error);
      showNotification('Dışa aktarma sırasında hata oluştu', 'error');
    }
  };

  const getActionIcon = (severity: string) => {
    const Icon = severityIcons[severity as keyof typeof severityIcons] || InformationCircleIcon;
    return <Icon className="w-5 h-5" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && logs.length === 0) {
    return <LoadingSkeleton type="list" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Denetim Günlüğü</h2>
          <p className="text-gray-400">Sunucunuzdaki tüm önemli olayları takip edin</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportLogs('json')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            JSON
          </button>
          <button
            onClick={() => exportLogs('csv')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Tipler</option>
            <option value="member">Üye İşlemleri</option>
            <option value="channel">Kanal İşlemleri</option>
            <option value="role">Rol İşlemleri</option>
            <option value="message">Mesaj İşlemleri</option>
            <option value="guild">Sunucu İşlemleri</option>
          </select>
        </div>

        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Kullanıcı ID..."
            value={filter.userId}
            onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Ara..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logs */}
      {logs.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="Henüz denetim kaydı yok"
          description="Sunucunuzda gerçekleşen olaylar burada görünecek"
        />
      ) : (
        <div className="space-y-4">
          {logs
            .filter((log) =>
              filter.search
                ? log.action.toLowerCase().includes(filter.search.toLowerCase()) ||
                  log.details?.toString().toLowerCase().includes(filter.search.toLowerCase())
                : true
            )
            .map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${
                      severityColors[log.severity]
                    } flex-shrink-0`}
                  >
                    {getActionIcon(log.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{log.action}</h3>
                        <p className="text-sm text-gray-400">{formatTimestamp(log.timestamp)}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.severity === 'danger'
                            ? 'bg-red-500/20 text-red-400'
                            : log.severity === 'warning'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {log.type}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span>Kullanıcı ID: {log.userId}</span>
                      </div>

                      {log.targetId && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                          <span>Hedef ID: {log.targetId}</span>
                        </div>
                      )}

                      {log.details && (
                        <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-xs font-mono text-gray-400">
                            {typeof log.details === 'object'
                              ? JSON.stringify(log.details, null, 2)
                              : log.details}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Önceki
          </button>
          <span className="px-4 py-2 bg-gray-800/50 rounded-lg">
            Sayfa {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
EOFAUDITLOG

echo "✅ AuditLog.tsx dosyası oluşturuldu"

echo ""
echo "🛑 Frontend'i durduruyor..."
pm2 delete neuroviabot-frontend 2>/dev/null || true

echo ""
echo "🗑️ .next klasörünü temizliyor..."
rm -rf .next

echo ""
echo "📦 Build başlatılıyor..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build başarısız oldu!"
    exit 1
fi

echo ""
echo "🚀 Frontend başlatılıyor..."
pm2 start npm --name "neuroviabot-frontend" -- start -- -p 3001

echo ""
echo "💾 PM2 yapılandırması kaydediliyor..."
pm2 save

echo ""
echo "✅ İşlem tamamlandı!"
echo ""
pm2 status
echo ""
echo "📋 Logları kontrol etmek için: pm2 logs neuroviabot-frontend"

