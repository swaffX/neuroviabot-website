'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import './quests.scss';

interface Quest {
    questId: string;
    progress: number;
    target: number;
    reward: number;
    type: 'daily' | 'weekly' | 'event';
    name: string;
    description: string;
}

interface QuestProgress {
    activeQuests: Quest[];
    completedQuests: string[];
    dailyStreak: number;
    lastReset: string;
}

export default function Quests() {
    const params = useParams();
    const serverId = params?.id as string;

    const [questProgress, setQuestProgress] = useState<QuestProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'event'>('daily');

    useEffect(() => {
        fetchQuests();
    }, [serverId]);

    const fetchQuests = async () => {
        try {
            const userId = 'USER_ID_HERE';
            const response = await fetch(`/api/nrc/quests/active/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setQuestProgress(data.quests);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching quests:', error);
            setLoading(false);
        }
    };

    const handleClaimReward = async (questId: string) => {
        try {
            const response = await fetch(`/api/nrc/quests/claim/${questId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'USER_ID_HERE' })
            });

            if (response.ok) {
                alert('Ödül başarıyla alındı!');
                fetchQuests();
            } else {
                const data = await response.json();
                alert(`Hata: ${data.error}`);
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
            alert('Ödül alınırken bir hata oluştu!');
        }
    };

    const getProgressPercentage = (progress: number, target: number) => {
        return Math.min((progress / target) * 100, 100);
    };

    const getTypeEmoji = (type: string) => {
        const emojis = { daily: '📅', weekly: '📆', event: '🎉' };
        return emojis[type as keyof typeof emojis] || '📋';
    };

    const filterQuestsByType = (quests: Quest[], type: string) => {
        return quests.filter(q => q.type === type);
    };

    if (loading) {
        return (
            <div className="quests-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Görevler Yükleniyor...</p>
                </div>
            </div>
        );
    }

    const activeQuests = questProgress?.activeQuests || [];
    const filteredQuests = filterQuestsByType(activeQuests, activeTab);

    return (
        <div className="quests-page">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>🎯 Görevler</h1>
                <p>Görevleri tamamlayarak NRC kazanın</p>
            </motion.div>

            <div className="streak-card">
                <div className="streak-info">
                    <span className="streak-emoji">🔥</span>
                    <div>
                        <h3>Günlük Seri</h3>
                        <p className="streak-count">{questProgress?.dailyStreak || 0} Gün</p>
                    </div>
                </div>
                <p className="streak-description">
                    Her gün en az bir görev tamamlayarak serini koruyun!
                </p>
            </div>

            <div className="tab-buttons">
                <button
                    className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    📅 Günlük
                </button>
                <button
                    className={`tab-button ${activeTab === 'weekly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('weekly')}
                >
                    📆 Haftalık
                </button>
                <button
                    className={`tab-button ${activeTab === 'event' ? 'active' : ''}`}
                    onClick={() => setActiveTab('event')}
                >
                    🎉 Etkinlik
                </button>
            </div>

            <div className="quests-grid">
                {filteredQuests.length > 0 ? (
                    filteredQuests.map((quest, index) => {
                        const progressPercent = getProgressPercentage(quest.progress, quest.target);
                        const isCompleted = quest.progress >= quest.target;

                        return (
                            <motion.div
                                key={quest.questId}
                                className={`quest-card ${isCompleted ? 'completed' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="quest-header">
                                    <div className="quest-type">
                                        {getTypeEmoji(quest.type)} {quest.type.toUpperCase()}
                                    </div>
                                    <div className="quest-reward">
                                        💰 {quest.reward.toLocaleString()} NRC
                                    </div>
                                </div>

                                <h3 className="quest-name">{quest.name}</h3>
                                <p className="quest-description">{quest.description}</p>

                                <div className="quest-progress">
                                    <div className="progress-header">
                                        <span>İlerleme</span>
                                        <span>{quest.progress} / {quest.target}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {isCompleted && (
                                    <button
                                        className="claim-button"
                                        onClick={() => handleClaimReward(quest.questId)}
                                    >
                                        ✅ Ödülü Al
                                    </button>
                                )}
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <p>Bu kategoride görev bulunmuyor.</p>
                    </div>
                )}
            </div>

            {questProgress && questProgress.completedQuests.length > 0 && (
                <div className="completed-section">
                    <h2>✅ Tamamlanan Görevler</h2>
                    <p className="completed-count">
                        Toplam {questProgress.completedQuests.length} görev tamamlandı
                    </p>
                </div>
            )}
        </div>
    );
}

