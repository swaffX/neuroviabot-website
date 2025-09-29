const { EmbedBuilder } = require('discord.js');
const { Guild, GuildMember } = require('../models');
const { logger } = require('../utils/logger');

class LevelingHandler {
    constructor(client) {
        this.client = client;
        this.xpCooldowns = new Map(); // User cooldown tracking
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('messageCreate', async (message) => {
            await this.handleMessageXp(message);
        });
    }

    async handleMessageXp(message) {
        try {
            // Bot mesajlarını ve DM'leri görmezden gel
            if (message.author.bot || !message.guild) return;

            // Guild ayarlarını al
            const guild = await Guild.findOne({ where: { id: message.guild.id } });
            if (!guild || !guild.levelingEnabled) return;

            // Cooldown kontrolü
            const userId = message.author.id;
            const guildId = message.guild.id;
            const cooldownKey = `${userId}-${guildId}`;
            const now = Date.now();
            const cooldownTime = guild.xpCooldown || 60000; // 1 dakika default

            if (this.xpCooldowns.has(cooldownKey)) {
                const expirationTime = this.xpCooldowns.get(cooldownKey) + cooldownTime;
                if (now < expirationTime) {
                    return; // Cooldown aktif
                }
            }

            // Cooldown'ı güncelle
            this.xpCooldowns.set(cooldownKey, now);

            // Guild member'ı al veya oluştur
            let guildMember = await GuildMember.findOne({
                where: {
                    userId: userId,
                    guildId: guildId
                }
            });

            if (!guildMember) {
                // Yeni guild member oluştur
                guildMember = await GuildMember.create({
                    userId: userId,
                    guildId: guildId,
                    xp: 0,
                    level: 0,
                    messageCount: 0
                });
            }

            // XP miktarını hesapla
            const baseXp = guild.xpPerMessage || 15;
            const randomBonus = Math.floor(Math.random() * 6); // 0-5 bonus XP
            const totalXp = baseXp + randomBonus;

            // Mesaj uzunluğu bonusu (opsiyonel)
            let lengthBonus = 0;
            if (message.content.length > 50) lengthBonus += 2;
            if (message.content.length > 100) lengthBonus += 3;
            if (message.content.length > 200) lengthBonus += 5;

            const finalXp = totalXp + lengthBonus;

            // Mevcut değerleri al
            const currentXp = parseInt(guildMember.xp) || 0;
            const currentLevel = parseInt(guildMember.level) || 0;
            const newXp = currentXp + finalXp;
            const newLevel = this.getLevelFromXp(newXp);

            // Verileri güncelle
            await guildMember.update({
                xp: newXp,
                level: newLevel,
                messageCount: (guildMember.messageCount || 0) + 1,
                lastMessage: new Date(),
                lastXpGain: new Date()
            });

            // Level up kontrolü
            if (newLevel > currentLevel) {
                await this.handleLevelUp(message, guildMember, currentLevel, newLevel, guild);
                
                // Real-time güncelleme gönder
                if (global.realtimeUpdates) {
                    global.realtimeUpdates.levelUpdate(message.guild.id, message.author.id, {
                        levelUp: true,
                        oldLevel: currentLevel,
                        newLevel: newLevel,
                        xp: newXp,
                        user: {
                            id: message.author.id,
                            username: message.author.username,
                            avatar: message.author.displayAvatarURL()
                        }
                    });
                }
            } else {
                // Normal XP kazanımı için real-time güncelleme
                if (global.realtimeUpdates) {
                    global.realtimeUpdates.levelUpdate(message.guild.id, message.author.id, {
                        levelUp: false,
                        level: newLevel,
                        xp: newXp,
                        xpGained: finalXp
                    });
                }
            }

        } catch (error) {
            logger.error('Leveling XP hatası', error, {
                user: message.author.tag,
                guild: message.guild.name,
                channel: message.channel.name
            });
        }
    }

