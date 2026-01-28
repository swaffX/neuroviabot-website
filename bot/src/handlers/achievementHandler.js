// ==========================================
// 🏆 Achievement System Handler
// ==========================================
// Automatically tracks and unlocks achievements

const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');
const { EmbedBuilder } = require('discord.js');

class AchievementHandler {
    constructor(client) {
        this.client = client;
        this.achievements = this.defineAchievements();
        this.setupListeners();
    }

    defineAchievements() {
        return {
            // Wealth Achievements
            'first_1k': {
                id: 'first_1k',
                name: '💰 İlk Birikim',
                description: 'İlk 1,000 NRC\'ni kazan',
                category: 'wealth',
                requirement: { type: 'balance', value: 1000 },
                reward: { nrc: 500, badge: '💰' }
            },
            'first_10k': {
                id: 'first_10k',
                name: '💎 Zenginleşme',
                description: 'İlk 10,000 NRC\'ni kazan',
                category: 'wealth',
                requirement: { type: 'balance', value: 10000 },
                reward: { nrc: 2000, badge: '💎' }
            },
            'first_100k': {
                id: 'first_100k',
                name: '👑 Zengin',
                description: 'İlk 100,000 NRC\'ni kazan',
                category: 'wealth',
                requirement: { type: 'balance', value: 100000 },
                reward: { nrc: 10000, badge: '👑' }
            },
            'millionaire': {
                id: 'millionaire',
                name: '🌟 Milyoner',
                description: '1,000,000 NRC\'ye ulaş',
                category: 'wealth',
                requirement: { type: 'balance', value: 1000000 },
                reward: { nrc: 100000, badge: '🌟' }
            },

            // Trading Achievements
            'first_trade': {
                id: 'first_trade',
                name: '🤝 İlk Ticaret',
                description: 'İlk ticaretini tamamla',
                category: 'trading',
                requirement: { type: 'trades', value: 1 },
                reward: { nrc: 1000, badge: '🤝' }
            },
            'trader_10': {
                id: 'trader_10',
                name: '🛒 Tüccar',
                description: '10 başarılı ticaret yap',
                category: 'trading',
                requirement: { type: 'trades', value: 10 },
                reward: { nrc: 5000, badge: '🛒' }
            },
            'trader_100': {
                id: 'trader_100',
                name: '🏪 Ticaret Ustası',
                description: '100 başarılı ticaret yap',
                category: 'trading',
                requirement: { type: 'trades', value: 100 },
                reward: { nrc: 50000, badge: '🏪' }
            },
            'trade_volume_50k': {
                id: 'trade_volume_50k',
                name: '💼 Büyük Tüccar',
                description: '50,000 NRC ticaret hacmine ulaş',
                category: 'trading',
                requirement: { type: 'trade_volume', value: 50000 },
                reward: { nrc: 10000, badge: '💼' }
            },

            // Social Achievements
            'messages_100': {
                id: 'messages_100',
                name: '💬 Konuşkan',
                description: '100 mesaj gönder',
                category: 'social',
                requirement: { type: 'messages', value: 100 },
                reward: { nrc: 500, badge: '💬' }
            },
            'messages_1k': {
                id: 'messages_1k',
                name: '📢 Sohbet Ustası',
                description: '1,000 mesaj gönder',
                category: 'social',
                requirement: { type: 'messages', value: 1000 },
                reward: { nrc: 5000, badge: '📢' }
            },
            'messages_10k': {
                id: 'messages_10k',
                name: '🎤 Efsane Konuşmacı',
                description: '10,000 mesaj gönder',
                category: 'social',
                requirement: { type: 'messages', value: 10000 },
                reward: { nrc: 50000, badge: '🎤' }
            },
            'voice_100h': {
                id: 'voice_100h',
                name: '🎧 Sesli Sohbet Tutkunu',
                description: '100 saat sesli kanalda kal',
                category: 'social',
                requirement: { type: 'voice_hours', value: 100 },
                reward: { nrc: 20000, badge: '🎧' }
            },

            // Gaming Achievements
            'first_win': {
                id: 'first_win',
                name: '🎮 İlk Zafer',
                description: 'İlk oyununu kazan',
                category: 'gaming',
                requirement: { type: 'game_wins', value: 1 },
                reward: { nrc: 1000, badge: '🎮' }
            },
            'win_streak_10': {
                id: 'win_streak_10',
                name: '🔥 Seri Kazanan',
                description: 'Üst üste 10 oyun kazan',
                category: 'gaming',
                requirement: { type: 'win_streak', value: 10 },
                reward: { nrc: 10000, badge: '🔥' }
            },
            'jackpot': {
                id: 'jackpot',
                name: '🎰 Jackpot!',
                description: 'Slots\'ta jackpot vur',
                category: 'gaming',
                requirement: { type: 'jackpot_hit', value: 1 },
                reward: { nrc: 50000, badge: '🎰' }
            },
            'lottery_win': {
                id: 'lottery_win',
                name: '🎟️ Şanslı Kazanan',
                description: 'Lottoyu kazan',
                category: 'gaming',
                requirement: { type: 'lottery_win', value: 1 },
                reward: { nrc: 100000, badge: '🎟️' }
            },

            // Special Achievements
            'streak_365': {
                id: 'streak_365',
                name: '📅 Yıllık Sadakat',
                description: '365 günlük streak yap',
                category: 'special',
                requirement: { type: 'streak', value: 365 },
                reward: { nrc: 365000, badge: '📅' }
            },
            'servers_10': {
                id: 'servers_10',
                name: '🌍 Gezgin',
                description: 'Botu olan 10 sunucuda bulun',
                category: 'special',
                requirement: { type: 'servers', value: 10 },
                reward: { nrc: 10000, badge: '🌍' }
            },
            'invites_5': {
                id: 'invites_5',
                name: '🎁 Arkadaş Davetçisi',
                description: '5 arkadaşını davet et',
                category: 'special',
                requirement: { type: 'invites', value: 5 },
                reward: { nrc: 25000, badge: '🎁' }
            },
            'beta_tester': {
                id: 'beta_tester',
                name: '🧪 Beta Tester',
                description: 'NeuroCoin sisteminin beta testi',
                category: 'special',
                requirement: { type: 'manual', value: 1 },
                reward: { nrc: 50000, badge: '🧪' }
            }
        };
    }

