'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import './nrc.scss';

interface NRCBalance {
    wallet: number;
    bank: number;
    total: number;
}

interface NRCStats {
    totalTransactions: number;
    totalEarned: number;
    totalSpent: number;
    rank: number;
}

export default function NRCDashboard() {
    const params = useParams();
    const serverId = params?.id as string;

    const [balance, setBalance] = useState<NRCBalance | null>(null);
    const [stats, setStats] = useState<NRCStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNRCData();
    }, [serverId]);

    const fetchNRCData = async () => {
        try {
            // Fetch user's NRC data
            // This would integrate with actual API
            setLoading(false);
        } catch (error) {
            console.error('Error fetching NRC data:', error);
            setLoading(false);
        }
    };

    const menuItems = [
        {
            title: '🎨 NFT Koleksiyonları',
            description: 'Özel NFT\'leri görüntüle ve satın al',
            href: `/dashboard/servers/${serverId}/nrc/collections`,
            color: '#E91E63'
        },
        {
            title: '💰 Yatırımlar',
            description: 'NRC yatırımlarınızı yönetin',
            href: `/dashboard/servers/${serverId}/nrc/investments`,
            color: '#2ECC71'
        },
        {
            title: '🎯 Görevler',
            description: 'Günlük ve haftalık görevler',
            href: `/dashboard/servers/${serverId}/nrc/quests`,
            color: '#F39C12'
        },
        {
            title: '🛒 Marketplace',
            description: 'NFT ve item ticareti yap',
            href: `/dashboard/servers/${serverId}/nrc/marketplace`,
            color: '#9B59B6'
        },
        {
            title: '🎮 Oyunlar',
            description: 'Mini oyunlarla NRC kazan',
            href: `/dashboard/servers/${serverId}/nrc/games`,
            color: '#3498DB'
        },
        {
            title: '👑 Premium',
            description: 'Premium planları görüntüle',
            href: `/dashboard/premium`,
            color: '#FFD700'
        },
        {
            title: '📊 Sıralama',
            description: 'NRC sıralamasını görüntüle',
            href: `/dashboard/servers/${serverId}/nrc/leaderboard`,
            color: '#1ABC9C'
        }
    ];

    if (loading) {
        return (
            <div className="nrc-dashboard">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>NRC Sistemi Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="nrc-dashboard">
            <motion.div
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1>💎 NeuroCoin (NRC) Hub</h1>
                <p className="subtitle">Tam ekonomi ve oyun ekosistemi</p>
            </motion.div>

            <div className="balance-section">
                <motion.div
                    className="balance-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="balance-header">
                        <h2>💰 Bakiyeniz</h2>
                    </div>
                    <div className="balance-content">
                        <div className="balance-item">
                            <span className="label">Cüzdan</span>
                            <span className="value">{balance?.wallet.toLocaleString() || '0'} NRC</span>
                        </div>
                        <div className="balance-item">
                            <span className="label">Banka</span>
                            <span className="value">{balance?.bank.toLocaleString() || '0'} NRC</span>
                        </div>
                        <div className="balance-item total">
                            <span className="label">Toplam</span>
                            <span className="value">{balance?.total.toLocaleString() || '0'} NRC</span>
                        </div>
                    </div>
                </motion.div>

                {stats && (
                    <motion.div
                        className="stats-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h3>📊 İstatistikler</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">İşlemler</span>
                                <span className="stat-value">{stats.totalTransactions}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Kazanılan</span>
                                <span className="stat-value">+{stats.totalEarned.toLocaleString()}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Harcanan</span>
                                <span className="stat-value">-{stats.totalSpent.toLocaleString()}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Sıralama</span>
                                <span className="stat-value">#{stats.rank}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="menu-grid">
                {menuItems.map((item, index) => (
                    <motion.div
                        key={item.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * index }}
                    >
                        <Link href={item.href}>
                            <div 
                                className="menu-card"
                                style={{ borderColor: item.color }}
                            >
                                <div className="menu-card-header">
                                    <h3>{item.title}</h3>
                                </div>
                                <p className="menu-card-description">{item.description}</p>
                                <div className="menu-card-footer">
                                    <span className="menu-card-link">
                                        Görüntüle →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="info-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                <div className="info-card">
                    <h3>💡 NeuroCoin Nedir?</h3>
                    <p>
                        NeuroCoin (NRC), NeuroViaBot\'un tam ekonomi sistemidir. Oyunlar oynayarak, 
                        görevleri tamamlayarak ve toplulukla etkileşerek NRC kazanabilirsiniz. 
                        NFT\'ler satın alın, premium abonelikler edinin, yatırım yapın ve daha fazlası!
                    </p>
                </div>

                <div className="info-card">
                    <h3>🎯 NRC Nasıl Kazanılır?</h3>
                    <ul>
                        <li>✅ Günlük ve haftalık görevleri tamamlayın</li>
                        <li>🎮 Mini oyunlar oynayın</li>
                        <li>💬 Sunucuda aktif olun (mesaj, ses kanalları)</li>
                        <li>📈 Seviye atlayın</li>
                        <li>🤝 Marketplace\'te ticaret yapın</li>
                    </ul>
                </div>

                <div className="info-card">
                    <h3>💸 NRC Nasıl Kullanılır?</h3>
                    <ul>
                        <li>🎨 NFT koleksiyonları satın alın</li>
                        <li>👑 Premium abonelik edinin</li>
                        <li>💰 Yatırım yapıp faiz kazanın</li>
                        <li>🛒 Marketplace\'te alışveriş yapın</li>
                        <li>🎰 Oyunlarda bahis yapın</li>
                    </ul>
                </div>
            </motion.div>
        </div>
    );
}