    async handleLevelUp(message, guildMember, oldLevel, newLevel, guild) {
        try {
            // Level up mesajını oluştur
            const levelUpMessage = guild.levelUpMessage || 'Tebrikler {user}! {level}. seviyeye ulaştın! 🎉';
            const formattedMessage = levelUpMessage
                .replace(/{user}/g, `<@${guildMember.userId}>`)
                .replace(/{username}/g, message.author.username)
                .replace(/{level}/g, newLevel.toString())
                .replace(/{oldLevel}/g, oldLevel.toString())
                .replace(/{xp}/g, guildMember.xp.toString());

            // Level up embed'i
            const levelUpEmbed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle('🎉 Seviye Atladı!')
                .setDescription(formattedMessage)
                .addFields(
                    { name: '👤 Kullanıcı', value: message.author.username, inline: true },
                    { name: '📈 Eski Seviye', value: oldLevel.toString(), inline: true },
                    { name: '🏆 Yeni Seviye', value: newLevel.toString(), inline: true },
                    { name: '⭐ Toplam XP', value: guildMember.xp.toLocaleString(), inline: true },
                    { name: '💬 Mesaj Sayısı', value: (guildMember.messageCount || 0).toString(), inline: true },
                    { name: '🎯 Sonraki Seviye', value: `${this.getXpForLevel(newLevel + 1).toLocaleString()} XP`, inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({
                    text: `Tebrikler ${message.author.username}!`,
                    iconURL: message.guild.iconURL()
                })
                .setTimestamp();

            // Level up kanalını belirle
            let targetChannel = message.channel;
            if (guild.levelUpChannelId) {
                const levelUpChannel = await message.guild.channels.fetch(guild.levelUpChannelId).catch(() => null);
                if (levelUpChannel) {
                    targetChannel = levelUpChannel;
                }
            }

            // Level up mesajını gönder
            await targetChannel.send({
                content: `🎉 <@${guildMember.userId}>`,
                embeds: [levelUpEmbed]
            });

            // Level role rewards kontrolü
            if (guild.levelRoles && guild.levelRoles.length > 0) {
                await this.handleLevelRoleRewards(message, guildMember, newLevel, guild);
            }

            // Level milestone achievements
            await this.handleLevelMilestones(message, guildMember, newLevel);

            logger.info(`Level up: ${message.author.tag} -> Level ${newLevel} (${message.guild.name})`);

        } catch (error) {
            logger.error('Level up handler hatası', error);
        }
    }

    async handleLevelRoleRewards(message, guildMember, newLevel, guild) {
        try {
            const member = await message.guild.members.fetch(guildMember.userId).catch(() => null);
            if (!member) return;

            // Level roles kontrolü
            for (const levelRole of guild.levelRoles) {
                if (levelRole.level === newLevel) {
                    const role = await message.guild.roles.fetch(levelRole.roleId).catch(() => null);
                    if (role && !member.roles.cache.has(role.id)) {
                        await member.roles.add(role);
                        
                        const roleEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('🎭 Yeni Rol Kazandınız!')
                            .setDescription(`${newLevel}. seviyeye ulaştığınız için **${role.name}** rolünü kazandınız!`)
                            .addFields(
                                { name: '👤 Kullanıcı', value: message.author.username, inline: true },
                                { name: '🏆 Seviye', value: newLevel.toString(), inline: true },
                                { name: '🎭 Rol', value: role.name, inline: true }
                            )
                            .setThumbnail(message.author.displayAvatarURL())
                            .setTimestamp();

                        await message.channel.send({ embeds: [roleEmbed] });
                        
                        logger.info(`Level role verildi: ${message.author.tag} -> ${role.name} (Level ${newLevel})`);
                    }
                }
            }

        } catch (error) {
            logger.error('Level role reward hatası', error);
        }
    }

    async handleLevelMilestones(message, guildMember, newLevel) {
        try {
            // Milestone seviyeleri
            const milestones = [5, 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000];
            
            if (milestones.includes(newLevel)) {
                const milestoneEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('🏆 Milestone Başarısı!')
                    .setDescription(`Harika! **${newLevel}. seviyeye** ulaştınız! Bu önemli bir milestone! 🎉`)
                    .addFields(
                        { name: '👤 Kullanıcı', value: message.author.username, inline: true },
                        { name: '🏆 Milestone Seviye', value: newLevel.toString(), inline: true },
                        { name: '⭐ Toplam XP', value: guildMember.xp.toLocaleString(), inline: true }
                    )
                    .setThumbnail(message.author.displayAvatarURL())
                    .setImage('https://media.giphy.com/media/g9582DNuQppxC/giphy.gif') // Celebration GIF
                    .setFooter({
                        text: 'Büyük başarı! Böyle devam edin!',
                        iconURL: message.guild.iconURL()
                    })
                    .setTimestamp();

                await message.channel.send({ embeds: [milestoneEmbed] });
                
                logger.info(`Milestone ulaşıldı: ${message.author.tag} -> Level ${newLevel} milestone`);
            }

        } catch (error) {
            logger.error('Level milestone hatası', error);
        }
    }

    // XP hesaplama fonksiyonları
    getXpForLevel(level) {
        // Exponential growth: level^2 * 100
        return Math.floor(Math.pow(level, 2) * 100);
    }

    getLevelFromXp(xp) {
        return Math.floor(Math.sqrt(xp / 100));
    }

    // Cooldown temizleme (memory optimization)
    cleanupCooldowns() {
        const now = Date.now();
        const maxCooldown = 300000; // 5 dakika

        for (const [key, timestamp] of this.xpCooldowns.entries()) {
            if (now - timestamp > maxCooldown) {
                this.xpCooldowns.delete(key);
            }
        }
    }
}

// Her 5 dakikada bir cooldown temizliği
setInterval(() => {
    if (global.levelingHandler) {
        global.levelingHandler.cleanupCooldowns();
    }
}, 300000); // 5 dakika

module.exports = LevelingHandler;

