'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DeveloperOnly from '@/components/DeveloperOnly';
import {
    ArrowLeftIcon,
    CircleStackIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function DatabasePage() {
    const [backupStatus, setBackupStatus] = useState<string>('');
    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreBackupId, setRestoreBackupId] = useState('');
    const [restoreLoading, setRestoreLoading] = useState(false);

    const createBackup = async () => {
        try {
            setBackupLoading(true);
            setBackupStatus('');
            
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            const response = await fetch(`${API_URL}/api/dev/database/backup`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();
            
            if (response.ok) {
                setBackupStatus(`✅ Yedekleme başarılı: ${data.backup}`);
            } else {
                setBackupStatus(`❌ Hata: ${data.error}`);
            }
        } catch (error) {
            setBackupStatus('❌ Yedekleme başarısız');
            console.error('[Dev Panel] Backup error:', error);
        } finally {
            setBackupLoading(false);
        }
    };

    const restoreBackup = async () => {
        if (!restoreBackupId) {
            alert('Lütfen bir yedek ID girin');
            return;
        }

        if (!confirm(`${restoreBackupId} yedeğini geri yüklemek istediğinizden emin misiniz? Bu işlem mevcut veritabanını değiştirecektir.`)) {
            return;
        }

        try {
            setRestoreLoading(true);
            setBackupStatus('');
            
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            const response = await fetch(`${API_URL}/api/dev/database/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ backupId: restoreBackupId })
            });

            const data = await response.json();
            
            if (response.ok) {
                setBackupStatus(`✅ Geri yükleme başarılı! Güvenlik yedeği: ${data.safetyBackup}`);
                setRestoreBackupId('');
            } else {
                setBackupStatus(`❌ Hata: ${data.error}`);
            }
        } catch (error) {
            setBackupStatus('❌ Geri yükleme başarısız');
            console.error('[Dev Panel] Restore error:', error);
        } finally {
            setRestoreLoading(false);
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
                                <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg">
                                    <CircleStackIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white">Database Yönetimi</h1>
                                    <p className="text-sm text-gray-400">Yedekleme ve geri yükleme</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                    {/* Status Message */}
                    {backupStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-lg border ${
                                backupStatus.includes('✅') 
                                    ? 'bg-green-500/10 border-green-500/50' 
                                    : 'bg-red-500/10 border-red-500/50'
                            }`}
                        >
                            <p className={`text-sm ${backupStatus.includes('✅') ? 'text-green-300' : 'text-red-300'}`}>
                                {backupStatus}
                            </p>
                        </motion.div>
                    )}

                    {/* Create Backup */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <ArrowDownTrayIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">Yedek Oluştur</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Mevcut veritabanının yedeğini oluşturur. Yedek dosyası data/backups klasörüne kaydedilir.
                                </p>
                                <button
                                    onClick={createBackup}
                                    disabled={backupLoading}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                                        backupLoading
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white`}
                                >
                                    {backupLoading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            <span>Yedek Oluşturuluyor...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                            <span>Yedek Oluştur</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Restore Backup */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-500/20 rounded-lg">
                                <ArrowUpTrayIcon className="w-6 h-6 text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">Yedeği Geri Yükle</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Önceden oluşturulmuş bir yedeği geri yükler. Mevcut veritabanı otomatik olarak yedeklenir.
                                </p>
                                
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={restoreBackupId}
                                        onChange={(e) => setRestoreBackupId(e.target.value)}
                                        placeholder="backup-1234567890.json"
                                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={restoreBackup}
                                        disabled={restoreLoading || !restoreBackupId}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                                            restoreLoading || !restoreBackupId
                                                ? 'bg-gray-600 cursor-not-allowed'
                                                : 'bg-orange-600 hover:bg-orange-700'
                                        } text-white`}
                                    >
                                        {restoreLoading ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                />
                                                <span>Geri Yükleniyor...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ArrowUpTrayIcon className="w-5 h-5" />
                                                <span>Geri Yükle</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Warning */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6"
                    >
                        <div className="flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            <div>
                                <h4 className="text-yellow-300 font-bold mb-2">⚠️ Dikkat</h4>
                                <ul className="text-yellow-200/80 text-sm space-y-1">
                                    <li>• Yedekleme işlemi sırasında bot performansı etkilenebilir</li>
                                    <li>• Geri yükleme işlemi mevcut veritabanını değiştirir</li>
                                    <li>• Geri yükleme öncesi otomatik güvenlik yedeği oluşturulur</li>
                                    <li>• Sadece .json formatındaki yedekler geri yüklenebilir</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </DeveloperOnly>
    );
}

