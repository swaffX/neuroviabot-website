// ==========================================
// 🤖 NeuroViaBot - Message Create Event
// ==========================================

const { logger } = require('../utils/logger');
const { getOrCreateUser, getOrCreateGuild, getOrCreateGuildMember } = require('../models/index');
const { getQuestProgressTracker } = require('../utils/questProgressTracker');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message, client) {
        try {
            // Bot mesajlarını ve DM'leri görmezden gel
            if (message.author.bot || !message.guild) return;

            // Analytics message tracking
            client.analytics.trackMessage(
                message.author.id,
                message.guild.id,
                message.channel.id,
                message.content.length,
                message.attachments.size > 0
            );

            // Spam detection
            const spamResult = client.security.detectSpam(message);
            if (spamResult.isSpam) {
                logger.warn(`Spam detected from ${message.author.tag}`, {
                    guild: message.guild.name,
                    score: spamResult.score,
                    reason: spamResult.reason
                });
                
                // Optional: Auto-delete spam messages
                // await message.delete().catch(() => {});
                return;
            }

            // Database'e kullanıcı/guild bilgilerini kaydet
            await saveToDatabase(message);

            // Auto-Moderation kontrolü
            const shouldContinue = await handleAutoModeration(message);
            if (!shouldContinue) return; // Mesaj otomatik moderasyon tarafından silinmişse dur

            // Custom command kontrolü
            await handleCustomCommands(message);

            // XP/Leveling sistemi (levelingHandler kullanarak) - guild-specific
            if (client.levelingHandler) {
                const { getDatabase } = require('../database/simple-db');
                const db = getDatabase();
                
                // Guild-specific leveling kontrolü
                if (db.isGuildFeatureEnabled(message.guild.id, 'leveling')) {
                    await client.levelingHandler.handleMessageXp(message);
                }
            }

            // Quest progress tracking
            const questTracker = getQuestProgressTracker();
            await questTracker.trackMessage(message.author.id, message.guild.id);

        } catch (error) {
            logger.error('messageCreate event hatası', error, {
                guild: message.guild?.name,
                user: message.author.tag,
                messageId: message.id
            });
        }
    }
};

