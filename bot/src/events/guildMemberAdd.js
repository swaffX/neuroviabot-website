// ==========================================
// 🤖 NeuroViaBot - Guild Member Add Event
// ==========================================

const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');
const config = require('../config.js');
const { getEventDeduplicator } = require('../utils/eventDeduplicator');

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    async execute(member, client) {
        try {
            const guild = member.guild;
            const deduplicator = getEventDeduplicator();
            
            // Deduplicate event - combine guildId and userId for unique key
            const eventKey = `${guild.id}:${member.user.id}`;
            if (deduplicator.isDuplicate('memberJoin', eventKey, 5000)) {
                // Skip duplicate event (within 5 seconds)
                return;
            }
            
            // Log member join
            logger.info(`Yeni üye katıldı: ${member.user.tag} (${member.user.id})`, {
                guild: guild.name,
                guildId: guild.id,
                memberCount: guild.memberCount
            });

            // Welcome message gönderimi
            await sendWelcomeMessage(member);
            
            // Auto role verme
            await giveAutoRoles(member);
            
            // Database'e kaydetme (eğer veritabanı aktifse)
            await saveToDatabase(member);

            // Analytics tracking
            if (client.analyticsHandler) {
                client.analyticsHandler.trackMemberJoin(guild.id);
            }

        } catch (error) {
            logger.error('guildMemberAdd event hatası', error, {
                guild: member.guild.name,
                user: member.user.tag
            });
        }
    }
};

// Karşılama mesajı gönderme
async function sendWelcomeMessage(member) {
    try {
        const guild = member.guild;
        
        // Karşılama kanalını bul (genelde #genel, #karşılama, #welcome)
        const welcomeChannels = ['welcome', 'karşılama', 'genel', 'general', 'giriş'];
        let welcomeChannel = null;

        for (const channelName of welcomeChannels) {
            welcomeChannel = guild.channels.cache.find(ch => 
                ch.name.toLowerCase().includes(channelName.toLowerCase()) && ch.isTextBased()
            );
            if (welcomeChannel) break;
        }

        // Sistem kanalı varsa onu kullan
        if (!welcomeChannel && guild.systemChannel) {
            welcomeChannel = guild.systemChannel;
        }

        // Hiç kanal bulunamazsa ilk text kanalını kullan
        if (!welcomeChannel) {
            welcomeChannel = guild.channels.cache.find(ch => ch.isTextBased());
        }

        if (!welcomeChannel) {
            logger.warn('Karşılama mesajı için uygun kanal bulunamadı', {
                guild: guild.name
            });
            return;
        }

        // Güzel karşılama embed'i oluştur
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('🌟 Hoş Geldin!')
            .setDescription(`**${member.user.tag}** sunucumuza hoş geldin! 🎉\n\nSunucumuzda keyifli vakit geçirmen dileğiyle!`)
            .addFields(
                {
                    name: '👋 Merhaba',
                    value: `Selam ${member.user}!`,
                    inline: true
                },
                {
                    name: '👥 Üye Sayısı',
                    value: `${guild.memberCount}. üye`,
                    inline: true
                },
                {
                    name: '📅 Katılım',
                    value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                    inline: true
                }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/welcome-banner.png')
            .setFooter({ 
                text: `${guild.name} • Hoş geldin!`, 
                iconURL: guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();

        // Bot yaşı kontrolü (spam hesap önleme)
        const accountAge = Date.now() - member.user.createdTimestamp;
        const daysSinceCreated = Math.floor(accountAge / (1000 * 60 * 60 * 24));

        if (daysSinceCreated < 7) {
            welcomeEmbed.addFields({
                name: '⚠️ Uyarı',
                value: `Bu hesap ${daysSinceCreated} gün önce oluşturulmuş (Yeni hesap)`,
                inline: false
            });
        }

        await welcomeChannel.send({ 
            content: `🎉 ${member.user} sunucumuza hoş geldin! 🎉`,
            embeds: [welcomeEmbed] 
        });

        logger.success(`Karşılama mesajı gönderildi: ${member.user.tag}`, {
            guild: guild.name,
            channel: welcomeChannel.name
        });

    } catch (error) {
        logger.error('Karşılama mesajı gönderme hatası', error);
    }
}

// Otomatik rol verme
async function giveAutoRoles(member) {
    try {
        const guild = member.guild;
        
        // Otomatik verilecek rolleri bul (genelde @Member, @Üye gibi)
        const autoRoleNames = ['Member', 'Üye', 'User', 'Kullanıcı'];
        const autoRoles = [];

        for (const roleName of autoRoleNames) {
            const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (role) {
                autoRoles.push(role);
            }
        }

        // Bot değilse rolleri ver
        if (!member.user.bot && autoRoles.length > 0) {
            await member.roles.add(autoRoles);
            
            logger.success(`Otomatik roller verildi: ${member.user.tag}`, {
                guild: guild.name,
                roles: autoRoles.map(r => r.name)
            });
        }

        // Bot ise özel bot rolü ver
        if (member.user.bot) {
            const botRole = guild.roles.cache.find(r => 
                r.name.toLowerCase().includes('bot') && 
                r.name.toLowerCase() !== guild.roles.everyone.name.toLowerCase()
            );
            
            if (botRole) {
                await member.roles.add(botRole);
                logger.success(`Bot rolü verildi: ${member.user.tag}`, {
                    guild: guild.name,
                    role: botRole.name
                });
            }
        }

    } catch (error) {
        logger.error('Otomatik rol verme hatası', error);
    }
}

// Database'e kaydetme
async function saveToDatabase(member) {
    try {
        // Eğer model dosyaları varsa ve database aktifse
        const { getOrCreateUser, getOrCreateGuild, getOrCreateGuildMember } = require('../models/index');
        
        // User kaydı
        await getOrCreateUser(member.user.id, {
            username: member.user.username,
            discriminator: member.user.discriminator,
            globalName: member.user.globalName,
            avatar: member.user.avatar
        });

        // Guild kaydı
        await getOrCreateGuild(member.guild.id, {
            name: member.guild.name
        });

        // GuildMember kaydı
        await getOrCreateGuildMember(member.user.id, member.guild.id, {
            nickname: member.nickname,
            joinedAt: member.joinedAt
        });

        logger.debug('Member veritabanına kaydedildi', {
            user: member.user.tag,
            guild: member.guild.name
        });

    } catch (error) {
        // Database hatası kritik değil, sadece logla
        logger.debug('Database kayıt hatası (kritik değil)', error);
    }
}
