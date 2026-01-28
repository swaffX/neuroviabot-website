'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DeveloperOnly from '@/components/DeveloperOnly';
import {
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

interface ErrorLog {
    message: string;
    level: string;
    timestamp: string;
    stack?: string;
}

export default function ErrorsPage() {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

    useEffect(() => {
        loadErrors();
        
        const interval = setInterval(loadErrors, 10000);
        
        return () => clearInterval(interval);
    }, []);

    const loadErrors = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            const response = await fetch(`${API_URL}/api/dev/system/errors?limit=50`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setErrors(data.errors || []);
            }
        } catch (error) {
            console.error('[Dev Panel] Error loading errors:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DeveloperOnly>
            <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14]">
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ opacity: 1, y: 0 }}
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
                                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white">Hata Yönetimi</h1>
                                    <p className="text-sm text-gray-400">{errors.length} hata kaydı</p>
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
                                className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
                            />
                        </div>
                    ) : errors.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20"
                        >
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-green-500/20 rounded-full">
                                    <ExclamationTriangleIcon className="w-12 h-12 text-green-500" />
                                </div>
                            </div>
                            <p className="text-xl font-bold text-white mb-2">Hata Yok!</p>
                            <p className="text-gray-400">Sistem sorunsuz çalışıyor</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                        >
                            {errors.map((error, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedError(error)}
                                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 hover:border-red-500/50 cursor-pointer transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{error.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(error.timestamp).toLocaleString('tr-TR')}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* Error Detail Modal */}
                {selectedError && (
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setSelectedError(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-900 border border-red-500/50 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-auto"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Hata Detayı</h3>
                                <button
                                    onClick={() => setSelectedError(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Mesaj</div>
                                    <div className="text-white bg-black/50 rounded-lg p-3 font-mono text-sm">
                                        {selectedError.message}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Zaman</div>
                                    <div className="text-white">
                                        {new Date(selectedError.timestamp).toLocaleString('tr-TR')}
                                    </div>
                                </div>

                                {selectedError.stack && (
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">Stack Trace</div>
                                        <div className="text-white bg-black/50 rounded-lg p-3 font-mono text-xs overflow-auto max-h-60">
                                            <pre className="whitespace-pre-wrap">{selectedError.stack}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </DeveloperOnly>
    );
}

