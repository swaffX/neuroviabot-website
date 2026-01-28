// ==========================================
// 🤖 NeuroViaBot - Logging Handler
// ==========================================

const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');

class LoggingHandler {
    constructor(client) {
        this.client = client;
        this.isEnabled = true; // Logging her zaman aktif
    }

    // Handler'ı yeniden başlat
    restart() {
        // LoggingHandler için özel restart gerekmez
        // Fonksiyonlar zaten export ediliyor
    }
}

/**
 * Mesaj silme logu
 */
async function logMessageDelete(message) {
    try {
        if (!message.guild) return;
        if (!message.author) return; // Author null olabilir (partial message)
        if (message.author.bot) return;
        
        const db = getDatabase();
        const settings = db.getGuildSettings(message.guild.id);
        
        // Loglama aktif mi ve kanal ayarlanmış mı kontrol et
        if (!settings.loggingEnabled || !settings.messageLogChannel) return;
        
        const logChannel = message.guild.channels.cache.get(settings.messageLogChannel);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('🗑️ Mesaj Silindi')
            .setDescription(`**Kanal:** ${message.channel}\n**Yazar:** ${message.author}`)
            .addFields(
                { name: '📝 İçerik', value: message.content?.substring(0, 1024) || '*İçerik yok*' },
                { name: '📅 Tarih', value: new Date().toLocaleString('tr-TR'), inline: true },
                { name: '🆔 Mesaj ID', value: message.id, inline: true }
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
        
        logger.info(`[Logging] Message deleted: ${message.author.tag} in ${message.guild.name}`);
    } catch (error) {
        console.error('[Logging] Message delete error:', error.message);
    }
}

/**
 * Mesaj düzenleme logu
 */
async function logMessageUpdate(oldMessage, newMessage) {
    try {
        if (!newMessage.guild) return;
        if (!newMessage.author) return; // Author null olabilir
        if (newMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return; // İçerik değişmediyse logla
        
        const db = getDatabase();
        const settings = db.getGuildSettings(newMessage.guild.id);
        
        if (!settings.loggingEnabled || !settings.messageLogChannel) return;
        
        const logChannel = newMessage.guild.channels.cache.get(settings.messageLogChannel);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('✏️ Mesaj Düzenlendi')
            .setDescription(`**Kanal:** ${newMessage.channel}\n**Yazar:** ${newMessage.author}`)
            .addFields(
                { name: '📝 Eski İçerik', value: oldMessage.content.substring(0, 1024) || '*İçerik yok*' },
                { name: '📝 Yeni İçerik', value: newMessage.content.substring(0, 1024) || '*İçerik yok*' },
                { name: '🔗 Mesaj', value: `[Git](${newMessage.url})`, inline: true }
            )
            .setThumbnail(newMessage.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
        
        logger.info(`[Logging] Message edited: ${newMessage.author.tag} in ${newMessage.guild.name}`);
    } catch (error) {
        console.error('[Logging] Message edit error:', error.message);
    }
}

/**
 * Üye katılma logu
 */
async function logMemberJoin(member) {
    try {
        const db = getDatabase();
        const settings = db.getGuildSettings(member.guild.id);
        
        if (!settings.loggingEnabled || !settings.serverLogChannel) return;
        
        const logChannel = member.guild.channels.cache.get(settings.serverLogChannel);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor('#44ff44')
            .setTitle('👋 Yeni Üye Katıldı')
            .setDescription(`${member} sunucuya katıldı!`)
            .addFields(
                { name: '👤 Kullanıcı', value: `${member.user.tag}`, inline: true },
                { name: '🆔 ID', value: member.id, inline: true },
                { name: '📅 Hesap Oluşturma', value: member.user.createdAt.toLocaleDateString('tr-TR'), inline: true },
                { name: '📊 Toplam Üye', value: `${member.guild.memberCount}`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
        
        logger.info(`[Logging] Member joined: ${member.user.tag} in ${member.guild.name}`);
    } catch (error) {
        logger.error('❌ Member join logging hatası', error);
    }
}

/**
 * Üye ayrılma logu
 */
async function logMemberLeave(member) {
    try {
        const db = getDatabase();
        const settings = db.getGuildSettings(member.guild.id);
        
        if (!settings.loggingEnabled || !settings.serverLogChannel) return;
        
        const logChannel = member.guild.channels.cache.get(settings.serverLogChannel);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('👋 Üye Ayrıldı')
            .setDescription(`${member} sunucudan ayrıldı.`)
            .addFields(
                { name: '👤 Kullanıcı', value: `${member.user.tag}`, inline: true },
                { name: '🆔 ID', value: member.id, inline: true },
                { name: '📅 Katılma Tarihi', value: member.joinedAt ? member.joinedAt.toLocaleDateString('tr-TR') : 'Bilinmiyor', inline: true },
                { name: '📊 Kalan Üye', value: `${member.guild.memberCount}`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
        
        logger.info(`[Logging] Member left: ${member.user.tag} from ${member.guild.name}`);
    } catch (error) {
        logger.error('❌ Member leave logging hatası', error);
    }
}

/**
 * Rol oluşturma logu
 */
async function logRoleCreate(role) {
    try {
        const db = getDatabase();
        const settings = db.getGuildSettings(role.guild.id);
        
        if (!settings.loggingEnabled || !settings.serverLogChannel) return;
        
        const logChannel = role.guild.channels.cache.get(settings.serverLogChannel);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor('#44ff44')
            .setTitle('🎭 Yeni Rol Oluşturuldu')
            .setDescription(`**Rol:** ${role}`)
            .addFields(
                { name: '📛 İsim', value: role.name, inline: true },
                { name: '🆔 ID', value: role.id, inline: true },
                { name: '🎨 Renk', value: role.hexColor, inline: true }
            )
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
        
        logger.info(`[Logging] Role created: ${role.name} in ${role.guild.name}`);
    } catch (error) {
        logger.error('❌ Role create logging hatası', error);
    }
}

/**
 * Rol silme logu
 */
async function logRoleDelete(role) {
    try {
        const db = getDatabase();
        const settings = db.getGuildSettings(role.guild.id);
        
        if (!settings.loggingEnabled || !settings.serverLogChannel) return;
        
        const logChannel = role.guild.channels.cache.get(settings.serverLogChannel);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('🗑️ Rol Silindi')
            .addFields(
                { name: '📛 İsim', value: role.name, inline: true },
                { name: '🆔 ID', value: role.id, inline: true },
                { name: '🎨 Renk', value: role.hexColor, inline: true }
            )
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
        
        logger.info(`[Logging] Role deleted: ${role.name} from ${role.guild.name}`);
    } catch (error) {
        logger.error('❌ Role delete logging hatası', error);
    }
}

/**
 * Kanal oluşturma logu
 */
async function logChannelCreate(channel) {
    try {
        if (!channel.guild) return;
        
        const db = getDatabase();
        const settings = db.getGuildSettings(channel.guild.id);
        
        if (!settings.loggingEnabled || !settings.serverLogChannel) return;
        
        const logChannel = channel.guild.channels.cache.get(settings.serverLogChannel);
        if (!logChannel) return;
        
        const channelTypes = {
            0: 'Metin Kanalı',
            2: 'Ses Kanalı',
            4: 'Kategori',
            5: 'Duyuru Kanalı',
            13: 'Stage Kanalı',
            15: 'Forum Kanalı'
        };
        
        const embed = new EmbedBuilder()
            .setColor('#44ff44')
            .setTitle('📢 Yeni Kanal Oluşturuldu')
            .addFields(
                { name: '📛 İsim', value: channel.name, inline: true },
                { name: '🆔 ID', value: channel.id, inline: true },
                { name: '📁 Tip', value: channelTypes[channel.type] || 'Bilinmiyor', inline: true }
            )
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
        
        logger.info(`[Logging] Channel created: ${channel.name} in ${channel.guild.name}`);
    } catch (error) {
        logger.error('❌ Channel create logging hatası', error);
    }
}

/**
 * Kanal silme logu
 */
async function logChannelDelete(channel) {
    try {
        if (!channel.guild) return;
        
        const db = getDatabase();
        const settings = db.getGuildSettings(channel.guild.id);
        
        if (!settings.loggingEnabled || !settings.serverLogChannel) return;
        
        const logChannel = channel.guild.channels.cache.get(settings.serverLogChannel);
        if (!logChannel || logChannel.id === channel.id) return; // Silinen kanal log kanalıysa loglamayalım
        
        const channelTypes = {
            0: 'Metin Kanalı',
            2: 'Ses Kanalı',
            4: 'Kategori',
            5: 'Duyuru Kanalı',
            13: 'Stage Kanalı',
            15: 'Forum Kanalı'
        };
        
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('🗑️ Kanal Silindi')
            .addFields(
                { name: '📛 İsim', value: channel.name, inline: true },
                { name: '🆔 ID', value: channel.id, inline: true },
                { name: '📁 Tip', value: channelTypes[channel.type] || 'Bilinmiyor', inline: true }
            )
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
        
        logger.info(`[Logging] Channel deleted: ${channel.name} from ${channel.guild.name}`);
    } catch (error) {
        logger.error('❌ Channel delete logging hatası', error);
    }
}

/**
 * Ses kanalı aktivitesi logu
 */
async function logVoiceStateUpdate(oldState, newState) {
    try {
        const db = getDatabase();
        const settings = db.getGuildSettings(newState.guild.id);
        
        if (!settings.loggingEnabled || !settings.serverLogChannel) return;
        
        const logChannel = newState.guild.channels.cache.get(settings.serverLogChannel);
        if (!logChannel) return;
        
        let embed;
        
        // Ses kanalına katıldı
        if (!oldState.channelId && newState.channelId) {
            embed = new EmbedBuilder()
                .setColor('#44ff44')
                .setTitle('🔊 Ses Kanalına Katıldı')
                .setDescription(`${newState.member} ses kanalına katıldı`)
                .addFields(
                    { name: '📢 Kanal', value: `${newState.channel}`, inline: true },
                    { name: '👤 Üye', value: `${newState.member.user.tag}`, inline: true }
                )
                .setTimestamp();
        }
        // Ses kanalından ayrıldı
        else if (oldState.channelId && !newState.channelId) {
            embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('🔇 Ses Kanalından Ayrıldı')
                .setDescription(`${newState.member} ses kanalından ayrıldı`)
                .addFields(
                    { name: '📢 Kanal', value: `${oldState.channel}`, inline: true },
                    { name: '👤 Üye', value: `${newState.member.user.tag}`, inline: true }
                )
                .setTimestamp();
        }
        // Ses kanalı değiştirdi
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('🔄 Ses Kanalı Değiştirdi')
                .setDescription(`${newState.member} ses kanalını değiştirdi`)
                .addFields(
                    { name: '📢 Eski Kanal', value: `${oldState.channel}`, inline: true },
                    { name: '📢 Yeni Kanal', value: `${newState.channel}`, inline: true },
                    { name: '👤 Üye', value: `${newState.member.user.tag}`, inline: true }
                )
                .setTimestamp();
        }
        
        if (embed) {
            await logChannel.send({ embeds: [embed] });
            logger.info(`[Logging] Voice state updated: ${newState.member.user.tag} in ${newState.guild.name}`);
        }
    } catch (error) {
        logger.error('❌ Voice state logging hatası', error);
    }
}

module.exports = LoggingHandler;
module.exports.LoggingHandler = LoggingHandler;
module.exports.logMessageDelete = logMessageDelete;
module.exports.logMessageUpdate = logMessageUpdate;
module.exports.logMemberJoin = logMemberJoin;
module.exports.logMemberLeave = logMemberLeave;
module.exports.logRoleCreate = logRoleCreate;
module.exports.logRoleDelete = logRoleDelete;
module.exports.logChannelCreate = logChannelCreate;
module.exports.logChannelDelete = logChannelDelete;
module.exports.logVoiceStateUpdate = logVoiceStateUpdate;

