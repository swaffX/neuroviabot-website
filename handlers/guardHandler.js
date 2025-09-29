const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { Guild } = require('../models');
const { logger } = require('../utils/logger');

class GuardHandler {
    constructor(client) {
        this.client = client;
        this.joinTracking = new Map(); // Guild ID -> Array of join timestamps
        this.messageSpamTracking = new Map(); // User ID -> Array of message timestamps
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Member join tracking (Anti-Raid)
        this.client.on('guildMemberAdd', async (member) => {
            await this.handleAntiRaid(member);
        });

        // Message monitoring (Auto-Mod)
        this.client.on('messageCreate', async (message) => {
            await this.handleAutoMod(message);
        });

        // Member update monitoring
        this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
            await this.handleMemberUpdate(oldMember, newMember);
        });

        // Channel monitoring
        this.client.on('channelCreate', async (channel) => {
            await this.handleChannelCreate(channel);
        });

        this.client.on('channelDelete', async (channel) => {
            await this.handleChannelDelete(channel);
        });

        // Role monitoring
        this.client.on('roleCreate', async (role) => {
            await this.handleRoleCreate(role);
        });

        this.client.on('roleDelete', async (role) => {
            await this.handleRoleDelete(role);
        });
    }

    async handleAntiRaid(member) {
        try {
            // Bot kontrolü
            if (member.user.bot) return;

            // Guild ayarlarını al
            const guild = await Guild.findOne({ where: { id: member.guild.id } });
            if (!guild || !guild.guardEnabled || !guild.antiRaidEnabled) return;

            // Whitelist kontrolü
            if (this.isWhitelisted(member, guild)) {
                logger.debug(`Whitelisted user joined: ${member.user.tag}`);
                return;
            }

            // Join tracking
            const guildId = member.guild.id;
            const now = Date.now();
            
            if (!this.joinTracking.has(guildId)) {
                this.joinTracking.set(guildId, []);
            }

            const joins = this.joinTracking.get(guildId);
            joins.push(now);

            // Son 1 dakikadaki joinleri filtrele
            const oneMinuteAgo = now - 60000;
            const recentJoins = joins.filter(timestamp => timestamp > oneMinuteAgo);
            this.joinTracking.set(guildId, recentJoins);

            // Raid kontrolü
            const maxJoins = guild.maxJoinsPerMinute || 10;
            if (recentJoins.length > maxJoins) {
                await this.executeRaidProtection(member, guild, recentJoins.length);
            }

            // Hesap yaşı kontrolü
            const accountAge = now - member.user.createdTimestamp;
            const daysSinceCreation = Math.floor(accountAge / (1000 * 60 * 60 * 24));
            
            if (daysSinceCreation < 1) {
                await this.handleSuspiciousAccount(member, daysSinceCreation);
            }

        } catch (error) {
            logger.error('Anti-raid handler hatası', error);
        }
    }

    async handleAutoMod(message) {
        try {
            // Bot mesajlarını ve DM'leri görmezden gel
            if (message.author.bot || !message.guild) return;

            // Guild ayarlarını al
            const guild = await Guild.findOne({ where: { id: message.guild.id } });
            if (!guild || !guild.guardEnabled) return;

            // Whitelist kontrolü
            const member = message.member;
            if (this.isWhitelisted(member, guild)) return;

            // Moderatör kontrolü
            if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

            let violations = [];

            // Anti-Spam kontrolü
            if (guild.antiSpamEnabled) {
                const isSpam = await this.checkSpam(message);
                if (isSpam) violations.push('spam');
            }

            // Anti-Link kontrolü
            if (guild.autoDeleteLinks) {
                const hasLinks = this.checkLinks(message.content);
                if (hasLinks) violations.push('link');
            }

            // Anti-Caps kontrolü
            if (guild.antiCapsEnabled) {
                const hasCaps = this.checkCaps(message.content);
                if (hasCaps) violations.push('caps');
            }

            // Anti-Mention kontrolü
            if (guild.antiMentionEnabled) {
                const hasMentionSpam = this.checkMentionSpam(message);
                if (hasMentionSpam) violations.push('mention');
            }

            // Violation işle
            if (violations.length > 0) {
                await this.handleViolation(message, violations);
            }

        } catch (error) {
            logger.error('Auto-mod handler hatası', error);
        }
    }

    async executeRaidProtection(member, guild, joinCount) {
        try {
            const action = guild.raidAction || 'kick';
            
            logger.warn(`RAID DETECTED: ${member.guild.name} - ${joinCount} joins in 1 minute`);

            // Real-time güvenlik uyarısı gönder
            if (global.realtimeUpdates) {
                global.realtimeUpdates.securityAlert(member.guild.id, {
                    type: 'raid_detected',
                    joinCount,
                    action,
                    triggeredBy: {
                        id: member.user.id,
                        username: member.user.username,
                        tag: member.user.tag
                    },
                    guild: {
                        id: member.guild.id,
                        name: member.guild.name
                    }
                });
            }

            // Raid embed
            const raidEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🚨 RAID TESPİT EDİLDİ!')
                .setDescription(`**${joinCount}** kişi son 1 dakikada katıldı!`)
                .addFields(
                    { name: '🏠 Sunucu', value: member.guild.name, inline: true },
                    { name: '👥 Katılım Sayısı', value: joinCount.toString(), inline: true },
                    { name: '⚔️ Aksiyon', value: this.getRaidActionText(action), inline: true },
                    { name: '⏰ Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setTimestamp();

            // Log kanalına gönder
            if (guild.logChannelId) {
                const logChannel = await member.guild.channels.fetch(guild.logChannelId).catch(() => null);
                if (logChannel) {
                    await logChannel.send({ embeds: [raidEmbed] });
                }
            }

            // Raid aksiyonunu uygula
            switch (action) {
                case 'kick':
                    try {
                        await member.kick('Anti-raid koruması');
                        logger.info(`Raid kick: ${member.user.tag}`);
                    } catch (error) {
                        logger.error('Raid kick hatası', error);
                    }
                    break;

                case 'ban':
                    try {
                        await member.ban({ reason: 'Anti-raid koruması' });
                        logger.info(`Raid ban: ${member.user.tag}`);
                    } catch (error) {
                        logger.error('Raid ban hatası', error);
                    }
                    break;

                case 'lockdown':
                    await this.activateLockdown(member.guild, 'Otomatik raid koruması');
                    break;
            }

        } catch (error) {
            logger.error('Raid protection execution hatası', error);
        }
    }

    async handleSuspiciousAccount(member, accountAge) {
        try {
            const suspiciousEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('⚠️ ŞÜPHELİ HESAP')
                .setDescription(`Yeni hesap tespit edildi!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: `${member.user} (${member.user.tag})`, inline: true },
                    { name: '📅 Hesap Yaşı', value: `${accountAge} gün`, inline: true },
                    { name: '🆔 User ID', value: member.user.id, inline: true },
                    { name: '⏰ Katılma', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();

            // Log kanalına gönder
            const guild = await Guild.findOne({ where: { id: member.guild.id } });
            if (guild?.logChannelId) {
                const logChannel = await member.guild.channels.fetch(guild.logChannelId).catch(() => null);
                if (logChannel) {
                    await logChannel.send({ embeds: [suspiciousEmbed] });
                }
            }

        } catch (error) {
            logger.error('Suspicious account handler hatası', error);
        }
    }

    async checkSpam(message) {
        const userId = message.author.id;
        const now = Date.now();
        
        if (!this.messageSpamTracking.has(userId)) {
            this.messageSpamTracking.set(userId, []);
        }

        const messages = this.messageSpamTracking.get(userId);
        messages.push(now);

        // Son 10 saniyedeki mesajları filtrele
        const tenSecondsAgo = now - 10000;
        const recentMessages = messages.filter(timestamp => timestamp > tenSecondsAgo);
        this.messageSpamTracking.set(userId, recentMessages);

        // 10 saniyede 5'ten fazla mesaj = spam
        return recentMessages.length > 5;
    }

    checkLinks(content) {
        const linkRegex = /(https?:\/\/[^\s]+)/gi;
        return linkRegex.test(content);
    }

    checkCaps(content) {
        if (content.length < 6) return false;
        const upperCaseCount = (content.match(/[A-Z]/g) || []).length;
        const percentage = (upperCaseCount / content.length) * 100;
        return percentage > 70; // %70'den fazla büyük harf
    }

    checkMentionSpam(message) {
        const mentions = message.mentions.users.size + message.mentions.roles.size;
        return mentions > 5; // 5'ten fazla mention
    }

    async handleViolation(message, violations) {
        try {
            // Mesajı sil
            await message.delete().catch(() => {});

            // Violation embed
            const violationEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🚫 Otomatik Moderasyon')
                .setDescription(`${message.author} mesajınız otomatik olarak silindi!`)
                .addFields(
                    { name: '📝 İhlaller', value: violations.map(v => this.getViolationText(v)).join(', '), inline: false },
                    { name: '👤 Kullanıcı', value: message.author.username, inline: true },
                    { name: '📍 Kanal', value: message.channel.toString(), inline: true }
                )
                .setFooter({
                    text: 'Kurallara uymanızı rica ederiz',
                    iconURL: message.guild.iconURL()
                })
                .setTimestamp();

            // Geçici uyarı mesajı gönder
            const warningMessage = await message.channel.send({ embeds: [violationEmbed] });
            
            // 5 saniye sonra uyarı mesajını sil
            setTimeout(async () => {
                await warningMessage.delete().catch(() => {});
            }, 5000);

            logger.info(`Auto-mod violation: ${message.author.tag} - ${violations.join(', ')}`);

        } catch (error) {
            logger.error('Violation handler hatası', error);
        }
    }

    isWhitelisted(member, guild) {
        if (!member || !guild) return false;

        // Kullanıcı whitelist kontrolü
        if (guild.whitelistUsers && guild.whitelistUsers.includes(member.user.id)) {
            return true;
        }

        // Rol whitelist kontrolü
        if (guild.whitelistRoles && guild.whitelistRoles.length > 0) {
            const hasWhitelistRole = guild.whitelistRoles.some(roleId => 
                member.roles.cache.has(roleId)
            );
            if (hasWhitelistRole) return true;
        }

        return false;
    }

    getRaidActionText(action) {
        switch (action) {
            case 'kick': return '👢 Kick';
            case 'ban': return '🔨 Ban';
            case 'lockdown': return '🔒 Lockdown';
            default: return '❓ Bilinmiyor';
        }
    }

    getViolationText(violation) {
        switch (violation) {
            case 'spam': return '🚫 Spam';
            case 'link': return '🔗 Link';
            case 'caps': return '📢 Caps';
            case 'mention': return '👥 Mention Spam';
            default: return '❓ Bilinmiyor';
        }
    }

    async handleMemberUpdate(oldMember, newMember) {
        try {
            // Sadece rol değişikliklerini izle
            if (oldMember.roles.cache.size === newMember.roles.cache.size) return;
            
            const guild = await Guild.findOne({ where: { id: newMember.guild.id } });
            if (!guild || !guild.guardEnabled) return;

            // Admin/Moderator rolü verilme kontrolü
            const dangerousPermissions = [
                PermissionFlagsBits.Administrator,
                PermissionFlagsBits.ManageGuild,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.ManageChannels
            ];

            const gainedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            
            for (const role of gainedRoles.values()) {
                const hasDangerousPerms = dangerousPermissions.some(perm => role.permissions.has(perm));
                
                if (hasDangerousPerms) {
                    await this.logSuspiciousRoleChange(newMember, role, 'added');
                }
            }

        } catch (error) {
            logger.error('Member update handler hatası', error);
        }
    }

    async handleChannelCreate(channel) {
        try {
            if (!channel.guild) return;
            
            const guild = await Guild.findOne({ where: { id: channel.guild.id } });
            if (!guild || !guild.guardEnabled) return;

            // Log suspicious channel creation
            await this.logChannelChange(channel, 'created');

        } catch (error) {
            logger.error('Channel create handler hatası', error);
        }
    }

    async handleChannelDelete(channel) {
        try {
            if (!channel.guild) return;
            
            const guild = await Guild.findOne({ where: { id: channel.guild.id } });
            if (!guild || !guild.guardEnabled) return;

            // Log channel deletion
            await this.logChannelChange(channel, 'deleted');

        } catch (error) {
            logger.error('Channel delete handler hatası', error);
        }
    }

    async handleRoleCreate(role) {
        try {
            const guild = await Guild.findOne({ where: { id: role.guild.id } });
            if (!guild || !guild.guardEnabled) return;

            // Log role creation
            await this.logRoleChange(role, 'created');

        } catch (error) {
            logger.error('Role create handler hatası', error);
        }
    }

    async handleRoleDelete(role) {
        try {
            const guild = await Guild.findOne({ where: { id: role.guild.id } });
            if (!guild || !guild.guardEnabled) return;

            // Log role deletion
            await this.logRoleChange(role, 'deleted');

        } catch (error) {
            logger.error('Role delete handler hatası', error);
        }
    }

    async logSuspiciousRoleChange(member, role, action) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('⚠️ ŞÜPHELİ ROL DEĞİŞİKLİĞİ')
                .setDescription(`Tehlikeli yetkili rol ${action === 'added' ? 'verildi' : 'alındı'}!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: `${member.user} (${member.user.tag})`, inline: true },
                    { name: '🏷️ Rol', value: role.name, inline: true },
                    { name: '⚡ Aksiyon', value: action === 'added' ? 'Eklendi' : 'Kaldırıldı', inline: true },
                    { name: '🔑 Yetkiler', value: role.permissions.toArray().slice(0, 5).join(', '), inline: false }
                )
                .setTimestamp();

            const guild = await Guild.findOne({ where: { id: member.guild.id } });
            if (guild?.logChannelId) {
                const logChannel = await member.guild.channels.fetch(guild.logChannelId).catch(() => null);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] });
                }
            }

        } catch (error) {
            logger.error('Role change log hatası', error);
        }
    }

    async logChannelChange(channel, action) {
        try {
            const embed = new EmbedBuilder()
                .setColor(action === 'created' ? '#00ff00' : '#ff0000')
                .setTitle(`📋 KANAL ${action.toUpperCase()}`)
                .addFields(
                    { name: '📍 Kanal', value: `${channel.name} (${channel.id})`, inline: true },
                    { name: '📂 Tip', value: channel.type.toString(), inline: true },
                    { name: '⚡ Aksiyon', value: action === 'created' ? 'Oluşturuldu' : 'Silindi', inline: true }
                )
                .setTimestamp();

            const guild = await Guild.findOne({ where: { id: channel.guild.id } });
            if (guild?.logChannelId) {
                const logChannel = await channel.guild.channels.fetch(guild.logChannelId).catch(() => null);
                if (logChannel && logChannel.id !== channel.id) {
                    await logChannel.send({ embeds: [embed] });
                }
            }

        } catch (error) {
            logger.error('Channel change log hatası', error);
        }
    }

    async logRoleChange(role, action) {
        try {
            const embed = new EmbedBuilder()
                .setColor(action === 'created' ? '#00ff00' : '#ff0000')
                .setTitle(`🏷️ ROL ${action.toUpperCase()}`)
                .addFields(
                    { name: '🏷️ Rol', value: `${role.name} (${role.id})`, inline: true },
                    { name: '🎨 Renk', value: role.hexColor || 'Varsayılan', inline: true },
                    { name: '⚡ Aksiyon', value: action === 'created' ? 'Oluşturuldu' : 'Silindi', inline: true }
                )
                .setTimestamp();

            if (action === 'created' && role.permissions.toArray().length > 0) {
                embed.addFields({
                    name: '🔑 Yetkiler',
                    value: role.permissions.toArray().slice(0, 10).join(', ') + (role.permissions.toArray().length > 10 ? '...' : ''),
                    inline: false
                });
            }

            const guild = await Guild.findOne({ where: { id: role.guild.id } });
            if (guild?.logChannelId) {
                const logChannel = await role.guild.channels.fetch(guild.logChannelId).catch(() => null);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] });
                }
            }

        } catch (error) {
            logger.error('Role change log hatası', error);
        }
    }

    async activateLockdown(guild, reason) {
        try {
            // Tüm text kanalları kitle
            const channels = guild.channels.cache.filter(channel => 
                channel.isTextBased() && !channel.isThread()
            );

            for (const [, channel] of channels) {
                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: false
                    });
                } catch (error) {
                    logger.error(`Kanal kilitleme hatası: ${channel.name}`, error);
                }
            }

            const lockdownEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔒 SUNUCU KİLİTLENDİ')
                .setDescription(`Sunucu otomatik olarak kilitlendi!`)
                .addFields(
                    { name: '📝 Sebep', value: reason, inline: false },
                    { name: '⏰ Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setTimestamp();

            // Genel kanala duyuru gönder
            const generalChannel = guild.channels.cache.find(channel => 
                channel.name.includes('general') || 
                channel.name.includes('genel') ||
                channel.type === 0
            );

            if (generalChannel) {
                await generalChannel.send({ embeds: [lockdownEmbed] });
            }

            logger.warn(`Guild locked down: ${guild.name} - ${reason}`);

        } catch (error) {
            logger.error('Lockdown activation hatası', error);
        }
    }

    // Cleanup functions
    cleanupTracking() {
        const now = Date.now();
        const fiveMinutesAgo = now - 300000;

        // Join tracking cleanup
        for (const [guildId, joins] of this.joinTracking.entries()) {
            const recentJoins = joins.filter(timestamp => timestamp > fiveMinutesAgo);
            if (recentJoins.length === 0) {
                this.joinTracking.delete(guildId);
            } else {
                this.joinTracking.set(guildId, recentJoins);
            }
        }

        // Message spam tracking cleanup
        for (const [userId, messages] of this.messageSpamTracking.entries()) {
            const recentMessages = messages.filter(timestamp => timestamp > fiveMinutesAgo);
            if (recentMessages.length === 0) {
                this.messageSpamTracking.delete(userId);
            } else {
                this.messageSpamTracking.set(userId, recentMessages);
            }
        }
    }
}

// Her 5 dakikada bir tracking temizliği
setInterval(() => {
    if (global.guardHandler) {
        global.guardHandler.cleanupTracking();
    }
}, 300000); // 5 dakika

module.exports = GuardHandler;

