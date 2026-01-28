// ==========================================
// 🤖 NeuroViaBot - Guild Create Event (Bot added to server)
// ==========================================

const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');
const { getOrCreateGuild, Settings } = require('../models/index');
const config = require('../config.js');

module.exports = {
    name: 'guildCreate',
    once: false,
    async execute(guild, client) {
        try {
            // Log the guild join
            logger.success(`Bot yeni sunucuya eklendi: ${guild.name} (${guild.id})`, {
                guildName: guild.name,
                guildId: guild.id,
                memberCount: guild.memberCount,
                owner: guild.ownerId
            });

            // Database'e guild kaydı
            await saveGuildToDatabase(guild);

            // Default ayarları oluştur
            await createDefaultSettings(guild);

            // Hoş geldin mesajı gönder
            await sendWelcomeMessage(guild, client);

            // Bot sahibine bildirim gönder (eğer DM açıksa)
            await notifyBotOwner(guild, client);

        } catch (error) {
            logger.error('guildCreate event hatası', error, {
                guild: guild.name,
                guildId: guild.id
            });
        }
    }
};

// Guild'i database'e kaydet
async function saveGuildToDatabase(guild) {
    try {
        // Simple database'e kaydet (backend ile paylaşılan)
        const db = require('../database/simple-db');
        const guildData = {
            name: guild.name,
            memberCount: guild.memberCount,
            ownerId: guild.ownerId,
            region: guild.preferredLocale,
            joinedAt: new Date().toISOString(),
            features: guild.features || [],
            boostLevel: guild.premiumTier || 0,
            boostCount: guild.premiumSubscriptionCount || 0,
            icon: guild.icon,
            active: true
        };
        
        db.getOrCreateGuild(guild.id, guildData);
        
        logger.success('Guild simple database\'e kaydedildi', {
            guildName: guild.name,
            guildId: guild.id,
            memberCount: guild.memberCount
        });

        // Sequelize database'e de kaydet (opsiyonel)
        await getOrCreateGuild(guild.id, guildData);

        logger.debug('Guild sequelize database\'e kaydedildi', {
            guildName: guild.name,
            guildId: guild.id
        });
    } catch (error) {
        logger.error('Guild database kayıt hatası', error);
    }
}

// Default ayarları oluştur
async function createDefaultSettings(guild) {
    try {
        const defaultSettings = {
            guildId: guild.id,
            prefix: '!',
            welcomeEnabled: true,
            welcomeChannel: null,
            leaveEnabled: true,
            leaveChannel: null,
            autoRole: null,
            modRole: null,
            muteRole: null,
            logChannel: null,
            levelingEnabled: true,
            economyEnabled: true,
            musicEnabled: true,
            features: {
                music: config.features.music,
                economy: config.features.economy,
                moderation: config.features.moderation,
                leveling: config.features.leveling,
                tickets: config.features.tickets,
                giveaways: config.features.giveaways
            },
            autoMod: {
                enabled: false,
                deleteInvites: false,
                deleteSpam: false,
                filterWords: [],
                maxWarns: config.moderation.maxWarns,
                muteDuration: config.moderation.muteDuration
            }
        };

        await Settings.updateGuildSettings(guild.id, defaultSettings);
        
        logger.debug('Guild default ayarları oluşturuldu', {
            guildName: guild.name
        });
    } catch (error) {
        logger.error('Default ayarlar oluşturma hatası', error);
    }
}

// Hoş geldin mesajı gönder
async function sendWelcomeMessage(guild, client) {
    try {
        // Uygun kanal bul
        let channel = null;
        
        // System channel varsa onu kullan
        if (guild.systemChannel) {
            channel = guild.systemChannel;
        } else {
            // Genel, welcome, bot gibi kanallar ara
            const channelNames = ['genel', 'general', 'bot-commands', 'commands', 'welcome', 'karşılama'];
            
            for (const channelName of channelNames) {
                channel = guild.channels.cache.find(ch => 
                    ch.name.toLowerCase().includes(channelName) && ch.isTextBased()
                );
                if (channel) break;
            }
            
            // Hiç uygun kanal bulamazsa ilk text kanalını kullan
            if (!channel) {
                channel = guild.channels.cache.find(ch => ch.isTextBased());
            }
        }

        if (!channel) {
            logger.warn('Hoş geldin mesajı için uygun kanal bulunamadı', {
                guildName: guild.name
            });
            return;
        }

        const welcomeEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🎉 NeuroViaBot\'a Hoş Geldiniz!')
            .setDescription(`**${guild.name}** sunucusuna eklenmekten mutluyum! 🚀\n\nGelişmiş Discord bot özellikleriyle sunucunuzu bir üst seviyeye taşıyacağız!`)
            .addFields(
                {
                    name: '🎵 Müzik Sistemi',
                    value: 'YouTube & Spotify desteği\nKaliteli ses deneyimi\nGelişmiş kuyruk yönetimi',
                    inline: true
                },
                {
                    name: '🛡️ Moderasyon',
                    value: 'Otomatik moderasyon\nUyarı sistemi\nBan/Kick/Mute araçları',
                    inline: true
                },
                {
                    name: '💰 Ekonomi & Oyunlar',
                    value: 'Coin sistemi\nKumar oyunları\nMağaza sistemi',
                    inline: true
                },
                {
                    name: '📊 Seviye Sistemi',
                    value: 'XP kazanma\nLeveling rolleri\nLeaderboard',
                    inline: true
                },
                {
                    name: '🎫 Ticket Sistemi',
                    value: 'Destek talepleri\nOtomatik kategoriler\nTranscript sistemi',
                    inline: true
                },
                {
                    name: '🎉 Çekiliş & Etkinlik',
                    value: 'Kolay çekiliş oluşturma\nOtomatik kazanan seçimi\nEtkinlik yönetimi',
                    inline: true
                },
                {
                    name: '🚀 Hızlı Başlangıç',
                    value: '`/help` - Tüm komutları görün\n`/play` - Müzik çalmaya başlayın\n`/mod` - Moderasyon araçları',
                    inline: false
                }
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ 
                text: 'Ayarları düzenlemek için /setup komutunu kullanın',
                iconURL: guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();

        await channel.send({ embeds: [welcomeEmbed] });

        logger.success(`Hoş geldin mesajı gönderildi: ${guild.name}`, {
            channelName: channel.name
        });

    } catch (error) {
        logger.error('Hoş geldin mesajı gönderme hatası', error);
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
            .setColor('#00ff00')
            .setTitle('🎉 Bot Yeni Sunucuya Eklendi!')
            .setDescription(`**${guild.name}** sunucusuna eklendim!`)
            .addFields(
                {
                    name: '📊 Sunucu Bilgileri',
                    value: `**Ad:** ${guild.name}\n**ID:** ${guild.id}\n**Üye Sayısı:** ${guild.memberCount}\n**Sahibi:** <@${guild.ownerId}>`,
                    inline: false
                },
                {
                    name: '📈 Toplam Sunucu',
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