    setupListeners() {
        // Balance changes
        this.client.on('neuroCoinUpdate', (userId, newBalance) => {
            this.checkBalanceAchievements(userId, newBalance);
        });

        logger.info('[Achievement] Handler initialized');
    }

    async checkAchievement(userId, achievementId) {
        const db = getDatabase();
        const userAchievements = db.data.achievements.get(userId) || [];

        // Already unlocked
        if (userAchievements.includes(achievementId)) {
            return false;
        }

        const achievement = this.achievements[achievementId];
        if (!achievement) return false;

        // Check requirement
        const meetsRequirement = await this.checkRequirement(userId, achievement.requirement);
        
        if (meetsRequirement) {
            await this.unlockAchievement(userId, achievementId);
            return true;
        }

        return false;
    }

    async checkRequirement(userId, requirement) {
        const db = getDatabase();

        switch (requirement.type) {
            case 'balance': {
                const balance = db.getNeuroCoinBalance(userId);
                return balance.total >= requirement.value;
            }

            case 'trades': {
                const transactions = db.getUserTransactions(userId, 1000);
                const tradeCount = transactions.filter(tx => 
                    tx.type === 'marketplace_purchase' || tx.type === 'marketplace_sale'
                ).length;
                return tradeCount >= requirement.value;
            }

            case 'trade_volume': {
                const transactions = db.getUserTransactions(userId, 1000);
                const volume = transactions
                    .filter(tx => tx.type === 'marketplace_purchase' || tx.type === 'marketplace_sale')
                    .reduce((sum, tx) => sum + tx.amount, 0);
                return volume >= requirement.value;
            }

            case 'messages': {
                const userStats = db.data.userStats?.get(userId);
                return (userStats?.messages || 0) >= requirement.value;
            }

            case 'voice_hours': {
                const userStats = db.data.userStats?.get(userId);
                const hours = (userStats?.voiceTime || 0) / 3600000; // ms to hours
                return hours >= requirement.value;
            }

            case 'game_wins': {
                const userStats = db.data.userStats?.get(userId);
                return (userStats?.gameWins || 0) >= requirement.value;
            }

            case 'win_streak': {
                const userStats = db.data.userStats?.get(userId);
                return (userStats?.winStreak || 0) >= requirement.value;
            }

            case 'streak': {
                const streakData = db.data.dailyStreaks.get(userId);
                return (streakData?.count || 0) >= requirement.value;
            }

            case 'servers': {
                const guilds = this.client.guilds.cache.filter(g => g.members.cache.has(userId));
                return guilds.size >= requirement.value;
            }

            case 'manual':
                return false; // Manual achievements must be granted manually

            default:
                return false;
        }
    }

