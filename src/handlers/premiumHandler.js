// ==========================================
// 👑 Premium Handler
// ==========================================
// Manages NRC-based premium subscriptions and features

const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class PremiumHandler {
    constructor() {
        this.plans = {
            bronze: {
                id: 'bronze',
                name: 'Bronze Premium',
                price: 5000,
                duration: 30, // days
                emoji: '🥉',
                color: '#CD7F32',
                features: [
                    '2x daily rewards',
                    'Özel renk',
                    'Bronze rozeti',
                    'Premium badge in profile'
                ],
                multipliers: {
                    daily: 2,
                    work: 2,
                    xp: 1.5
                }
            },
            silver: {
                id: 'silver',
                name: 'Silver Premium',
                price: 15000,
                duration: 30,
                emoji: '🥈',
                color: '#C0C0C0',
                features: [
                    '3x daily rewards',
                    'VIP rozeti',
                    'Özel prefix',
                    'Marketplace fee discount (50%)',
                    'Priority support',
                    'Custom embed colors'
                ],
                multipliers: {
                    daily: 3,
                    work: 3,
                    xp: 2
                },
                marketplaceFeeDiscount: 0.5 // 50% off
            },
            gold: {
                id: 'gold',
                name: 'Gold Premium',
                price: 50000,
                duration: 30,
                emoji: '🥇',
                color: '#FFD700',
                features: [
                    '5x tüm ödüller',
                    'Tüm özellikler',
                    'Priority support',
                    'Özel NFT airdrop\'lar',
                    'No marketplace fees',
                    'Exclusive roles',
                    'Custom commands',
                    'Extended bank capacity (+100%)'
                ],
                multipliers: {
                    daily: 5,
                    work: 5,
                    xp: 3
                },
                marketplaceFeeDiscount: 1.0, // 100% off (no fees)
                bankCapacityBonus: 1.0 // +100%
            }
        };
    }

    // Get all premium plans
    getAllPlans() {
        return Object.values(this.plans);
    }

    // Get specific plan
    getPlan(planId) {
        return this.plans[planId] || null;
    }

    // Get user's premium status
    getUserPremium(userId) {
        const db = getDatabase();
        
        if (!db.data.userPremium.has(userId)) {
            return {
                active: false,
                plan: null,
                expiresAt: null,
                autoRenew: false,
                features: []
            };
        }

        const premium = db.data.userPremium.get(userId);
        const now = new Date();
        const expiryDate = new Date(premium.expiresAt);

        // Check if expired
        if (expiryDate < now) {
            return {
                active: false,
                plan: premium.plan,
                expiresAt: premium.expiresAt,
                expired: true,
                autoRenew: premium.autoRenew,
                features: []
            };
        }

        const plan = this.getPlan(premium.plan);

        return {
            active: true,
            plan: premium.plan,
            planData: plan,
            expiresAt: premium.expiresAt,
            daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
            autoRenew: premium.autoRenew,
            features: plan?.features || premium.features || []
        };
    }

    // Purchase premium
    async purchasePremium(userId, planId) {
        const db = getDatabase();
        const plan = this.getPlan(planId);

        if (!plan) {
            throw new Error('Geçersiz premium planı!');
        }

        // Check balance
        const balance = db.getNeuroCoinBalance(userId);
        if (balance.wallet < plan.price) {
            throw new Error(`Yetersiz NRC! Gerekli: ${plan.price.toLocaleString()} NRC, Mevcut: ${balance.wallet.toLocaleString()} NRC`);
        }

        // Check if already has premium
        const currentPremium = this.getUserPremium(userId);
        if (currentPremium.active) {
            throw new Error(`Zaten aktif premium aboneliğiniz var! (${currentPremium.plan.toUpperCase()})\nBitişten sonra yeni plan satın alabilirsiniz.`);
        }

        // Deduct NRC
        db.addNeuroCoin(userId, -plan.price, 'premium_purchase', {
            plan: planId,
            duration: plan.duration
        });

        // Activate premium
        const startDate = new Date();
        const expiresAt = new Date(startDate.getTime() + (plan.duration * 24 * 60 * 60 * 1000));

        db.data.userPremium.set(userId, {
            plan: planId,
            startDate: startDate.toISOString(),
            expiresAt: expiresAt.toISOString(),
            autoRenew: false,
            features: plan.features,
            purchaseCount: (db.data.userPremium.get(userId)?.purchaseCount || 0) + 1
        });

        db.saveData();

        // Track activity
        try {
            const { trackPremiumActivation } = require('../utils/activityTracker');
            const client = global.discordClient;
            let username = `User${userId.substring(0, 8)}`;
            let serverId = null;
            let serverName = null;

            if (client) {
                try {
                    const user = await client.users.fetch(userId).catch(() => null);
                    if (user) username = user.username;
                } catch (e) {}
            }

            await trackPremiumActivation({
                userId,
                username,
                serverId,
                serverName,
                tier: planId,
                duration: plan.duration,
                cost: plan.price
            });
        } catch (error) {
            logger.debug('[PremiumHandler] Activity tracking failed:', error);
        }

        logger.info(`[PremiumHandler] ${userId} purchased ${planId} premium for ${plan.price} NRC`);

        return {
            success: true,
            plan,
            expiresAt: expiresAt.toISOString(),
            newBalance: db.getNeuroCoinBalance(userId)
        };
    }

    // Cancel premium (set autoRenew to false)
    async cancelPremium(userId) {
        const db = getDatabase();
        const premium = this.getUserPremium(userId);

        if (!premium.active) {
            throw new Error('Aktif premium aboneliğiniz yok!');
        }

        const premiumData = db.data.userPremium.get(userId);
        premiumData.autoRenew = false;
        db.data.userPremium.set(userId, premiumData);
        db.saveData();

        logger.info(`[PremiumHandler] ${userId} canceled premium auto-renewal`);

        return {
            success: true,
            expiresAt: premiumData.expiresAt
        };
    }

    // Enable auto-renew
    async enableAutoRenew(userId) {
        const db = getDatabase();
        const premium = this.getUserPremium(userId);

        if (!premium.active) {
            throw new Error('Aktif premium aboneliğiniz yok!');
        }

        const premiumData = db.data.userPremium.get(userId);
        premiumData.autoRenew = true;
        db.data.userPremium.set(userId, premiumData);
        db.saveData();

        logger.info(`[PremiumHandler] ${userId} enabled premium auto-renewal`);

        return { success: true };
    }

    // Process auto-renewals (called by cron job)
    async processAutoRenewals() {
        const db = getDatabase();
        const now = new Date();
        let renewedCount = 0;
        let failedCount = 0;

        for (const [userId, premiumData] of db.data.userPremium.entries()) {
            if (!premiumData.autoRenew) continue;

            const expiryDate = new Date(premiumData.expiresAt);
            
            // Check if expiring within 24 hours
            const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
            
            if (hoursUntilExpiry > 0 && hoursUntilExpiry <= 24) {
                const plan = this.getPlan(premiumData.plan);
                if (!plan) {
                    failedCount++;
                    continue;
                }

                // Check balance
                const balance = db.getNeuroCoinBalance(userId);
                if (balance.wallet >= plan.price) {
                    try {
                        // Renew
                        db.addNeuroCoin(userId, -plan.price, 'premium_renewal', {
                            plan: premiumData.plan
                        });

                        const newExpiresAt = new Date(expiryDate.getTime() + (plan.duration * 24 * 60 * 60 * 1000));
                        premiumData.expiresAt = newExpiresAt.toISOString();
                        db.data.userPremium.set(userId, premiumData);

                        renewedCount++;
                        logger.info(`[PremiumHandler] Auto-renewed ${premiumData.plan} for ${userId}`);
                    } catch (error) {
                        logger.error(`[PremiumHandler] Failed to auto-renew for ${userId}:`, error);
                        failedCount++;
                    }
                } else {
                    // Insufficient balance, disable auto-renew
                    premiumData.autoRenew = false;
                    db.data.userPremium.set(userId, premiumData);
                    failedCount++;
                    logger.warn(`[PremiumHandler] Auto-renew failed for ${userId}: insufficient balance`);
                }
            }
        }

        db.saveData();

        return { renewedCount, failedCount };
    }

    // Get reward multiplier for user
    getRewardMultiplier(userId, rewardType = 'daily') {
        const premium = this.getUserPremium(userId);
        
        if (!premium.active || !premium.planData) {
            return 1; // No premium, 1x multiplier
        }

        return premium.planData.multipliers?.[rewardType] || 1;
    }

    // Get marketplace fee discount
    getMarketplaceFeeDiscount(userId) {
        const premium = this.getUserPremium(userId);
        
        if (!premium.active || !premium.planData) {
            return 0; // No discount
        }

        return premium.planData.marketplaceFeeDiscount || 0;
    }

    // Create premium plans embed
    createPlansEmbed() {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('👑 Premium Planları')
            .setDescription('NRC ile premium özelliklere erişin! Tüm ödemeler NeuroCoin ile yapılır.')
            .setTimestamp();

        for (const plan of Object.values(this.plans)) {
            const featuresText = plan.features.map(f => `✓ ${f}`).join('\n');
            
            embed.addFields({
                name: `${plan.emoji} ${plan.name}`,
                value: `**${plan.price.toLocaleString()} NRC** / ${plan.duration} gün\n\n${featuresText}`,
                inline: false
            });
        }

        embed.setFooter({ text: 'Satın almak için: /nrc premium satın-al' });

        return embed;
    }

    // Create premium status embed
    createStatusEmbed(userId, username) {
        const premium = this.getUserPremium(userId);

        const embed = new EmbedBuilder()
            .setTitle(`👑 ${username} - Premium Durumu`)
            .setTimestamp();

        if (!premium.active) {
            embed.setColor('#95A5A6')
                .setDescription('❌ Aktif premium aboneliğiniz yok.')
                .addFields({
                    name: '💡 Premium Satın Al',
                    value: '`/nrc premium planlar` komutu ile tüm planları görüntüleyebilirsiniz!',
                    inline: false
                });

            if (premium.expired) {
                embed.addFields({
                    name: '⏱️ Son Abonelik',
                    value: `${premium.plan?.toUpperCase() || 'Bilinmiyor'}\nBitiş: <t:${Math.floor(new Date(premium.expiresAt).getTime() / 1000)}:R>`,
                    inline: true
                });
            }

            return embed;
        }

        const plan = premium.planData;
        embed.setColor(plan.color)
            .setDescription(`${plan.emoji} **${plan.name}** - Aktif!`);

        // Status info
        embed.addFields(
            { 
                name: '⏳ Kalan Süre', 
                value: `**${premium.daysRemaining}** gün\nBitiş: <t:${Math.floor(new Date(premium.expiresAt).getTime() / 1000)}:R>`, 
                inline: true 
            },
            { 
                name: '🔄 Otomatik Yenileme', 
                value: premium.autoRenew ? '✅ Aktif' : '❌ Kapalı', 
                inline: true 
            },
            { 
                name: '💰 Yenileme Fiyatı', 
                value: `**${plan.price.toLocaleString()}** NRC`, 
                inline: true 
            }
        );

        // Features
        const featuresText = premium.features.map(f => `✓ ${f}`).join('\n');
        embed.addFields({
            name: '✨ Özellikler',
            value: featuresText,
            inline: false
        });

        // Multipliers
        const multipliersText = Object.entries(plan.multipliers)
            .map(([key, value]) => `${key}: **${value}x**`)
            .join('\n');

        embed.addFields({
            name: '📊 Çarpanlar',
            value: multipliersText,
            inline: true
        });

        embed.setFooter({ text: 'Premium aboneliğiniz için teşekkürler!' });

        return embed;
    }
}

// Singleton instance
let premiumHandlerInstance = null;

function getPremiumHandler() {
    if (!premiumHandlerInstance) {
        premiumHandlerInstance = new PremiumHandler();
    }
    return premiumHandlerInstance;
}

module.exports = { PremiumHandler, getPremiumHandler };