// Auto-Moderation handler
async function handleAutoModeration(message) {
    try {
        const { getDatabase } = require('../database/simple-db');
        const { EmbedBuilder } = require('discord.js');
        const db = getDatabase();
        
        // Sunucu ayarlarını kontrol et
        const settings = db.getGuildSettings(message.guild.id);
        
        // Auto-mod aktif mi kontrol et
        if (!settings.moderation?.enabled || !settings.moderation?.autoMod) return true;
        
        const content = message.content.toLowerCase();
        let shouldDelete = false;
        let reason = '';
        
        // Davet linki kontrolü
        if (settings.moderation?.antiInvite && (content.includes('discord.gg/') || content.includes('discord.com/invite/'))) {
            shouldDelete = true;
            reason = 'Discord davet linki paylaşımı yasak';
        }
        
        // Link kontrolü
        if (settings.moderation?.antiLink && (content.includes('http://') || content.includes('https://') || content.includes('www.'))) {
            shouldDelete = true;
            reason = 'Link paylaşımı yasak';
        }
        
        // Kötü kelime kontrolü (bannedWords kullan)
        if (settings.moderation?.bannedWords && settings.moderation.bannedWords.length > 0) {
            const badWordsList = typeof settings.moderation.bannedWords === 'string' 
                ? settings.moderation.bannedWords.split(',').map(w => w.trim().toLowerCase())
                : settings.moderation.bannedWords;
            
            for (const badWord of badWordsList) {
                if (content.includes(badWord)) {
                    shouldDelete = true;
                    reason = 'Yasaklı kelime kullanımı';
                    break;
                }
            }
        }
        
        // Spam kontrolü
        if (settings.moderation?.spamProtection) {
            const userId = message.author.id;
            if (!message.client.spamTracker) {
                message.client.spamTracker = new Map();
            }
            
            const now = Date.now();
            const userSpam = message.client.spamTracker.get(userId) || [];
            
            // Son 5 saniyedeki mesajları filtrele
            const recentMessages = userSpam.filter(timestamp => now - timestamp < 5000);
            recentMessages.push(now);
            
            message.client.spamTracker.set(userId, recentMessages);
            
            // 5 saniyede 5'ten fazla mesaj
            if (recentMessages.length > 5) {
                shouldDelete = true;
                reason = 'Spam tespiti';
            }
        }
        
        // Mesajı sil ve uyarı ver
        if (shouldDelete) {
            try {
                await message.delete();
                
                // Kullanıcıya uyarı gönder
                const warningEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('⚠️ Otomatik Moderasyon')
                    .setDescription(`${message.author}, mesajınız otomatik moderasyon sistemi tarafından silindi.`)
                    .addFields({ name: 'Sebep', value: reason })
                    .setTimestamp();
                
                const warningMessage = await message.channel.send({ embeds: [warningEmbed] });
                
                // 5 saniye sonra uyarı mesajını da sil
                setTimeout(() => {
                    warningMessage.delete().catch(() => {});
                }, 5000);
                
                // Mod log kanalına bildir
                if (settings.moderation?.logChannelId) {
                    const modLogChannel = message.guild.channels.cache.get(settings.moderation.logChannelId);
                    if (modLogChannel) {
                        const modLogEmbed = new EmbedBuilder()
                            .setColor('#ff4444')
                            .setTitle('🛡️ Auto-Mod: Mesaj Silindi')
                            .addFields(
                                { name: '👤 Kullanıcı', value: `${message.author.tag} (${message.author.id})`, inline: true },
                                { name: '📢 Kanal', value: `${message.channel}`, inline: true },
                                { name: '📝 İçerik', value: message.content.substring(0, 1024) || '*İçerik yok*' },
                                { name: '⚠️ Sebep', value: reason }
                            )
                            .setTimestamp();
                        
                        await modLogChannel.send({ embeds: [modLogEmbed] });
                    }
                }
                
                logger.info(`[Auto-Mod] Message deleted from ${message.author.tag}: ${reason}`);
                return false; // Mesaj silindi, işleme devam etme
            } catch (error) {
                console.error('[Auto-Mod] Error:', error.message);
                return true;
            }
        }
        
        return true; // Mesaj temiz, işleme devam et
        
    } catch (error) {
        console.error('[Auto-Mod] Error:', error.message);
        return true;
    }
}

// Database'e kaydetme
async function saveToDatabase(message) {
    try {
        // User kaydı
        await getOrCreateUser(message.author.id, {
            username: message.author.username,
            discriminator: message.author.discriminator,
            globalName: message.author.globalName,
            avatar: message.author.avatar
        });

        // Guild kaydı
        await getOrCreateGuild(message.guild.id, {
            name: message.guild.name
        });

        // GuildMember kaydı
        await getOrCreateGuildMember(message.author.id, message.guild.id, {
            nickname: message.member.nickname
        });

    } catch (error) {
        logger.debug('Database kayıt hatası (kritik değil)', error);
    }
}

// Custom command kontrolü
async function handleCustomCommands(message) {
    try {
        const { CustomCommand } = require('../models/index');
        
        // Basit prefix kontrolü (! ile başlayan mesajlar)
        if (!message.content.startsWith('!')) return;
        
        const commandName = message.content.slice(1).split(' ')[0].toLowerCase();
        
        // Custom command var mı kontrol et
        const customCommand = await CustomCommand.findByName(message.guild.id, commandName);
        
        if (customCommand) {
            // Usage count artır
            await CustomCommand.update(customCommand.id, {
                usageCount: customCommand.usageCount + 1
            });
            
            // Response gönder
            let response = customCommand.response;
            
            // Variable replacement
            response = response.replace(/{user}/g, `<@${message.author.id}>`);
            response = response.replace(/{server}/g, message.guild.name);
            response = response.replace(/{memberCount}/g, message.guild.memberCount);
            response = response.replace(/{channel}/g, `<#${message.channel.id}>`);
            
            await message.reply(response);
            
            logger.info(`Custom command executed: ${commandName}`, {
                guild: message.guild.name,
                user: message.author.tag
            });
        }
        
    } catch (error) {
        logger.debug('Custom command handling hatası', error);
    }
}

// Leveling sistemi artık levelingHandler.js tarafından yönetiliyor
// Bu fonksiyonlar kaldırıldı ve client.levelingHandler.handleMessageXp() kullanılıyor