    async unlockAchievement(userId, achievementId) {
        const db = getDatabase();
        const achievement = this.achievements[achievementId];

        // Add to user's achievements
        let userAchievements = db.data.achievements.get(userId) || [];
        userAchievements.push(achievementId);
        db.data.achievements.set(userId, userAchievements);

        // Award NRC
        if (achievement.reward.nrc) {
            db.updateNeuroCoinBalance(userId, achievement.reward.nrc, 'wallet');
            db.recordTransaction('system', userId, achievement.reward.nrc, 'achievement', {
                achievementId,
                achievementName: achievement.name
            });
        }

        db.saveData();

        // Notify user
        await this.notifyAchievementUnlock(userId, achievement);

        logger.info(`[Achievement] User ${userId} unlocked: ${achievementId}`);
    }

    async notifyAchievementUnlock(userId, achievement) {
        try {
            const user = await this.client.users.fetch(userId);
            if (!user) return;

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 Başarı Kilidi Açıldı!')
                .setDescription(`**${achievement.name}**\n${achievement.description}`)
                .addFields(
                    { name: '🎁 Ödül', value: `**${achievement.reward.nrc.toLocaleString()}** NRC`, inline: true },
                    { name: '🏅 Rozet', value: achievement.reward.badge || 'Yok', inline: true }
                )
                .setTimestamp();

            await user.send({ embeds: [embed] });
        } catch (error) {
            logger.debug(`[Achievement] Could not notify user ${userId}: ${error.message}`);
        }
    }

    async checkBalanceAchievements(userId, balance) {
        const balanceAchievements = ['first_1k', 'first_10k', 'first_100k', 'millionaire'];
        
        for (const achievementId of balanceAchievements) {
            await this.checkAchievement(userId, achievementId);
        }
    }

    async checkAllAchievements(userId) {
        const results = [];
        
        for (const achievementId of Object.keys(this.achievements)) {
            const unlocked = await this.checkAchievement(userId, achievementId);
            if (unlocked) {
                results.push(achievementId);
            }
        }

        return results;
    }

    getUserAchievements(userId) {
        const db = getDatabase();
        const userAchievementIds = db.data.achievements.get(userId) || [];
        
        return userAchievementIds.map(id => this.achievements[id]).filter(Boolean);
    }

    getAchievementProgress(userId, achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return null;

        const db = getDatabase();
        let current = 0;

        switch (achievement.requirement.type) {
            case 'balance':
                current = db.getNeuroCoinBalance(userId).total;
                break;
            case 'trades':
                const transactions = db.getUserTransactions(userId, 1000);
                current = transactions.filter(tx => 
                    tx.type === 'marketplace_purchase' || tx.type === 'marketplace_sale'
                ).length;
                break;
            case 'messages':
                current = db.data.userStats?.get(userId)?.messages || 0;
                break;
            case 'streak':
                current = db.data.dailyStreaks.get(userId)?.count || 0;
                break;
            default:
                current = 0;
        }

        return {
            current,
            required: achievement.requirement.value,
            percentage: Math.min((current / achievement.requirement.value) * 100, 100)
        };
    }

    // Manual achievement granting
    async grantAchievement(userId, achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return false;

        const db = getDatabase();
        const userAchievements = db.data.achievements.get(userId) || [];
        
        if (userAchievements.includes(achievementId)) {
            return false; // Already has it
        }

        await this.unlockAchievement(userId, achievementId);
        return true;
    }
}

module.exports = AchievementHandler;

