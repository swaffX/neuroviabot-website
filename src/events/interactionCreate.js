// ==========================================
// 🤖 NeuroViaBot - Interaction Create Event
// ==========================================

const { logger } = require('../utils/logger');
const config = require('../config.js');
const CommandQueueManager = require('../utils/commandQueueManager');

// Cooldown Map
const cooldowns = new Map();

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        // QuickSetup menü etkileşimlerini handle et
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('quicksetup_')) {
            const { handleSetupInteraction } = require('../commands/quicksetup.js');
            return await handleSetupInteraction(interaction);
        }

        // Shop purchase menü etkileşimlerini handle et
        if (interaction.isStringSelectMenu() && interaction.customId === 'shop_purchase') {
            const shopCommand = require('../commands/shop.js');
            const selectedItem = interaction.values[0];
            return await shopCommand.handlePurchase(interaction, selectedItem);
        }

        // Sadece slash komutları için
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        // Komut bulunamadıysa
        if (!command) {
            logger.error(`Komut bulunamadı: ${interaction.commandName}`);
            if (!interaction.replied && !interaction.deferred) {
                return await interaction.reply({
                    content: '❌ Bu komut bulunamadı veya geçici olarak devre dışı!',
                    flags: 64 // Ephemeral
                }).catch(() => {});
            }
            return;
        }

        // Cooldown kontrolü
        const cooldownResult = checkCooldown(interaction, command);
        if (cooldownResult) {
            if (!interaction.replied && !interaction.deferred) {
                return await interaction.reply({
                    content: cooldownResult,
                    flags: 64 // Ephemeral
                }).catch(() => {});
            }
            return;
        }

        // Feature kontrolü (guild-specific)
        const featureCheck = checkFeatureEnabled(command, interaction.guildId);
        if (!featureCheck.enabled) {
            if (!interaction.replied && !interaction.deferred) {
                return await interaction.reply({
                    content: `❌ ${featureCheck.message}`,
                    flags: 64 // Ephemeral
                }).catch(() => {});
            }
            return;
        }

        // Permission kontrolü (guild komutları için)
        if (interaction.guild && command.data.default_member_permissions) {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member.permissions.has(command.data.default_member_permissions)) {
                return await interaction.reply({
                    content: config.messages.noPermission,
                    flags: 64
                });
            }
        }

        // Performans izleme - try bloğundan ÖNCE tanımla
        const startTime = Date.now();

        try {
            // Security kontrolü
            if (client.security.isBlacklisted(interaction.user.id)) {
                return await interaction.reply({
                    content: '❌ Bu bot ile etkileşimde bulunma yetkiniz kısıtlanmıştır.',
                    flags: 64
                });
            }

            // Rate limit kontrolü
            if (client.security.isRateLimited(interaction.user.id, 'commands')) {
                return await interaction.reply({
                    content: '⏰ Çok hızlı komut kullanıyorsunuz! Lütfen biraz bekleyin.',
                    flags: 64
                });
            }
            
            // Komut kullanımını kuyruğa ekle
            if (interaction.guild) {
                const commandQueueManager = new CommandQueueManager(client);
                await commandQueueManager.queueCommandUsage(
                    interaction.guild.id,
                    command.data.name,
                    interaction.user.id
                );
            }
            
            // Komutu çalıştır
            await command.execute(interaction);
            
            // Track command usage
            if (command.usageCount !== undefined) {
                command.usageCount++;
            }
            
            const endTime = Date.now();
            const executionTime = endTime - startTime;

            // Analytics tracking (new handler)
            if (client.analyticsHandler && interaction.guild) {
                client.analyticsHandler.trackCommand(
                    interaction.guild.id,
                    interaction.commandName,
                    interaction.user.id
                );
            }

            // Legacy analytics tracking
            if (client.analytics) {
                client.analytics.trackCommand(
                    interaction.commandName,
                    interaction.user.id,
                    interaction.guild?.id || 'DM',
                    executionTime,
                    true
                );
            }

            // Başarılı komut logu
            logger.commandUsage(
                interaction.commandName, 
                interaction.user, 
                interaction.guild, 
                true
            );

            // Yavaş komutları logla (>3 saniye)
            if (executionTime > 3000) {
                logger.warn(`Yavaş komut: ${interaction.commandName} - ${executionTime}ms`, {
                    command: interaction.commandName,
                    user: interaction.user.tag,
                    guild: interaction.guild?.name,
                    executionTime
                });
            }

        } catch (error) {
            const errorId = Date.now().toString(36);
            const executionTime = Date.now() - startTime;
            
            // Analytics error tracking
            client.analytics.trackError(
                error.name || 'UnknownError',
                interaction.commandName,
                interaction.user.id,
                interaction.guild?.id || 'DM',
                error.message
            );

            client.analytics.trackCommand(
                interaction.commandName,
                interaction.user.id,
                interaction.guild?.id || 'DM',
                executionTime,
                false
            );
            
            // Hata logu
            logger.error(`Komut hatası (${errorId}): ${interaction.commandName}`, error, {
                command: interaction.commandName,
                user: interaction.user.tag,
                guild: interaction.guild?.name,
                errorId
            });

            // Başarısız komut logu
            logger.commandUsage(
                interaction.commandName, 
                interaction.user, 
                interaction.guild, 
                false
            );

            const errorMessage = {
                content: `❌ Komut çalıştırılırken bir hata oluştu!\n\`\`\`Hata ID: ${errorId}\`\`\``,
                flags: 64 // Ephemeral
            };

            try {
                // Check if interaction is still valid and not expired
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply(errorMessage).catch(() => {});
                } else if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(errorMessage).catch(() => {});
                }
            } catch (replyError) {
                // Silently fail if interaction expired (3 second timeout)
                logger.debug('Could not send error message (interaction expired)');
            }
        }
    }
};

