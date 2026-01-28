const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class LevelingHandler {
    constructor(client) {
        this.client = client;
        this.isEnabled = true; // Handler her zaman aktif, guild ayarları kontrol edilir
        this.xpCooldowns = new Map(); // User cooldown tracking
        console.log('[LEVELING-HANDLER] Leveling handler başlatıldı');
    }

    // Handler'ı yeniden başlat
    restart() {
        console.log('[LEVELING-HANDLER] Handler yeniden başlatıldı');
    }

    async handleMessageXp(message) {
        try {
            // Leveling sistemi kapalıysa çık
            if (!this.isEnabled) return;
            
            // Bot mesajlarını ve DM'leri görmezden gel
            if (message.author.bot || !message.guild) return;

            const db = getDatabase();
            const settings = db.getGuildSettings(message.guild.id);
            
            // Guild ayarlarını kontrol et
            if (!settings.leveling?.enabled) return;

            // Cooldown kontrolü
            const userId = message.author.id;
            const guildId = message.guild.id;
            const cooldownKey = `${userId}-${guildId}`;
            const now = Date.now();
            const cooldownTime = (settings.leveling?.xpCooldown || 60) * 1000; // Saniye -> milisaniye

            if (this.xpCooldowns.has(cooldownKey)) {
                const expirationTime = this.xpCooldowns.get(cooldownKey) + cooldownTime;
                if (now < expirationTime) {
                    return; // Cooldown aktif
                }
            }

            // Cooldown'ı güncelle
            this.xpCooldowns.set(cooldownKey, now);

            // Guild member verilerini al/oluştur (simple-db kullanarak)
            const memberKey = `${guildId}-${userId}`;
            let memberData = db.data.guildMembers?.get(memberKey) || {
                userId,
                guildId,
                xp: 0,
                level: 0,
                messageCount: 0,
                lastMessage: null,
                lastXpGain: null
            };

            // XP miktarını hesapla
            const baseXp = settings.leveling?.xpPerMessage || 15;
            const randomBonus = Math.floor(Math.random() * 6); // 0-5 bonus XP
            const totalXp = baseXp + randomBonus;

            // Mesaj uzunluğu bonusu (opsiyonel)
            let lengthBonus = 0;
            if (message.content.length > 50) lengthBonus += 2;
            if (message.content.length > 100) lengthBonus += 3;
            if (message.content.length > 200) lengthBonus += 5;

            const finalXp = totalXp + lengthBonus;

            // Mevcut değerleri al
            const currentXp = parseInt(memberData.xp) || 0;
            const currentLevel = parseInt(memberData.level) || 0;
            const newXp = currentXp + finalXp;
            const newLevel = this.getLevelFromXp(newXp);

            // Verileri güncelle
            memberData.xp = newXp;
            memberData.level = newLevel;
            memberData.messageCount = (memberData.messageCount || 0) + 1;
            memberData.lastMessage = new Date().toISOString();
            memberData.lastXpGain = new Date().toISOString();

            // Database'e kaydet
            if (!db.data.guildMembers) db.data.guildMembers = new Map();
            db.data.guildMembers.set(memberKey, memberData);
            db.saveData();

            // Level up kontrolü
            if (newLevel > currentLevel) {
                await this.handleLevelUp(message, memberData, currentLevel, newLevel, settings);
                
                // Real-time güncelleme gönder
                if (global.realtimeUpdates) {
                    console.log(`[DEBUG-REALTIME] Sending level up event for ${message.author.username} (Level ${currentLevel} -> ${newLevel})`);
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
                } else {
                    console.log(`[DEBUG-REALTIME] global.realtimeUpdates is not available`);
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
            console.error('[Leveling] Error:', error.message);
        }
    }

    async handleLevelUp(message, memberData, oldLevel, newLevel, settings) {
        try {
            // Level up mesajını oluştur (boolean kontrolü)
            if (!settings.leveling?.levelUpMessage || settings.leveling.levelUpMessage === 'false') return; // Mesaj gönderme kapalı
            
            const levelUpMessageText = settings.leveling.levelUpMessage || 'Tebrikler {user}! {level}. seviyeye ulaştın! 🎉';
            const formattedMessage = levelUpMessageText
                .replace(/{user}/g, `<@${memberData.userId}>`)
                .replace(/{username}/g, message.author.username)
                .replace(/{level}/g, newLevel.toString())
                .replace(/{oldLevel}/g, oldLevel.toString())
                .replace(/{xp}/g, memberData.xp.toString());

            // Level up embed'i
            const levelUpEmbed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle('🎉 Seviye Atladı!')
                .setDescription(formattedMessage)
                .addFields(
                    { name: '👤 Kullanıcı', value: message.author.username, inline: true },
                    { name: '📈 Eski Seviye', value: oldLevel.toString(), inline: true },
                    { name: '🏆 Yeni Seviye', value: newLevel.toString(), inline: true },
                    { name: '⭐ Toplam XP', value: memberData.xp.toLocaleString(), inline: true },
                    { name: '💬 Mesaj Sayısı', value: (memberData.messageCount || 0).toString(), inline: true },
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
            if (settings.leveling?.levelUpChannelId) {
                const levelUpChannel = await message.guild.channels.fetch(settings.leveling.levelUpChannelId).catch(() => null);
                if (levelUpChannel) {
                    targetChannel = levelUpChannel;
                }
            }

            // Level up mesajını gönder
            await targetChannel.send({
                content: `🎉 <@${memberData.userId}>`,
                embeds: [levelUpEmbed]
            });

            // Level role rewards kontrolü
            if (settings.leveling?.levelRoles && Object.keys(settings.leveling.levelRoles).length > 0) {
                await this.handleLevelRoleRewards(message, memberData, newLevel, settings);
            }

            // NRC Coin reward (fixed amount per level)
            try {
                const { addNRCToUser, NRC_CONFIG } = require('./nrcCoinHandler');
                const nrcReward = NRC_CONFIG.levelReward; // Fixed 10 NRC per level
                addNRCToUser(memberData.userId, nrcReward, `Level ${newLevel} achieved`);
                
                logger.info(`NRC Reward: ${message.author.tag} earned ${nrcReward} NRC for reaching level ${newLevel}`);
            } catch (error) {
                logger.error('NRC reward error:', error);
            }

            // Level milestone achievements
            await this.handleLevelMilestones(message, memberData, newLevel);

            // Real-time broadcast via Socket.IO
            if (global.realtimeUpdates) {
                global.realtimeUpdates.levelUpdate({
                    guildId: message.guild.id,
                    userId: memberData.userId,
                    username: message.author.username,
                    avatar: message.author.displayAvatarURL(),
                    oldLevel,
                    newLevel,
                    xp: memberData.xp,
                    timestamp: Date.now()
                });
            }

            logger.info(`Level up: ${message.author.tag} -> Level ${newLevel} (${message.guild.name})`);

        } catch (error) {
            logger.error('Level up handler hatası', error);
        }
    }

    async handleLevelRoleRewards(message, memberData, newLevel, settings) {
        try {
            const member = await message.guild.members.fetch(memberData.userId).catch(() => null);
            if (!member) return;

            // Level roles kontrolü (Map yapısı)
            const levelRoles = settings.leveling?.levelRoles || {};
            for (const [level, roleId] of Object.entries(levelRoles)) {
                if (parseInt(level) === newLevel) {
                    const role = await message.guild.roles.fetch(roleId).catch(() => null);
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

    async handleLevelMilestones(message, memberData, newLevel) {
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
                        { name: '⭐ Toplam XP', value: memberData.xp.toLocaleString(), inline: true }
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

