// ==========================================
// 🤖 NeuroViaBot - Guild Member Remove Event
// ==========================================

const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');
const config = require('../config.js');
const { getEventDeduplicator } = require('../utils/eventDeduplicator');

module.exports = {
    name: 'guildMemberRemove',
    once: false,
    async execute(member, client) {
        try {
            const guild = member.guild;
            const deduplicator = getEventDeduplicator();
            
            // Deduplicate event - combine guildId and userId for unique key
            const eventKey = `${guild.id}:${member.user.id}`;
            if (deduplicator.isDuplicate('memberLeave', eventKey, 5000)) {
                // Skip duplicate event (within 5 seconds)
                return;
            }
            
            // Log member leave
            logger.info(`Üye ayrıldı: ${member.user.tag} (${member.user.id})`, {
                guild: guild.name,
                guildId: guild.id,
                memberCount: guild.memberCount
            });

            // Leave message gönderimi
            await sendLeaveMessage(member);
            
            // Database'den temizleme/güncelleme
            await updateDatabase(member);

            // Analytics tracking
            if (client.analyticsHandler) {
                client.analyticsHandler.trackMemberLeave(guild.id);
            }

        } catch (error) {
            logger.error('guildMemberRemove event hatası', error, {
                guild: member.guild.name,
                user: member.user.tag
            });
        }
    }
};

// Ayrılma mesajı gönderme
async function sendLeaveMessage(member) {
    try {
        const guild = member.guild;
        
        // Ayrılma kanalını bul
        const leaveChannels = ['leave', 'ayrılan', 'bye', 'farewell', 'log', 'genel', 'general'];
        let leaveChannel = null;

        for (const channelName of leaveChannels) {
            leaveChannel = guild.channels.cache.find(ch => 
                ch.name.toLowerCase().includes(channelName.toLowerCase()) && ch.isTextBased()
            );
            if (leaveChannel) break;
        }

        // Sistem kanalı varsa onu kullan
        if (!leaveChannel && guild.systemChannel) {
            leaveChannel = guild.systemChannel;
        }

        // Hiç kanal bulunamazsa ilk text kanalını kullan
        if (!leaveChannel) {
            leaveChannel = guild.channels.cache.find(ch => ch.isTextBased());
        }

        if (!leaveChannel) {
            logger.warn('Ayrılma mesajı için uygun kanal bulunamadı', {
                guild: guild.name
            });
            return;
        }

        // Üye ne kadar süre kaldığını hesapla
        const joinedTimestamp = member.joinedTimestamp;
        const stayDuration = joinedTimestamp ? Date.now() - joinedTimestamp : null;
        
        let stayDurationText = 'Bilinmiyor';
        if (stayDuration) {
            const days = Math.floor(stayDuration / (1000 * 60 * 60 * 24));
            const hours = Math.floor((stayDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            if (days > 0) {
                stayDurationText = `${days} gün${hours > 0 ? ` ${hours} saat` : ''}`;
            } else if (hours > 0) {
                const minutes = Math.floor((stayDuration % (1000 * 60 * 60)) / (1000 * 60));
                stayDurationText = `${hours} saat${minutes > 0 ? ` ${minutes} dakika` : ''}`;
            } else {
                const minutes = Math.floor(stayDuration / (1000 * 60));
                stayDurationText = `${minutes} dakika`;
            }
        }

        // Ayrılma embed'i oluştur
        const leaveEmbed = new EmbedBuilder()
            .setColor('#ff4757') // Kırmızı ton
            .setTitle('👋 Güle Güle!')
            .setDescription(`**${member.user.tag}** sunucumuzdan ayrıldı.`)
            .addFields(
                {
                    name: '👤 Kullanıcı',
                    value: `${member.user}`,
                    inline: true
                },
                {
                    name: '⏰ Sunucuda Kaldığı Süre',
                    value: stayDurationText,
                    inline: true
                },
                {
                    name: '👥 Kalan Üye Sayısı',
                    value: `${guild.memberCount}`,
                    inline: true
                }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ 
                text: `ID: ${member.user.id}`, 
                iconURL: guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();

        // Üye rolleri varsa göster
        if (member.roles && member.roles.cache.size > 1) { // @everyone hariç
            const roles = member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.name)
                .slice(0, 10); // Max 10 rol göster

            if (roles.length > 0) {
                leaveEmbed.addFields({
                    name: '🎭 Sahip Olduğu Roller',
                    value: roles.join(', '),
                    inline: false
                });
            }
        }

        // Çok kısa süre kaldıysa özel uyarı
        if (stayDuration && stayDuration < 5 * 60 * 1000) { // 5 dakikadan az
            leaveEmbed.addFields({
                name: '⚡ Hızlı Ayrılma',
                value: 'Bu kullanıcı çok kısa süre kaldı (5 dakikadan az)',
                inline: false
            });
        }

        await leaveChannel.send({ embeds: [leaveEmbed] });

        logger.success(`Ayrılma mesajı gönderildi: ${member.user.tag}`, {
            guild: guild.name,
            channel: leaveChannel.name,
            stayDuration: stayDurationText
        });

    } catch (error) {
        console.error('[Leave] Send message error:', error.message);
    }
}

// Database güncelleme (simple-db kullanarak)
async function updateDatabase(member) {
    try {
        const { getDatabase } = require('../database/simple-db');
        const db = getDatabase();
        
        const memberKey = `${member.user.id}_${member.guild.id}`;
        const memberData = db.data.members?.get(memberKey);
        
        if (memberData) {
            memberData.leftAt = new Date().toISOString();
            memberData.lastActive = new Date().toISOString();
            db.data.members.set(memberKey, memberData);
            db.saveData();
            
            logger.debug('Member ayrılma tarihi database\'e kaydedildi', {
                user: member.user.tag,
                guild: member.guild.name
            });
        }

    } catch (error) {
        // Database hatası kritik değil, sadece logla
        console.error('[Leave] Database update error:', error.message);
    }
}
