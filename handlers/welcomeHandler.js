const { EmbedBuilder } = require('discord.js');
const { Guild, GuildMember } = require('../models');
const { logger } = require('../utils/logger');

class WelcomeHandler {
    constructor(client) {
        this.client = client;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('guildMemberAdd', async (member) => {
            await this.handleMemberJoin(member);
        });

        this.client.on('guildMemberRemove', async (member) => {
            await this.handleMemberLeave(member);
        });
    }

    async handleMemberJoin(member) {
        try {
            // Bot kontrolü
            if (member.user.bot) return;

            // Guild ayarlarını al
            const guild = await Guild.findOne({ where: { id: member.guild.id } });
            if (!guild || !guild.welcomeEnabled) return;

            // Welcome kanalını kontrol et
            const welcomeChannel = await member.guild.channels.fetch(guild.welcomeChannelId).catch(() => null);
            if (!welcomeChannel) {
                logger.error('Welcome kanalı bulunamadı', { guildId: member.guild.id, channelId: guild.welcomeChannelId });
                return;
            }

            // Otomatik rol ver
            if (guild.memberRoleId) {
                try {
                    const role = await member.guild.roles.fetch(guild.memberRoleId);
                    if (role && member.guild.members.me.permissions.has('ManageRoles')) {
                        await member.roles.add(role);
                        logger.debug(`Otomatik rol verildi: ${member.user.tag} -> ${role.name}`);
                    }
                } catch (error) {
                    logger.error('Otomatik rol verme hatası', error);
                }
            }

            // Welcome mesajını oluştur
            const welcomeMessage = this.formatMessage(
                guild.welcomeMessage || 'Hoş geldin {user}! {guild} sunucumuzda artık {memberCount} kişiyiz! 🎉',
                member,
                member.guild
            );

            // Welcome embed
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('👋 Hoş Geldin!')
                .setDescription(welcomeMessage)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: '👤 Kullanıcı', value: member.user.username, inline: true },
                    { name: '📅 Hesap Oluşturma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '🆔 User ID', value: member.user.id, inline: true },
                    { name: '📊 Üye Sayısı', value: member.guild.memberCount.toString(), inline: true },
                    { name: '🎭 Otomatik Rol', value: guild.memberRoleId ? `<@&${guild.memberRoleId}>` : 'Yok', inline: true },
                    { name: '📅 Katılma', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({
                    text: `${member.guild.name} ailesine hoş geldin!`,
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            // Hesap yaşı kontrolü (güvenlik)
            const accountAge = Date.now() - member.user.createdTimestamp;
            const daysSinceCreation = Math.floor(accountAge / (1000 * 60 * 60 * 24));
            
            if (daysSinceCreation < 7) {
                welcomeEmbed.addFields({
                    name: '⚠️ Yeni Hesap',
                    value: `Bu hesap ${daysSinceCreation} gün önce oluşturuldu`,
                    inline: false
                });
                welcomeEmbed.setColor('#ffa500');
            }

            // Welcome mesajını gönder
            await welcomeChannel.send({
                content: `👋 ${member}`,
                embeds: [welcomeEmbed]
            });

            // DM mesajı gönder
            if (guild.dmWelcome && guild.dmWelcomeMessage) {
                try {
                    const dmMessage = this.formatMessage(guild.dmWelcomeMessage, member, member.guild);
                    
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle(`👋 ${member.guild.name} - Hoş Geldin!`)
                        .setDescription(dmMessage)
                        .setThumbnail(member.guild.iconURL())
                        .addFields(
                            { name: '🏠 Sunucu', value: member.guild.name, inline: true },
                            { name: '📊 Üye Sayısı', value: member.guild.memberCount.toString(), inline: true },
                            { name: '📅 Katıldığın Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setFooter({
                            text: 'İyi eğlenceler!',
                            iconURL: member.guild.iconURL()
                        })
                        .setTimestamp();

                    await member.send({ embeds: [dmEmbed] });
                    logger.debug(`DM welcome mesajı gönderildi: ${member.user.tag}`);

                } catch (error) {
                    logger.debug('DM welcome mesajı gönderilemedi', { user: member.user.tag, error: error.message });
                }
            }

            // İstatistikleri güncelle
            const guildMember = await GuildMember.findOne({
                where: { userId: member.user.id, guildId: member.guild.id }
            });

            if (guildMember) {
                await guildMember.update({
                    joinedAt: member.joinedAt,
                    nickname: member.nickname
                });
            }

            logger.info(`Yeni üye karşılandı: ${member.user.tag} -> ${member.guild.name}`);

        } catch (error) {
            logger.error('Welcome handler hatası', error, {
                user: member.user.tag,
                guild: member.guild.name
            });
        }
    }

    async handleMemberLeave(member) {
        try {
            // Bot kontrolü
            if (member.user.bot) return;

            // Guild ayarlarını al
            const guild = await Guild.findOne({ where: { id: member.guild.id } });
            if (!guild || !guild.leaveEnabled) return;

            // Leave kanalını kontrol et
            const leaveChannel = await member.guild.channels.fetch(guild.leaveChannelId).catch(() => null);
            if (!leaveChannel) return;

            // Leave mesajını oluştur
            const leaveMessage = this.formatMessage(
                guild.leaveMessage || '{user} sunucumuzu terk etti. Görüşürüz! 👋',
                member,
                member.guild
            );

            // Üyelik süresini hesapla
            const membershipDuration = Date.now() - member.joinedTimestamp;
            const daysMember = Math.floor(membershipDuration / (1000 * 60 * 60 * 24));
            const hoursMember = Math.floor((membershipDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            // Leave embed
            const leaveEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('👋 Güle Güle!')
                .setDescription(leaveMessage)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: '👤 Kullanıcı', value: member.user.username, inline: true },
                    { name: '📅 Katılma', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: '⏰ Üyelik Süresi', value: `${daysMember} gün ${hoursMember} saat`, inline: true },
                    { name: '📊 Kalan Üye', value: member.guild.memberCount.toString(), inline: true },
                    { name: '🆔 User ID', value: member.user.id, inline: true },
                    { name: '📅 Ayrılma', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({
                    text: 'Tekrar bekleriz!',
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            // Üyelik süresine göre renk ayarla
            if (daysMember < 1) {
                leaveEmbed.setColor('#ff0000'); // Hemen ayrıldı - kırmızı
                leaveEmbed.addFields({
                    name: '⚠️ Kısa Süre',
                    value: `Bu üye çok kısa süre sunucuda kaldı (${daysMember === 0 ? `${hoursMember} saat` : `${daysMember} gün`})`,
                    inline: false
                });
            } else if (daysMember < 7) {
                leaveEmbed.setColor('#ffa500'); // 1 haftadan az - turuncu
            } else {
                leaveEmbed.setColor('#ff6b6b'); // Normal - kırmızı/pembe
            }

            // Leave mesajını gönder
            await leaveChannel.send({ embeds: [leaveEmbed] });

            logger.info(`Üye ayrılması kaydedildi: ${member.user.tag} -> ${member.guild.name} (${daysMember} gün üye)`);

        } catch (error) {
            logger.error('Leave handler hatası', error, {
                user: member.user.tag,
                guild: member.guild.name
            });
        }
    }

    formatMessage(message, member, guild) {
        return message
            .replace(/{user}/g, member.toString())
            .replace(/{username}/g, member.user.username)
            .replace(/{mention}/g, member.toString())
            .replace(/{guild}/g, guild.name)
            .replace(/{server}/g, guild.name)
            .replace(/{memberCount}/g, guild.memberCount.toString())
            .replace(/{memberCount:ordinal}/g, this.getOrdinal(guild.memberCount))
            .replace(/{memberCount:th}/g, this.getOrdinal(guild.memberCount));
    }

    getOrdinal(number) {
        // Türkçe sıra sayıları
        const lastDigit = number % 10;
        const lastTwoDigits = number % 100;
        
        // Özel durumlar
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return number + '.';
        }
        
        // Normal durumlar
        switch (lastDigit) {
            case 1:
                return number + '.';
            case 2:
                return number + '.';
            case 3:
                return number + '.';
            default:
                return number + '.';
        }
    }
}

module.exports = WelcomeHandler;



