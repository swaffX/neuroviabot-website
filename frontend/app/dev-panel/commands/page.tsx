'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import DeveloperOnly from '@/components/DeveloperOnly';
import { io, Socket } from 'socket.io-client';
import {
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    CommandLineIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    BellAlertIcon
} from '@heroicons/react/24/outline';

interface Command {
    name: string;
    description: string;
    category: string;
    options: number;
    usageCount: number;
    enabled?: boolean;
}

export default function CommandsPage() {
    const [commands, setCommands] = useState<Command[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [notification, setNotification] = useState<{ type: 'added' | 'removed' | 'modified', name: string } | null>(null);
    
    const socketRef = useRef<Socket | null>(null);

    // Load commands
    useEffect(() => {
        loadCommands();
    }, []);

    // Setup Socket.IO for real-time updates with heartbeat
    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
        let heartbeatInterval: NodeJS.Timeout;
        let reconnectAttempts = 0;
        const MAX_RECONNECT_ATTEMPTS = 10;

        const socket = io(API_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            transports: ['websocket', 'polling'],
            timeout: 20000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Commands] Socket connected');
            reconnectAttempts = 0;
            
            // Start heartbeat
            heartbeatInterval = setInterval(() => {
                if (socket.connected) {
                    socket.emit('heartbeat', { type: 'commands_page' });
                }
            }, 30000); // 30 seconds
        });

        socket.on('disconnect', (reason) => {
            console.log('[Commands] Socket disconnected:', reason);
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('[Commands] Socket reconnected after', attemptNumber, 'attempts');
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            reconnectAttempts = attemptNumber;
            console.log('[Commands] Reconnection attempt:', attemptNumber);
        });

        socket.on('reconnect_failed', () => {
            console.error('[Commands] Socket reconnection failed after', MAX_RECONNECT_ATTEMPTS, 'attempts');
        });

        // Listen for command updates (from CommandWatcher)
        socket.on('commands_updated', (data: any) => {
            console.log('[Commands] Commands updated:', data);
            handleCommandUpdate(data);
        });

        // Listen for instant sync updates (from InstantCommandSync)
        socket.on('command_sync', (data: any) => {
            console.log('[Commands] Instant sync:', data);
            handleInstantSync(data);
        });

        // Listen for full sync (force refresh)
        socket.on('commands_full_sync', (data: any) => {
            console.log('[Commands] Full sync received:', data);
            if (data.commands) {
                setCommands(data.commands);
                setLastUpdate(new Date());
            }
        });

        // Pong response for heartbeat
        socket.on('pong', () => {
            // Connection is alive
        });

        return () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            socket.disconnect();
        };
    }, []);

    const handleCommandUpdate = useCallback((data: any) => {
        const { added, removed, modified } = data;

        // Show notifications
        if (added && added.length > 0) {
            added.forEach((cmd: any) => {
                showNotification('added', cmd.name);
                // Add to commands list
                setCommands(prev => {
                    if (!prev.find(c => c.name === cmd.name)) {
                        return [...prev, {
                            name: cmd.name,
                            description: cmd.description,
                            category: cmd.category || 'general',
                            options: cmd.options?.length || 0,
                            usageCount: 0,
                            enabled: true
                        }];
                    }
                    return prev;
                });
            });
        }

        if (removed && removed.length > 0) {
            removed.forEach((cmdName: string) => {
                showNotification('removed', cmdName);
                // Remove from commands list
                setCommands(prev => prev.filter(c => c.name !== cmdName));
            });
        }

        if (modified && modified.length > 0) {
            modified.forEach((cmd: any) => {
                showNotification('modified', cmd.name);
                // Update command
                setCommands(prev => prev.map(c => 
                    c.name === cmd.name 
                        ? {
                            ...c,
                            description: cmd.description,
                            category: cmd.category || c.category,
                            options: cmd.options?.length || c.options
                        }
                        : c
                ));
            });
        }

        setLastUpdate(new Date());
    }, []);

    const showNotification = (type: 'added' | 'removed' | 'modified', name: string) => {
        setNotification({ type, name });
        setTimeout(() => setNotification(null), 5000);
    };

    // Handle instant sync events (from chokidar)
    const handleInstantSync = useCallback((data: any) => {
        const { type, command } = data;

        if (type === 'added' && command) {
            showNotification('added', command.name);
            setCommands(prev => {
                if (!prev.find(c => c.name === command.name)) {
                    return [...prev, {
                        name: command.name,
                        description: command.description,
                        category: command.category || 'general',
                        options: command.options || 0,
                        usageCount: 0,
                        enabled: true
                    }];
                }
                return prev;
            });
        } else if (type === 'removed' && command) {
            showNotification('removed', command.name);
            setCommands(prev => prev.filter(c => c.name !== command.name));
        } else if (type === 'modified' && command) {
            showNotification('modified', command.name);
            setCommands(prev => prev.map(c => 
                c.name === command.name 
                    ? {
                        ...c,
                        description: command.description,
                        category: command.category || c.category,
                        options: command.options || c.options
                    }
                    : c
            ));
        }

        setLastUpdate(new Date());
    }, []);

    const loadCommands = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            const response = await fetch(`${API_URL}/api/dev/bot/commands`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setCommands(data.commands || []);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('[Dev Panel] Error loading commands:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            const response = await fetch(`${API_URL}/api/dev/bot/commands/refresh`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Commands] Refresh result:', data);
                
                // Update commands list
                if (data.commands) {
                    setCommands(data.commands);
                } else {
                    // Fallback: reload all commands
                    await loadCommands();
                }
                
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('[Dev Panel] Error refreshing commands:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleCommand = async (name: string, currentStatus: boolean) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            const response = await fetch(`${API_URL}/api/dev/bot/commands/${name}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ enabled: !currentStatus })
            });

            if (response.ok) {
                // Update local state
                setCommands(prev => prev.map(cmd => 
                    cmd.name === name ? { ...cmd, enabled: !currentStatus } : cmd
                ));
            }
        } catch (error) {
            console.error('[Dev Panel] Error toggling command:', error);
        }
    };

    const filteredCommands = commands.filter(cmd => {
        const matchesSearch = cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...Array.from(new Set(commands.map(cmd => cmd.category)))];

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
                        <div className="flex items-center justify-between">
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
                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                        <CommandLineIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-white">Komut Yönetimi</h1>
                                        <p className="text-sm text-gray-400">
                                            {commands.length} komut kayıtlı
                                            {lastUpdate && (
                                                <span className="ml-2 text-xs text-gray-500">
                                                    • Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all ${
                                    refreshing ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="font-semibold">{refreshing ? 'Yenileniyor...' : 'Yenile'}</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Notifications */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className="fixed top-20 right-6 z-50"
                        >
                            <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border backdrop-blur-xl ${
                                notification.type === 'added' 
                                    ? 'bg-green-500/20 border-green-500/50 text-green-300' 
                                    : notification.type === 'removed'
                                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                                    : 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            }`}>
                                <BellAlertIcon className="w-6 h-6" />
                                <div>
                                    <p className="font-bold">
                                        {notification.type === 'added' && 'Komut Eklendi'}
                                        {notification.type === 'removed' && 'Komut Kaldırıldı'}
                                        {notification.type === 'modified' && 'Komut Güncellendi'}
                                    </p>
                                    <p className="text-sm opacity-80">/{notification.name}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6 flex flex-col md:flex-row gap-4"
                    >
                        {/* Search */}
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Komut ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat} className="bg-gray-900">
                                    {cat === 'all' ? 'Tüm Kategoriler' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>
                    </motion.div>

                    {/* Commands Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                            />
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {filteredCommands.map((cmd, index) => (
                                <motion.div
                                    key={cmd.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1">
                                                /{cmd.name}
                                            </h3>
                                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">
                                                {cmd.category}
                                            </span>
                                        </div>
                                        
                                        <button
                                            onClick={() => toggleCommand(cmd.name, cmd.enabled ?? true)}
                                            className={`p-2 rounded-lg transition-all ${
                                                cmd.enabled !== false 
                                                    ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                                                    : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                                            }`}
                                        >
                                            {cmd.enabled !== false ? (
                                                <CheckCircleIcon className="w-5 h-5" />
                                            ) : (
                                                <XCircleIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-gray-400 text-sm mb-4">
                                        {cmd.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{cmd.options} seçenek</span>
                                        <span>{cmd.usageCount || 0} kullanım</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {!loading && filteredCommands.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-gray-400">Komut bulunamadı</p>
                        </div>
                    )}
                </div>
            </div>
        </DeveloperOnly>
    );
}

