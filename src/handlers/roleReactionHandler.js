const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');

class RoleReactionHandler {
    constructor(client) {
        this.client = client;
        this.reactionRoles = new Map(); // MessageID -> {emoji: roleId}
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('messageReactionAdd', async (reaction, user) => {
            await this.handleReactionAdd(reaction, user);
        });

        this.client.on('messageReactionRemove', async (reaction, user) => {
            await this.handleReactionRemove(reaction, user);
        });
    }

    // Handler'ı yeniden başlat
    restart() {
        // RoleReactionHandler için özel restart gerekmez
        // Event listener'lar zaten kurulu
    }

    // Tepki rol ekleme metodu
    async addReactionRole(guildId, channelId, messageId, emoji, roleId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                logger.error(`Guild bulunamadı: ${guildId}`);
                return false;
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                logger.error(`Channel bulunamadı: ${channelId}`);
                return false;
            }

            const message = await channel.messages.fetch(messageId);
            if (!message) {
                logger.error(`Message bulunamadı: ${messageId}`);
                return false;
            }

            const role = guild.roles.cache.get(roleId);
            if (!role) {
                logger.error(`Role bulunamadı: ${roleId}`);
                return false;
            }

            // Reaction role'u kaydet
            if (!this.reactionRoles.has(messageId)) {
                this.reactionRoles.set(messageId, {});
            }
            
            this.reactionRoles.get(messageId)[emoji] = roleId;

            // Mesaja emoji ekle
            await message.react(emoji);

