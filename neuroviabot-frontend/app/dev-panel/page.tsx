'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DeveloperOnly from '@/components/DeveloperOnly';
import {
    ChartBarIcon,
    CommandLineIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    CircleStackIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ServerIcon,
    UserGroupIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

export default function DeveloperPanelPage() {
    const [stats, setStats] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        
        // Refresh every 5 seconds
        const interval = setInterval(loadDashboardData, 5000);
        
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            
            // Load real-time stats
            const statsResponse = await fetch(`${API_URL}/api/dev/bot/stats/real-time`, {
                credentials: 'include'
            });
            
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.stats);
            }

            // Load system health
            const healthResponse = await fetch(`${API_URL}/api/dev/system/health`, {
                credentials: 'include'
            });
            
            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                setHealth(healthData.health);
            }
        } catch (error) {
            console.error('[Dev Panel] Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getHealthStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-500';
            case 'warning': return 'text-yellow-500';
            case 'degraded': return 'text-orange-500';
            case 'error': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getHealthStatusBg = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-500/20 border-green-500/50';
            case 'warning': return 'bg-yellow-500/20 border-yellow-500/50';
            case 'degraded': return 'bg-orange-500/20 border-orange-500/50';
            case 'error': return 'bg-red-500/20 border-red-500/50';
            default: return 'bg-gray-500/20 border-gray-500/50';
        }
    };

    const sections = [
        {
            id: 'stats',
            title: 'Bot İstatistikleri',
            description: 'Real-time bot istatistikleri ve metrikler',
            icon: ChartBarIcon,
            color: 'from-blue-500 to-cyan-500',
            href: '/dev-panel/stats'
        },
        {
            id: 'commands',
            title: 'Komut Yönetimi',
            description: 'Bot komutlarını düzenle ve yönet',
            icon: CommandLineIcon,
            color: 'from-purple-500 to-pink-500',
            href: '/dev-panel/commands'
        },
        {
            id: 'health',
            title: 'Sistem Sağlığı',
            description: 'Sunucu ve bot sistem durumu',
            icon: CpuChipIcon,
            color: 'from-green-500 to-emerald-500',
            href: '/dev-panel/health'
        },
        {
            id: 'errors',
            title: 'Hata Yönetimi',
            description: 'Hata logları ve otomatik düzeltme',
            icon: ExclamationTriangleIcon,
            color: 'from-red-500 to-orange-500',
            href: '/dev-panel/errors'
        },
        {
            id: 'database',
            title: 'Database Yönetimi',
            description: 'Veritabanı yedekleme ve geri yükleme',
            icon: CircleStackIcon,
            color: 'from-yellow-500 to-amber-500',
            href: '/dev-panel/database'
        },
        {
            id: 'nrc',
            title: 'NRC Coin Yönetimi',
            description: 'Ekonomi sistemi ve NRC coin kontrolü',
            icon: CircleStackIcon,
            color: 'from-yellow-600 to-amber-600',
            href: '/dev-panel/nrc-management'
        }
    ];

    return (
        <DeveloperOnly>
            <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] relative overflow-hidden">
                {/* Animated Background - Same as Homepage */}
                <div className="fixed inset-0 z-0">
                    <motion.div 
                        className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                        animate={{
                            scale: [1, 1.2, 1],
                            x: [0, 50, 0],
                            y: [0, 30, 0],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div 
                        className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                        animate={{
                            scale: [1, 1.3, 1],
                            x: [0, -50, 0],
                            y: [0, 50, 0],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    />
                    <motion.div 
                        className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                        animate={{
                            scale: [1, 1.4, 1],
                            x: [0, 30, 0],
                            y: [0, -40, 0],
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2
                        }}
                    />
                    
                    {/* Grid Pattern */}
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(rgba(88, 101, 242, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(88, 101, 242, 0.02) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                        maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)'
                    }}></div>
                </div>

                {/* Header - Modern Glassmorphism */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0"
                >
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link 
                                    href="/"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-300 text-gray-300 hover:text-white group"
                                >
                                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-semibold">Ana Sayfa</span>
                                </Link>
                                
                                <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                                
                                <div>
                                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400">Developer Panel</h1>
                                    <p className="text-sm text-gray-400">Bot Yönetim ve İzleme</p>
                                </div>
                            </div>

                            {health && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-sm ${getHealthStatusBg(health.status)}`}
                                >
                                    {health.status === 'healthy' ? (
                                        <CheckCircleIcon className={`w-5 h-5 ${getHealthStatusColor(health.status)}`} />
                                    ) : (
                                        <XCircleIcon className={`w-5 h-5 ${getHealthStatusColor(health.status)}`} />
                                    )}
                                    <span className={`font-bold capitalize ${getHealthStatusColor(health.status)}`}>
                                        {health.status}
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                    {/* Quick Stats - Enhanced Glassmorphism */}
                    {stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                        >
                            <motion.div 
                                whileHover={{ scale: 1.03, y: -4 }}
                                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="text-sm text-blue-400 font-semibold mb-3 flex items-center gap-2">
                                        <ServerIcon className="w-4 h-4" />
                                        Sunucular
                                    </div>
                                    <div className="text-4xl font-black text-white mb-2">{stats.guilds || 0}</div>
                                    <div className="text-xs text-gray-400">Aktif sunucu</div>
                                </div>
                            </motion.div>

                            <motion.div 
                                whileHover={{ scale: 1.03, y: -4 }}
                                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="text-sm text-purple-400 font-semibold mb-3 flex items-center gap-2">
                                        <UserGroupIcon className="w-4 h-4" />
                                        Kullanıcılar
                                    </div>
                                    <div className="text-4xl font-black text-white mb-2">{stats.users?.toLocaleString() || 0}</div>
                                    <div className="text-xs text-gray-400">Toplam kullanıcı</div>
                                </div>
                            </motion.div>

                            <motion.div 
                                whileHover={{ scale: 1.03, y: -4 }}
                                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="text-sm text-green-400 font-semibold mb-3 flex items-center gap-2">
                                        <CommandLineIcon className="w-4 h-4" />
                                        Komutlar
                                    </div>
                                    <div className="text-4xl font-black text-white mb-2">{stats.commands || 0}</div>
                                    <div className="text-xs text-gray-400">Kayıtlı komut</div>
                                </div>
                            </motion.div>

                            <motion.div 
                                whileHover={{ scale: 1.03, y: -4 }}
                                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl rounded-2xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="text-sm text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4" />
                                        Ping
                                    </div>
                                    <div className="text-4xl font-black text-white mb-2">{stats.ping || 0}ms</div>
                                    <div className="text-xs text-gray-400">Discord API</div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Navigation Sections - Enhanced Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            
                            return (
                                <Link
                                    key={section.id}
                                    href={section.href}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                                        whileHover={{ scale: 1.05, y: -8 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer h-full"
                                    >
                                        {/* Animated Gradient Overlay */}
                                        <motion.div 
                                            className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                                            animate={{
                                                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                        />
                                        
                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                        
                                        {/* Content */}
                                        <div className="relative p-6">
                                            <motion.div 
                                                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 shadow-lg`}
                                                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Icon className="w-8 h-8 text-white" />
                                            </motion.div>
                                            
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-200 group-hover:via-blue-200 group-hover:to-pink-200 transition-all duration-300">
                                                {section.title}
                                            </h3>
                                            
                                            <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                                                {section.description}
                                            </p>
                                        </div>

                                        {/* Arrow with Animation */}
                                        <motion.div 
                                            className="absolute bottom-6 right-6 text-gray-400 group-hover:text-white transition-colors"
                                            animate={{ x: [0, 4, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </motion.div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </DeveloperOnly>
    );
}

