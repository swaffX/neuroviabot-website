'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import './games.scss';

interface Game {
    id: string;
    name: string;
    emoji: string;
    description: string;
    minBet: number;
    maxBet: number;
    color: string;
    command: string;
}

export default function Games() {
    const params = useParams();
    const serverId = params?.id as string;

    const games: Game[] = [
        {
            id: 'crash',
            name: 'Crash',
            emoji: '💥',
            description: 'Çarpan artar, zamanında çık!',
            minBet: 10,
            maxBet: 10000,
            color: '#E74C3C',
            command: '/games crash'
        },
        {
            id: 'duel',
            name: 'Düello',
            emoji: '⚔️',
            description: '1v1 meydan okuma',
            minBet: 50,
            maxBet: 5000,
            color: '#F39C12',
            command: '/games düello'
        },
        {
            id: 'blackjack',
            name: 'Blackjack',
            emoji: '🃏',
            description: 'Klasik 21 oyunu',
            minBet: 50,
            maxBet: 5000,
            color: '#2C3E50',
            command: '/blackjack'
        },
        {
            id: 'slots',
            name: 'Slots',
            emoji: '🎰',
            description: 'Şans çarkı',
            minBet: 25,
            maxBet: 2500,
            color: '#9B59B6',
            command: '/slots'
        }
    ];

    return (
        <div className="games-page">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>🎮 NRC Oyunları</h1>
                <p>Mini oyunlarla NRC kazanın veya kaybetmeyin!</p>
            </motion.div>

            <div className="games-grid">
                {games.map((game, index) => (
                    <motion.div
                        key={game.id}
                        className="game-card"
                        style={{ borderColor: game.color }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="game-emoji">{game.emoji}</div>
                        <h3 className="game-name">{game.name}</h3>
                        <p className="game-description">{game.description}</p>
                        
                        <div className="game-info">
                            <div className="info-item">
                                <span className="label">Min Bahis:</span>
                                <span className="value">{game.minBet.toLocaleString()} NRC</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Max Bahis:</span>
                                <span className="value">{game.maxBet.toLocaleString()} NRC</span>
                            </div>
                        </div>

                        <div className="game-command">
                            <code>{game.command}</code>
                        </div>

                        <p className="game-note">
                            Bu oyunu oynamak için Discord sunucusunda komut girin
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="info-section">
                <div className="info-card">
                    <h3>💡 Nasıl Oynanır?</h3>
                    <ol>
                        <li>Discord sunucusuna gidin</li>
                        <li>İstediğiniz oyunun komutunu yazın</li>
                        <li>Bahis miktarını belirleyin</li>
                        <li>Oyunu oynayın ve kazancınızı alın!</li>
                    </ol>
                </div>

                <div className="info-card">
                    <h3>⚠️ Sorumlu Oyun</h3>
                    <ul>
                        <li>Sadece kaybetmeyi göze alabileceğiniz miktarlarla oynayın</li>
                        <li>Tüm oyunlarda ev avantajı vardır</li>
                        <li>Kayıpları kovalamayın</li>
                        <li>Eğlence için oynayın!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

