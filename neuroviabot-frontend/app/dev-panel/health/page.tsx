'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DeveloperOnly from '@/components/DeveloperOnly';
import {
    ArrowLeftIcon,
    CpuChipIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

export default function HealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHealth();
        
        const interval = setInterval(loadHealth, 5000);
        
        return () => clearInterval(interval);
    }, []);

    const loadHealth = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            const response = await fetch(`${API_URL}/api/dev/system/health`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setHealth(data.health);
            }
        } catch (error) {
            console.error('[Dev Panel] Error loading health:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />;
            default:
                return <XCircleIcon className="w-8 h-8 text-red-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'from-green-500 to-emerald-500';
            case 'warning': return 'from-yellow-500 to-amber-500';
            default: return 'from-red-500 to-orange-500';
        }
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
                                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                                    <CpuChipIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white">Sistem Sağlığı</h1>
                                    <p className="text-sm text-gray-400">Bot ve sunucu durumu</p>
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
                                className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"
                            />
                        </div>
                    ) : health ? (
                        <div className="space-y-6">
                            {/* Overall Status */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-gradient-to-br ${getStatusColor(health.status)}/20 border ${getStatusColor(health.status).replace('from-', 'border-').split(' ')[0]}/50 rounded-2xl p-8`}
                            >
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(health.status)}
                                    <div>
                                        <h2 className="text-3xl font-black text-white capitalize">{health.status}</h2>
                                        <p className="text-gray-400">Sistem durumu</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Bot Health */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/5 border border-white/10 rounded-xl p-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Bot Durumu</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-1">Durum</div>
                                        <div className={`text-xl font-bold ${health.bot.ready ? 'text-green-500' : 'text-red-500'}`}>
                                            {health.bot.ready ? 'Çevrimiçi' : 'Çevrimdışı'}
                                        </div>
                                    </div>

                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-1">Ping</div>
                                        <div className="text-xl font-bold text-white">{health.bot.ping}ms</div>
                                    </div>

                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-1">Uptime</div>
                                        <div className="text-xl font-bold text-white">
                                            {Math.floor(health.bot.uptime / 3600)}s {Math.floor((health.bot.uptime % 3600) / 60)}d
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* System Health */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/5 border border-white/10 rounded-xl p-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Sistem Bilgisi</h3>
                                
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">Platform</div>
                                            <div className="text-white font-semibold">{health.system.platform}</div>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">Mimari</div>
                                            <div className="text-white font-semibold">{health.system.arch}</div>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">Node Sürümü</div>
                                            <div className="text-white font-semibold">{health.system.nodeVersion}</div>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">CPU Çekirdek</div>
                                            <div className="text-white font-semibold">{health.system.cpu.count}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-400 mb-2">Bellek Kullanımı</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                                    style={{ width: `${(health.system.memory.used / health.system.memory.total) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-white font-semibold text-sm">
                                                {health.system.memory.used}MB / {health.system.memory.total}GB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-gray-400">Sistem sağlığı yüklenemedi</p>
                        </div>
                    )}
                </div>
            </div>
        </DeveloperOnly>
    );
}

