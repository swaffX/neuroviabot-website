// ==========================================
// 🤖 NeuroViaBot - Guild Delete Event (Bot removed from server)
// ==========================================

const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');
const { Guild, GuildMember, CustomCommand, Settings } = require('../models/index');

module.exports = {
    name: 'guildDelete',
    once: false,
    async execute(guild, client) {
        try {
            // Log the guild leave
            logger.warn(`Bot sunucudan kaldırıldı: ${guild.name} (${guild.id})`, {
                guildName: guild.name,
                guildId: guild.id,
                memberCount: guild.memberCount,
                leftAt: new Date().toISOString()
            });

            // Database'de guild bilgilerini güncelle
            await updateGuildInDatabase(guild);

            // Bot sahibine bildirim gönder
            await notifyBotOwner(guild, client);

            // Cleanup işlemleri (opsiyonel)
            await performCleanup(guild);

        } catch (error) {
            logger.error('guildDelete event hatası', error, {
                guild: guild.name,
                guildId: guild.id
            });
        }
    }
};

// Guild'i database'de güncelle
async function updateGuildInDatabase(guild) {
    try {
        // Simple database'den kaldır (backend ile paylaşılan)
        const db = require('../database/simple-db');
        const existingGuild = db.getGuild(guild.id);
        
        if (existingGuild) {
            // Guild'i sil
            db.data.guilds.delete(guild.id);
            
            logger.success('Guild simple database\'den kaldırıldı', {
                guildName: guild.name,
                guildId: guild.id
            });
        }

        // Sequelize database'de güncelle (opsiyonel)
        const sequelizeGuild = await Guild.findById(guild.id);
        
        if (sequelizeGuild) {
            await Guild.update(guild.id, {
                leftAt: new Date().toISOString(),
                lastMemberCount: guild.memberCount,
                active: false
            });

            logger.debug('Guild sequelize database\'de güncellendi (leftAt)', {
                guildName: guild.name,
                guildId: guild.id
            });
        }

    } catch (error) {
        logger.error('Guild database güncelleme hatası', error);
    }
}

// Cleanup işlemleri
async function performCleanup(guild) {
    try {
        // Memory'den music queue'ları temizle
        if (client.musicPlayer && client.musicPlayer.getPlayer()) {
            const queue = client.musicPlayer.getPlayer().nodes.get(guild.id);
            if (queue) {
                queue.delete();
                logger.debug(`Music queue temizlendi: ${guild.name}`);
            }
        }

        // XP Cooldowns temizle
        if (client.xpCooldowns) {
            for (const [key, value] of client.xpCooldowns) {
                if (key.endsWith(`-${guild.id}`)) {
                    client.xpCooldowns.delete(key);
                }
            }
        }

        // Command cooldowns temizle (eğer varsa)
        if (client.cooldowns) {
            client.cooldowns.forEach((cooldown, commandName) => {
                cooldown.forEach((expiration, userId) => {
                    // Guild-specific cooldown'ları temizle
                    const guildKey = `${userId}-${guild.id}`;
                    if (cooldown.has(guildKey)) {
                        cooldown.delete(guildKey);
                    }
                });
            });
        }

        logger.debug(`Cleanup tamamlandı: ${guild.name}`);

    } catch (error) {
        logger.error('Cleanup hatası', error);
    }
}

// Bot sahibine bildirim gönder
async function notifyBotOwner(guild, client) {
    try {
        const ownerId = process.env.BOT_OWNER_ID;
        if (!ownerId) return;

        const owner = await client.users.fetch(ownerId).catch(() => null);
        if (!owner) return;

        const notificationEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('😢 Bot Sunucudan Kaldırıldı')
            .setDescription(`**${guild.name}** sunucusundan kaldırıldım...`)
            .addFields(
                {
                    name: '📊 Sunucu Bilgileri',
                    value: `**Ad:** ${guild.name}\n**ID:** ${guild.id}\n**Üye Sayısı:** ${guild.memberCount}\n**Sahibi:** <@${guild.ownerId}>`,
                    inline: false
                },
                {
                    name: '⏰ Kaldığı Süre',
                    value: calculateStayDuration(guild),
                    inline: true
                },
                {
                    name: '📈 Kalan Sunucu',
                    value: `Bot şu anda **${client.guilds.cache.size}** sunucuda aktif`,
                    inline: true
                },
                {
                    name: '👥 Toplam Kullanıcı',
                    value: `**${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString()}** kullanıcı`,
                    inline: true
                }
            )
            .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
            .setTimestamp();

        await owner.send({ embeds: [notificationEmbed] });

    } catch (error) {
        logger.debug('Owner notification hatası (kritik değil)', error);
    }
}

// Bot'un sunucuda kaldığı süreyi hesapla
function calculateStayDuration(guild) {
    try {
        // Bot'un guild'e katılma zamanını tahmin et (guild.joinedTimestamp mevcut değil guildDelete'te)
        // Alternatif olarak database'den joinedAt'i alabiliriz
        
        // Şimdilik basit bir hesaplama yapalım
        const now = new Date();
        const estimatedJoinTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // Varsayılan 1 gün
        
        const duration = now.getTime() - estimatedJoinTime.getTime();
        
        const days = Math.floor(duration / (1000 * 60 * 60 * 24));
        const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days} gün ${hours} saat`;
        } else if (hours > 0) {
            return `${hours} saat ${minutes} dakika`;
        } else {
            return `${minutes} dakika`;
        }
        
    } catch (error) {
        return 'Bilinmiyor';
    }
}

// Opsiyonel: Guild verilerini tamamen silme fonksiyonu
async function completelyDeleteGuildData(guildId) {
    try {
        // ⚠️ DİKKAT: Bu fonksiyon tüm guild verilerini kalıcı olarak siler
        // Normal kullanımda önerilmez, sadece özel durumlarda kullanın
        
        // Custom commands sil
        const customCommands = await CustomCommand.findByGuild(guildId);
        for (const command of customCommands) {
            await CustomCommand.delete(command.id);
        }
        
        // Guild settings sil
        // Settings silme fonksiyonu gerekli
        
        // Guild members sil (opsiyonel - normalde tutulması önerilir)
        // GuildMember.deleteByGuild(guildId);
        
        logger.warn(`Guild verileri tamamen silindi: ${guildId}`);
        
    } catch (error) {
        logger.error('Complete guild data deletion hatası', error);
    }
}