            logger.info(`✅ Tepki rol eklendi: ${guildId} - ${messageId} - ${emoji} -> ${roleId}`);
            return true;
        } catch (error) {
            logger.error('Tepki rol ekleme hatası:', error);
            return false;
        }
    }

    async handleReactionAdd(reaction, user) {
        try {
            // Bot kontrolü
            if (user.bot) return;

            // Partial reaction kontrolü
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    logger.error('Reaction fetch hatası', error);
                    return;
                }
            }

            // Reaction role var mı kontrol et
            const messageId = reaction.message.id;
            const emoji = reaction.emoji.name || reaction.emoji.id;
            
            if (!this.reactionRoles.has(messageId)) {
                return; // Bu mesaj için reaction role yok
            }

            const roleData = this.reactionRoles.get(messageId);
            const roleId = roleData[emoji];
            
            if (!roleId) {
                return; // Bu emoji için rol yok
            }

            // Guild member al
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id).catch(() => null);
            
            if (!member) {
                logger.debug('Member bulunamadı', { userId: user.id, guildId: guild.id });
                return;
            }

            // Rolü al
            const role = await guild.roles.fetch(roleId).catch(() => null);
            if (!role) {
                logger.warn('Reaction role bulunamadı', { roleId, messageId });
                return;
            }

            // Rol zaten var mı kontrol et
            if (member.roles.cache.has(roleId)) {
                return; // Zaten var
            }

            // Rolü ver
            try {
                await member.roles.add(role, 'Reaction Role');
                
                logger.info(`Reaction role verildi: ${user.tag} -> ${role.name} (${guild.name})`);

                // DM ile bildirim gönder (opsiyonel)
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('🎭 Rol Alındı!')
                        .setDescription(`**${guild.name}** sunucusunda **${role.name}** rolünü aldınız!`)
                        .addFields({
                            name: '📍 Sunucu',
                            value: guild.name,
                            inline: true
                        })
                        .setThumbnail(guild.iconURL())
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    // DM gönderilemedi, sessizce devam et
                    logger.debug('Reaction role DM gönderilemedi', { user: user.tag, error: dmError.message });
                }

            } catch (error) {
                logger.error('Reaction role verme hatası', error, {
                    user: user.tag,
                    role: role.name,
                    guild: guild.name
                });

                // Reaction'ı geri al
                try {
                    await reaction.users.remove(user.id);
                } catch (removeError) {
                    logger.error('Reaction geri alma hatası', removeError);
                }
            }

        } catch (error) {
            logger.error('Reaction add handler hatası', error);
        }
    }

    async handleReactionRemove(reaction, user) {
        try {
            // Bot kontrolü
            if (user.bot) return;

            // Partial reaction kontrolü
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    logger.error('Reaction fetch hatası', error);
                    return;
                }
            }

            // Reaction role var mı kontrol et
            const messageId = reaction.message.id;
            const emoji = reaction.emoji.name || reaction.emoji.id;
            
            if (!this.reactionRoles.has(messageId)) {
                return; // Bu mesaj için reaction role yok
            }

            const roleData = this.reactionRoles.get(messageId);
            const roleId = roleData[emoji];
            
            if (!roleId) {
                return; // Bu emoji için rol yok
            }

            // Guild member al
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id).catch(() => null);
            
            if (!member) {
                return;
            }

            // Rolü al
            const role = await guild.roles.fetch(roleId).catch(() => null);
            if (!role) {
                return;
            }

            // Rol var mı kontrol et
            if (!member.roles.cache.has(roleId)) {
                return; // Zaten yok
            }

            // Rolü çıkar
            try {
                await member.roles.remove(role, 'Reaction Role Removed');
                
                logger.info(`Reaction role çıkarıldı: ${user.tag} -> ${role.name} (${guild.name})`);

                // DM ile bildirim gönder (opsiyonel)
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setTitle('🎭 Rol Çıkarıldı!')
                        .setDescription(`**${guild.name}** sunucusunda **${role.name}** rolünüz çıkarıldı!`)
                        .addFields({
                            name: '📍 Sunucu',
                            value: guild.name,
                            inline: true
                        })
                        .setThumbnail(guild.iconURL())
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    // DM gönderilemedi, sessizce devam et
                    logger.debug('Reaction role remove DM gönderilemedi', { user: user.tag, error: dmError.message });
                }

            } catch (error) {
                logger.error('Reaction role çıkarma hatası', error, {
                    user: user.tag,
                    role: role.name,
                    guild: guild.name
                });
            }

        } catch (error) {
            logger.error('Reaction remove handler hatası', error);
        }
    }

    // Reaction role ekle
    addReactionRole(messageId, emoji, roleId) {
        if (!this.reactionRoles.has(messageId)) {
            this.reactionRoles.set(messageId, {});
        }
        
        const roleData = this.reactionRoles.get(messageId);
        roleData[emoji] = roleId;
        
        logger.info(`Reaction role eklendi: ${messageId} - ${emoji} -> ${roleId}`);
    }

    // Reaction role çıkar
    removeReactionRole(messageId, emoji) {
        if (!this.reactionRoles.has(messageId)) {
            return false;
        }
        
        const roleData = this.reactionRoles.get(messageId);
        delete roleData[emoji];
        
        // Eğer mesajda hiç reaction role kalmadıysa, mesajı da sil
        if (Object.keys(roleData).length === 0) {
            this.reactionRoles.delete(messageId);
        }
        
        logger.info(`Reaction role çıkarıldı: ${messageId} - ${emoji}`);
        return true;
    }

    // Mesajın reaction role'lerini al
    getReactionRoles(messageId) {
        return this.reactionRoles.get(messageId) || {};
    }

    // Tüm reaction role'leri al
    getAllReactionRoles() {
        const result = {};
        for (const [messageId, roles] of this.reactionRoles.entries()) {
            result[messageId] = { ...roles };
        }
        return result;
    }

    // Reaction role'leri yükle (restart sonrası için)
    loadReactionRoles(data) {
        this.reactionRoles.clear();
        
        for (const [messageId, roles] of Object.entries(data)) {
            this.reactionRoles.set(messageId, { ...roles });
        }
        
        logger.info(`${Object.keys(data).length} reaction role mesajı yüklendi`);
    }

    // Reaction role'leri dosyaya kaydet
    saveReactionRoles() {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const data = this.getAllReactionRoles();
            const filePath = path.join(__dirname, '../data/reaction-roles.json');
            
            // Data klasörünü oluştur
            const dataDir = path.dirname(filePath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            logger.debug('Reaction roles kaydedildi');
        } catch (error) {
            logger.error('Reaction roles kaydetme hatası', error);
        }
    }

    // Reaction role'leri dosyadan yükle
    loadFromFile() {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const filePath = path.join(__dirname, '../data/reaction-roles.json');
            
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                this.loadReactionRoles(data);
            }
        } catch (error) {
            logger.error('Reaction roles yükleme hatası', error);
        }
    }

    // Periyodik kaydetme
    startAutoSave() {
        setInterval(() => {
            this.saveReactionRoles();
        }, 300000); // 5 dakikada bir kaydet
    }

    // Mesaj silindi mi kontrol et
    async validateMessage(messageId) {
        try {
            for (const guild of this.client.guilds.cache.values()) {
                for (const channel of guild.channels.cache.values()) {
                    if (channel.isTextBased()) {
                        try {
                            await channel.messages.fetch(messageId);
                            return true; // Mesaj bulundu
                        } catch (error) {
                            // Mesaj bu kanalda yok, devam et
                        }
                    }
                }
            }
            
            // Mesaj hiçbir kanalda bulunamadı
            logger.warn(`Reaction role mesajı bulunamadı: ${messageId}`);
            this.reactionRoles.delete(messageId);
            return false;
            
        } catch (error) {
            logger.error('Mesaj doğrulama hatası', error);
            return false;
        }
    }

    // Cleanup - silinmiş mesajları temizle
    async cleanup() {
        const messageIds = Array.from(this.reactionRoles.keys());
        
        for (const messageId of messageIds) {
            await this.validateMessage(messageId);
        }
        
        logger.info('Reaction role cleanup tamamlandı');
    }
}

module.exports = RoleReactionHandler;





