const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class TradingHandler {
    constructor(client) {
        this.client = client;
        this.db = getDatabase();
        this.activeTrades = new Map(); // tradeId -> trade data
        this.tradeTimeouts = new Map(); // tradeId -> timeout
        
        this.setupListeners();
        logger.info('✅ Trading Handler initialized');
    }

    setupListeners() {
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            
            if (interaction.customId.startsWith('trade_')) {
                await this.handleTradeButton(interaction);
            }
        });
    }

    async createTrade(senderId, receiverId, amount, guildId, expiresIn = 300000) {
        // Validate sender balance
        const senderBalance = this.db.getNRCBalance(senderId);
        if (senderBalance < amount) {
            return { success: false, error: 'Yetersiz bakiye' };
        }

        // Create trade ID
        const tradeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create trade object
        const trade = {
            id: tradeId,
            senderId,
            receiverId,
            amount,
            guildId,
            status: 'pending',
            createdAt: Date.now(),
            expiresAt: Date.now() + expiresIn
        };

        // Store trade
        this.activeTrades.set(tradeId, trade);

        // Set expiration timeout
        const timeout = setTimeout(() => {
            this.expireTrade(tradeId);
        }, expiresIn);
        this.tradeTimeouts.set(tradeId, timeout);

        // Log trade creation
        logger.info(`[Trading] Trade created: ${senderId} -> ${receiverId} (${amount} NRC)`);

        return { success: true, trade };
    }

    async acceptTrade(tradeId, userId) {
        const trade = this.activeTrades.get(tradeId);
        
        if (!trade) {
            return { success: false, error: 'Trade bulunamadı veya süresi doldu' };
        }

        if (trade.receiverId !== userId) {
            return { success: false, error: 'Bu trade size ait değil' };
        }

        if (trade.status !== 'pending') {
            return { success: false, error: 'Bu trade zaten işleme alındı' };
        }

        // Re-validate sender balance
        const senderBalance = this.db.getNRCBalance(trade.senderId);
        if (senderBalance < trade.amount) {
            this.cancelTrade(tradeId);
            return { success: false, error: 'Gönderenin bakiyesi yetersiz' };
        }

        // Execute trade (escrow release)
        this.db.updateNRCBalance(trade.senderId, -trade.amount, 'trade_sent');
        this.db.updateNRCBalance(trade.receiverId, trade.amount, 'trade_received');

        // Update trade status
        trade.status = 'completed';
        trade.completedAt = Date.now();

        // Save to trade history
        this.saveTradeHistory(trade);

        // Update reputations
        this.updateReputation(trade.senderId, 1);
        this.updateReputation(trade.receiverId, 1);

        // Clean up
        this.cleanupTrade(tradeId);

        logger.info(`[Trading] Trade completed: ${tradeId}`);

        return { success: true, trade };
    }

    async declineTrade(tradeId, userId) {
        const trade = this.activeTrades.get(tradeId);
        
        if (!trade) {
            return { success: false, error: 'Trade bulunamadı' };
        }

        if (trade.receiverId !== userId) {
            return { success: false, error: 'Bu trade size ait değil' };
        }

        trade.status = 'declined';
        this.cleanupTrade(tradeId);

        logger.info(`[Trading] Trade declined: ${tradeId}`);

        return { success: true };
    }

    async cancelTrade(tradeId, userId = null) {
        const trade = this.activeTrades.get(tradeId);
        
        if (!trade) {
            return { success: false, error: 'Trade bulunamadı' };
        }

        if (userId && trade.senderId !== userId) {
            return { success: false, error: 'Bu trade size ait değil' };
        }

        trade.status = 'cancelled';
        this.cleanupTrade(tradeId);

        logger.info(`[Trading] Trade cancelled: ${tradeId}`);

        return { success: true };
    }

    expireTrade(tradeId) {
        const trade = this.activeTrades.get(tradeId);
        if (trade && trade.status === 'pending') {
            trade.status = 'expired';
            this.cleanupTrade(tradeId);
            logger.info(`[Trading] Trade expired: ${tradeId}`);
        }
    }

    cleanupTrade(tradeId) {
        // Clear timeout
        const timeout = this.tradeTimeouts.get(tradeId);
        if (timeout) {
            clearTimeout(timeout);
            this.tradeTimeouts.delete(tradeId);
        }

        // Remove from active trades after delay
        setTimeout(() => {
            this.activeTrades.delete(tradeId);
        }, 60000); // Keep for 1 minute for status checks
    }

    saveTradeHistory(trade) {
        const settings = this.db.getGuildSettings(trade.guildId) || {};
        
        if (!settings.trade_history) {
            settings.trade_history = [];
        }

        settings.trade_history.push({
            id: trade.id,
            senderId: trade.senderId,
            receiverId: trade.receiverId,
            amount: trade.amount,
            createdAt: trade.createdAt,
            completedAt: trade.completedAt,
            status: trade.status
        });

        // Keep only last 1000 trades
        if (settings.trade_history.length > 1000) {
            settings.trade_history = settings.trade_history.slice(-1000);
        }

        this.db.setGuildSettings(trade.guildId, settings);
    }

    updateReputation(userId, points) {
        const settings = this.db.getUserSettings(userId) || {};
        
        if (!settings.trade_reputation) {
            settings.trade_reputation = {
                score: 0,
                completed: 0,
                cancelled: 0
            };
        }

        settings.trade_reputation.score += points;
        settings.trade_reputation.completed += 1;

        this.db.setUserSettings(userId, settings);
    }

    getTradeHistory(userId, limit = 10) {
        const settings = this.db.getUserSettings(userId) || {};
        const allTrades = [];

        // Get from all guilds (this is simplified, in production you'd query differently)
        const guilds = this.db.getAllGuildSettings();
        
        for (const [guildId, guildSettings] of Object.entries(guilds)) {
            const trades = guildSettings.trade_history || [];
            const userTrades = trades.filter(t => 
                t.senderId === userId || t.receiverId === userId
            );
            allTrades.push(...userTrades);
        }

        // Sort by date and limit
        return allTrades
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    getReputation(userId) {
        const settings = this.db.getUserSettings(userId) || {};
        return settings.trade_reputation || {
            score: 0,
            completed: 0,
            cancelled: 0
        };
    }

    async handleTradeButton(interaction) {
        const [, action, tradeId] = interaction.customId.split('_');

        if (action === 'accept') {
            const result = await this.acceptTrade(tradeId, interaction.user.id);
            
            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#10b981')
                    .setTitle('✅ Trade Kabul Edildi')
                    .setDescription(`${result.trade.amount} NRC başarıyla transfer edildi!`)
                    .setTimestamp();

                await interaction.update({ embeds: [embed], components: [] });
            } else {
                await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
            }
        } else if (action === 'decline') {
            const result = await this.declineTrade(tradeId, interaction.user.id);
            
            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#6b7280')
                    .setTitle('Trade Reddedildi')
                    .setDescription('Trade teklifi reddedildi.')
                    .setTimestamp();

                await interaction.update({ embeds: [embed], components: [] });
            } else {
                await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
            }
        }
    }

    createTradeEmbed(trade, sender, receiver) {
        const expiresIn = Math.floor((trade.expiresAt - Date.now()) / 1000);

        const embed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle('💱 NRC Trade Teklifi')
            .setDescription(`${sender.tag} sizinle NRC trade yapmak istiyor!`)
            .addFields(
                { name: 'Gönderen', value: sender.tag, inline: true },
                { name: 'Alan', value: receiver.tag, inline: true },
                { name: 'Miktar', value: `${trade.amount} NRC`, inline: true },
                { name: 'Süre', value: `${expiresIn} saniye`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Kabul etmek veya reddetmek için butona tıklayın' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`trade_accept_${trade.id}`)
                    .setLabel('✅ Kabul Et')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`trade_decline_${trade.id}`)
                    .setLabel('❌ Reddet')
                    .setStyle(ButtonStyle.Danger)
            );

        return { embeds: [embed], components: [row] };
    }
}

module.exports = TradingHandler;

