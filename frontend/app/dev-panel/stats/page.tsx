'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DeveloperOnly from '@/components/DeveloperOnly';
import {
    ArrowLeftIcon,
    ChartBarIcon,
    ServerIcon,
    UsersIcon,
    CommandLineIcon,
    CpuChipIcon,
    CircleStackIcon
} from '@heroicons/react/24/outline';

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
        
        // Auto-refresh every 3 seconds
        const interval = setInterval(loadStats, 3000);
        
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            const response = await fetch(`${API_URL}/api/dev/bot/stats/real-time`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('[Dev Panel] Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) return `${days}g ${hours}s`;
        if (hours > 0) return `${hours}s ${minutes}d`;
        return `${minutes}d`;
    };

    return (
        <DeveloperOnly>
            <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14]">
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50"
                >
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-4">
                            <Link 
                                href="/dev-panel"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                                <span className="font-semibold">Geri</span>
                            </Link>
                            
                            <div className="h-8 w-px bg-white/20"></div>
                            
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                                    <ChartBarIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white">Bot İstatistikleri</h1>
                                    <p className="text-sm text-gray-400">Real-time bot metrikleri</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                            />
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* Main Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <ServerIcon className="w-8 h-8 text-blue-400" />
                                        <span className="text-sm text-blue-300 font-semibold">Sunucular</span>
                                    </div>
                                    <div className="text-4xl font-black text-white mb-1">{stats.guilds}</div>
                                    <div className="text-xs text-gray-400">Aktif sunucu</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <UsersIcon className="w-8 h-8 text-purple-400" />
                                        <span className="text-sm text-purple-300 font-semibold">Kullanıcılar</span>
                                    </div>
                                    <div className="text-4xl font-black text-white mb-1">{stats.users?.toLocaleString()}</div>
                                    <div className="text-xs text-gray-400">Toplam kullanıcı</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <CommandLineIcon className="w-8 h-8 text-green-400" />
                                        <span className="text-sm text-green-300 font-semibold">Komutlar</span>
                                    </div>
                                    <div className="text-4xl font-black text-white mb-1">{stats.commands}</div>
                                    <div className="text-xs text-gray-400">Kayıtlı komut</div>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <CpuChipIcon className="w-8 h-8 text-yellow-400" />
                                        <span className="text-sm text-yellow-300 font-semibold">Ping</span>
                                    </div>
                                    <div className="text-4xl font-black text-white mb-1">{stats.ping}ms</div>
                                    <div className="text-xs text-gray-400">Discord API</div>
                                </div>
                            </motion.div>

                            {/* Memory & Uptime */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {/* Memory Usage */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <CircleStackIcon className="w-6 h-6 text-blue-400" />
                                        <h3 className="text-lg font-bold text-white">Bellek Kullanımı</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">Heap Kullanılan</span>
                                                <span className="text-white font-semibold">{stats.memory?.heapUsed} MB</span>
                                            </div>
                                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                                    style={{ width: `${(stats.memory?.heapUsed / stats.memory?.heapTotal) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">Heap Toplam</span>
                                                <span className="text-white font-semibold">{stats.memory?.heapTotal} MB</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">RSS</span>
                                                <span className="text-white font-semibold">{stats.memory?.rss} MB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Uptime */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <CpuChipIcon className="w-6 h-6 text-green-400" />
                                        <h3 className="text-lg font-bold text-white">Sistem Bilgisi</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Uptime</span>
                                            <span className="text-white font-semibold">{formatUptime(stats.uptime)}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Kanallar</span>
                                            <span className="text-white font-semibold">{stats.channels}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Son Güncelleme</span>
                                            <span className="text-white font-semibold">
                                                {new Date(stats.timestamp).toLocaleTimeString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-gray-400">İstatistikler yüklenemedi</p>
                        </div>
                    )}
                </div>
            </div>
        </DeveloperOnly>
    );
}

