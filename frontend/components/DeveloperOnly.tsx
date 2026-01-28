'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface DeveloperOnlyProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];

export default function DeveloperOnly({ children, fallback }: DeveloperOnlyProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasDeveloperAccess, setHasDeveloperAccess] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        checkDeveloperAccess();
    }, []);

    const checkDeveloperAccess = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            
            // Check if user is logged in
            const userResponse = await fetch(`${API_URL}/api/auth/user`, {
                credentials: 'include',
            });

            if (!userResponse.ok) {
                setHasDeveloperAccess(false);
                setIsLoading(false);
                return;
            }

            const userData = await userResponse.json();
            setUser(userData);

            // Check developer access
            const isDev = DEVELOPER_IDS.includes(userData.id);
            setHasDeveloperAccess(isDev);
            
            console.log(`[DeveloperOnly] User ${userData.username} (${userData.id}) - Developer access: ${isDev}`);
        } catch (error) {
            console.error('[DeveloperOnly] Error checking developer access:', error);
            setHasDeveloperAccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center gap-6"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full"
                    />
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Erişim Kontrol Ediliyor</h3>
                        <p className="text-gray-400">Lütfen bekleyin...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!hasDeveloperAccess) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full"
                >
                    <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-8 backdrop-blur-xl">
                        <div className="flex items-center justify-center mb-6">
                            <div className="p-4 bg-red-500/20 rounded-full">
                                <XCircleIcon className="w-16 h-16 text-red-500" />
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white text-center mb-3">
                            Erişim Reddedildi
                        </h2>
                        
                        <p className="text-gray-300 text-center mb-6">
                            {user ? (
                                <>
                                    Bu sayfaya erişim yetkiniz yok. Developer paneline sadece yetkili geliştiriciler erişebilir.
                                    <br /><br />
                                    <span className="text-sm text-gray-400">
                                        Giriş yapan kullanıcı: {user.username}#{user.discriminator !== '0' ? user.discriminator : ''}
                                    </span>
                                </>
                            ) : (
                                'Bu sayfaya erişmek için önce giriş yapmanız gerekiyor.'
                            )}
                        </p>

                        <div className="flex flex-col gap-3">
                            {!user && (
                                <a
                                    href={`https://discord.com/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'https://neuroviabot.xyz/api/auth/callback')}&scope=identify%20email%20guilds&client_id=773539215098249246`}
                                    className="w-full px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-lg transition-colors text-center"
                                >
                                    Discord ile Giriş Yap
                                </a>
                            )}
                            
                            <a
                                href="/"
                                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-center"
                            >
                                Ana Sayfaya Dön
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}