// Cooldown kontrolü
function checkCooldown(interaction, command) {
    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Map());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const cooldownAmount = getCooldownAmount(command.data.name) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = Math.ceil((expirationTime - now) / 1000);
            return config.messages.cooldownMessage.replace('{time}', timeLeft);
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    return null;
}

// Cooldown süresi belirleme
function getCooldownAmount(commandName) {
    // Komut kategorisine göre cooldown
    if (['play', 'skip', 'pause', 'resume', 'stop', 'queue', 'nowplaying'].includes(commandName)) {
        return config.cooldowns.music;
    }
    if (['clear', 'ban', 'kick', 'mute', 'warn'].includes(commandName)) {
        return config.cooldowns.moderation;
    }
    if (['slots', 'coinflip', 'dice'].includes(commandName)) {
        return config.cooldowns.coinflip;
    }
    if (commandName === 'blackjack') {
        return config.cooldowns.blackjack;
    }
    if (commandName === 'daily') {
        return config.cooldowns.daily;
    }
    if (commandName === 'work') {
        return config.cooldowns.work;
    }

    return 3; // Default 3 saniye
}

// Feature kontrolü (guild-specific)
function checkFeatureEnabled(command, guildId) {
    const { getDatabase } = require('../database/simple-db');
    const db = getDatabase();
    const commandName = command.data.name;
    
    // Ekonomi komutları
    const economyCommands = ['balance', 'daily', 'work', 'shop', 'buy', 'inventory', 'slots', 'coinflip', 'blackjack'];
    if (economyCommands.includes(commandName)) {
        if (!db.isGuildFeatureEnabled(guildId, 'economy')) {
            return {
                enabled: false,
                message: 'Bu sunucuda ekonomi sistemi devre dışı!'
            };
        }
    }

    // Moderasyon komutları
    const moderationCommands = ['ban', 'kick', 'mute', 'warn', 'clear', 'backup'];
    if (moderationCommands.includes(commandName)) {
        if (!db.isGuildFeatureEnabled(guildId, 'moderation')) {
            return {
                enabled: false,
                message: 'Bu sunucuda moderasyon sistemi devre dışı!'
            };
        }
    }

    // Seviye komutları
    const levelingCommands = ['level', 'rank', 'leaderboard'];
    if (levelingCommands.includes(commandName)) {
        if (!db.isGuildFeatureEnabled(guildId, 'leveling')) {
            return {
                enabled: false,
                message: 'Bu sunucuda seviye sistemi devre dışı!'
            };
        }
    }

    // Ticket komutları
    const ticketCommands = ['ticket'];
    if (ticketCommands.includes(commandName)) {
        if (!db.isGuildFeatureEnabled(guildId, 'tickets')) {
            return {
                enabled: false,
                message: 'Bu sunucuda ticket sistemi devre dışı!'
            };
        }
    }

    // Çekiliş komutları
    const giveawayCommands = ['giveaway'];
    if (giveawayCommands.includes(commandName)) {
        if (!db.isGuildFeatureEnabled(guildId, 'giveaways')) {
            return {
                enabled: false,
                message: 'Bu sunucuda çekiliş sistemi devre dışı!'
            };
        }
    }

    return { enabled: true };
}

// Cooldown temizleme (memory leak önleme)
setInterval(() => {
    const now = Date.now();
    cooldowns.forEach((timestamps, commandName) => {
        timestamps.forEach((timestamp, userId) => {
            const cooldownAmount = getCooldownAmount(commandName) * 1000;
            if (now - timestamp > cooldownAmount) {
                timestamps.delete(userId);
            }
        });
    });
}, 300000); // Her 5 dakikada bir temizle
