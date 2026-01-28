// ==========================================
// 👑 Premium Check Middleware
// ==========================================
// Validates premium access for features

const { getPremiumHandler } = require('../handlers/premiumHandler');
const { logger } = require('../utils/logger');

class PremiumCheck {
    /**
     * Check if user has active premium
     * @param {string} userId - Discord user ID
     * @returns {boolean} - True if user has active premium
     */
    static hasActivePremium(userId) {
        const premiumHandler = getPremiumHandler();
        const premium = premiumHandler.getUserPremium(userId);
        return premium.active;
    }

    /**
     * Check if user has specific premium tier or higher
     * @param {string} userId - Discord user ID
     * @param {string} requiredTier - Required tier (bronze, silver, gold)
     * @returns {boolean}
     */
    static hasPremiumTier(userId, requiredTier) {
        const premiumHandler = getPremiumHandler();
        const premium = premiumHandler.getUserPremium(userId);

        if (!premium.active) return false;

        const tierHierarchy = {
            bronze: 1,
            silver: 2,
            gold: 3
        };

        const userTierLevel = tierHierarchy[premium.plan] || 0;
        const requiredTierLevel = tierHierarchy[requiredTier] || 99;

        return userTierLevel >= requiredTierLevel;
    }

    /**
     * Get user's reward multiplier
     * @param {string} userId - Discord user ID
     * @param {string} rewardType - Reward type (daily, work, xp)
     * @returns {number} - Multiplier value
     */
    static getRewardMultiplier(userId, rewardType = 'daily') {
        const premiumHandler = getPremiumHandler();
        return premiumHandler.getRewardMultiplier(userId, rewardType);
    }

    /**
     * Get marketplace fee discount
     * @param {string} userId - Discord user ID
     * @returns {number} - Discount percentage (0-1)
     */
    static getMarketplaceFeeDiscount(userId) {
        const premiumHandler = getPremiumHandler();
        return premiumHandler.getMarketplaceFeeDiscount(userId);
    }

    /**
     * Calculate premium-adjusted reward
     * @param {string} userId - Discord user ID
     * @param {number} baseAmount - Base reward amount
     * @param {string} rewardType - Reward type
     * @returns {number} - Adjusted amount
     */
    static calculatePremiumReward(userId, baseAmount, rewardType = 'daily') {
        const multiplier = this.getRewardMultiplier(userId, rewardType);
        return Math.floor(baseAmount * multiplier);
    }

    /**
     * Calculate marketplace fee with premium discount
     * @param {string} userId - Discord user ID
     * @param {number} price - Item price
     * @returns {object} - { fee, discount, netAmount }
     */
    static calculateMarketplaceFee(userId, price) {
        const baseFee = price * 0.05; // 5% base fee
        const discount = this.getMarketplaceFeeDiscount(userId);
        const fee = baseFee * (1 - discount);
        const netAmount = price - fee;

        return {
            fee: Math.floor(fee),
            discount: Math.floor(baseFee * discount),
            netAmount: Math.floor(netAmount),
            discountPercentage: discount * 100
        };
    }

    /**
     * Middleware for Discord commands requiring premium
     * @param {string} requiredTier - Required premium tier
     * @returns {Function} - Middleware function
     */
    static requirePremium(requiredTier = 'bronze') {
        return async (interaction, next) => {
            const hasPremium = this.hasPremiumTier(interaction.user.id, requiredTier);

            if (!hasPremium) {
                const premiumHandler = getPremiumHandler();
                const plan = premiumHandler.getPlan(requiredTier);

                const errorEmbed = {
                    color: 0x8B5CF6,
                    title: '👑 Premium Özellik',
                    description: `Bu özelliği kullanmak için **${plan.emoji} ${plan.name}** veya üstü gereklidir!`,
                    fields: [
                        {
                            name: '💡 Premium Satın Al',
                            value: '`/nrc premium planlar` komutu ile tüm planları görüntüleyin!'
                        }
                    ],
                    timestamp: new Date().toISOString()
                };

                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // User has premium, continue
            if (next) return next();
        };
    }

    /**
     * Check premium and warn if expiring soon (within 3 days)
     * @param {string} userId - Discord user ID
     * @returns {object|null} - Warning message or null
     */
    static checkExpiryWarning(userId) {
        const premiumHandler = getPremiumHandler();
        const premium = premiumHandler.getUserPremium(userId);

        if (!premium.active) return null;

        if (premium.daysRemaining <= 3) {
            return {
                warning: true,
                daysRemaining: premium.daysRemaining,
                plan: premium.plan,
                autoRenew: premium.autoRenew,
                message: premium.autoRenew 
                    ? `⚠️ Premium aboneliğiniz ${premium.daysRemaining} gün içinde otomatik yenilenecek!`
                    : `⚠️ Premium aboneliğiniz ${premium.daysRemaining} gün içinde sona erecek! Otomatik yenileme kapalı.`
            };
        }

        return null;
    }

    /**
     * Get premium badge emoji for user
     * @param {string} userId - Discord user ID
     * @returns {string} - Badge emoji or empty string
     */
    static getPremiumBadge(userId) {
        const premiumHandler = getPremiumHandler();
        const premium = premiumHandler.getUserPremium(userId);

        if (!premium.active) return '';

        const badges = {
            bronze: '🥉',
            silver: '🥈',
            gold: '🥇'
        };

        return badges[premium.plan] || '👑';
    }

    /**
     * Log premium feature usage
     * @param {string} userId - Discord user ID
     * @param {string} feature - Feature name
     */
    static logPremiumUsage(userId, feature) {
        logger.info(`[PremiumCheck] Premium feature used: ${feature} by ${userId}`);
    }
}

module.exports = PremiumCheck;

