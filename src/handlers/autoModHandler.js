const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');

class AutoModHandler {
    constructor(client) {
        this.client = client;
        this.db = getDatabase();
        this.userMessageCache = new Map(); // userId -> [{content, timestamp}]
        this.violationCache = new Map(); // userId -> {count, lastViolation}
        
        this.setupListeners();
        logger.info('✅ Auto-Moderation Handler initialized');
    }

    setupListeners() {
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot || !message.guild) return;
            await this.checkMessage(message);
        });
    }

    async checkMessage(message) {
        try {
            const guildId = message.guild.id;
            const settings = this.getAutoModSettings(guildId);
            
            if (!settings.enabled) return;

            // Skip if user has moderator permissions
            if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

            // Check for spam
            if (settings.antiSpam.enabled) {
                const isSpam = await this.checkSpam(message);
                if (isSpam) {
                    await this.handleViolation(message, 'spam', settings);
                    return;
                }
            }

            // Check for links
            if (settings.linkFilter.enabled) {
                const hasInvalidLink = this.checkLinks(message.content, settings.linkFilter);
                if (hasInvalidLink) {
                    await this.handleViolation(message, 'link', settings);
                    return;
                }
            }

            // Check for blocked words
            if (settings.wordFilter.enabled) {
                const hasBlockedWord = this.checkWords(message.content, settings.wordFilter.blockedWords);
                if (hasBlockedWord) {
                    await this.handleViolation(message, 'word', settings);
                    return;
                }
            }

            // Check for excessive mentions
            if (settings.mentionSpam.enabled) {
                const hasMentionSpam = this.checkMentions(message, settings.mentionSpam.max);
                if (hasMentionSpam) {
                    await this.handleViolation(message, 'mention_spam', settings);
                    return;
                }
            }

        } catch (error) {
            logger.error('[AutoMod] Error checking message:', error);
        }
    }

    async checkSpam(message) {
        const userId = message.author.id;
        const now = Date.now();
        
        if (!this.userMessageCache.has(userId)) {
            this.userMessageCache.set(userId, []);
        }

        const userMessages = this.userMessageCache.get(userId);
        
        // Add current message
        userMessages.push({
            content: message.content,
            timestamp: now
        });

        // Clean old messages (older than 10 seconds)
        const recentMessages = userMessages.filter(msg => now - msg.timestamp < 10000);
        this.userMessageCache.set(userId, recentMessages);

        // Check for rapid messaging (5+ messages in 5 seconds)
        const veryRecentMessages = recentMessages.filter(msg => now - msg.timestamp < 5000);
        if (veryRecentMessages.length >= 5) {
            return true;
        }

        // Check for duplicate messages (3+ identical in 30 seconds)
        const last30s = recentMessages.filter(msg => now - msg.timestamp < 30000);
        const duplicates = last30s.filter(msg => msg.content === message.content);
        if (duplicates.length >= 3) {
            return true;
        }

        return false;
    }

    checkLinks(content, linkFilter) {
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const links = content.match(urlRegex);
        
        if (!links) return false;

        // Whitelist check
        if (linkFilter.whitelist && linkFilter.whitelist.length > 0) {
            for (const link of links) {
                const isWhitelisted = linkFilter.whitelist.some(domain => 
                    link.toLowerCase().includes(domain.toLowerCase())
                );
                if (!isWhitelisted) return true;
            }
            return false;
        }

        // Blacklist check
        if (linkFilter.blacklist && linkFilter.blacklist.length > 0) {
            for (const link of links) {
                const isBlacklisted = linkFilter.blacklist.some(domain => 
                    link.toLowerCase().includes(domain.toLowerCase())
                );
                if (isBlacklisted) return true;
            }
        }

        return false;
    }

    checkWords(content, blockedWords) {
        if (!blockedWords || blockedWords.length === 0) return false;

        const lowerContent = content.toLowerCase();
        
        return blockedWords.some(word => {
            const lowerWord = word.toLowerCase();
            // Check whole word match with word boundaries
            const regex = new RegExp(`\\b${lowerWord}\\b`, 'i');
            return regex.test(lowerContent);
        });
    }

    checkMentions(message, maxMentions) {
        const totalMentions = message.mentions.users.size + message.mentions.roles.size;
        return totalMentions > maxMentions;
    }

    async handleViolation(message, type, settings) {
        try {
            // Delete message
            await message.delete().catch(() => {});

            const userId = message.author.id;
            const guildId = message.guild.id;

            // Track violation
            if (!this.violationCache.has(userId)) {
                this.violationCache.set(userId, { count: 0, lastViolation: Date.now() });
            }

            const violations = this.violationCache.get(userId);
            violations.count++;
            violations.lastViolation = Date.now();

            // Save to database
            this.saveViolation(guildId, userId, type);

            // Determine action based on violation count
            let action = 'warn';
            let actionTaken = 'Uyarıldı';

            if (violations.count >= settings.actions.banThreshold) {
                action = 'ban';
                actionTaken = 'Yasaklandı';
                await message.member.ban({ reason: `Auto-mod: ${this.getViolationName(type)} (${violations.count} ihlal)` });
            } else if (violations.count >= settings.actions.kickThreshold) {
                action = 'kick';
                actionTaken = 'Atıldı';
                await message.member.kick(`Auto-mod: ${this.getViolationName(type)} (${violations.count} ihlal)`);
            } else if (violations.count >= settings.actions.muteThreshold) {
                action = 'mute';
                actionTaken = 'Susturuldu';
                await this.muteUser(message.member, settings.actions.muteDuration);
            }

            // Send warning message to user
            const warningEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('⚠️ Auto-Moderasyon')
                .setDescription(`Mesajınız **${this.getViolationName(type)}** nedeniyle silindi.`)
                .addFields(
                    { name: 'İhlal Sayısı', value: `${violations.count}`, inline: true },
                    { name: 'İşlem', value: actionTaken, inline: true }
                )
                .setTimestamp();

            await message.channel.send({ 
                content: `${message.author}`, 
                embeds: [warningEmbed] 
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));

            // Log to mod channel
            await this.logViolation(message.guild, message.author, type, action, violations.count);

            logger.info(`[AutoMod] ${type} violation by ${message.author.tag} - Action: ${action}`);

        } catch (error) {
            logger.error('[AutoMod] Error handling violation:', error);
        }
    }

    async muteUser(member, duration) {
        try {
            // Find muted role or create it
            let mutedRole = member.guild.roles.cache.find(r => r.name === 'Muted');
            
            if (!mutedRole) {
                mutedRole = await member.guild.roles.create({
                    name: 'Muted',
                    color: '#808080',
                    permissions: []
                });

                // Set permissions for all channels
                member.guild.channels.cache.forEach(async channel => {
                    await channel.permissionOverwrites.create(mutedRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false
                    });
                });
            }

            await member.roles.add(mutedRole);

            // Auto-unmute after duration
            setTimeout(async () => {
                await member.roles.remove(mutedRole).catch(() => {});
            }, duration);

        } catch (error) {
            logger.error('[AutoMod] Error muting user:', error);
        }
    }

    async logViolation(guild, user, type, action, count) {
        try {
            const logChannel = guild.channels.cache.find(c => 
                c.name.includes('mod-log') || c.name.includes('auto-mod')
            );

            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🛡️ Auto-Mod İhlali')
                .addFields(
                    { name: 'Kullanıcı', value: `${user} (${user.tag})`, inline: true },
                    { name: 'İhlal Türü', value: this.getViolationName(type), inline: true },
                    { name: 'İşlem', value: action.toUpperCase(), inline: true },
                    { name: 'Toplam İhlal', value: `${count}`, inline: true }
                )
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            logger.error('[AutoMod] Error logging violation:', error);
        }
    }

    getViolationName(type) {
        const names = {
            spam: 'Spam',
            link: 'İzinsiz Link',
            word: 'Yasaklı Kelime',
            mention_spam: 'Mention Spam'
        };
        return names[type] || type;
    }

    saveViolation(guildId, userId, type) {
        if (!this.db.data.automodViolations) {
            this.db.data.automodViolations = new Map();
        }

        const violationId = `${guildId}_${userId}_${Date.now()}`;
        this.db.data.automodViolations.set(violationId, {
            guildId,
            userId,
            type,
            timestamp: Date.now()
        });

        this.db.save();
    }

    getAutoModSettings(guildId) {
        if (!this.db.data.automodSettings) {
            this.db.data.automodSettings = new Map();
        }

        if (!this.db.data.automodSettings.has(guildId)) {
            // Default settings
            return {
                enabled: false,
                antiSpam: { enabled: true },
                linkFilter: { 
                    enabled: false, 
                    whitelist: [], 
                    blacklist: [] 
                },
                wordFilter: { 
                    enabled: false, 
                    blockedWords: [] 
                },
                mentionSpam: { 
                    enabled: true, 
                    max: 5 
                },
                actions: {
                    muteThreshold: 3,
                    kickThreshold: 5,
                    banThreshold: 10,
                    muteDuration: 600000 // 10 minutes
                }
            };
        }

        return this.db.data.automodSettings.get(guildId);
    }

    updateAutoModSettings(guildId, settings) {
        if (!this.db.data.automodSettings) {
            this.db.data.automodSettings = new Map();
        }

        this.db.data.automodSettings.set(guildId, settings);
        this.db.save();
    }
}

module.exports = AutoModHandler;
