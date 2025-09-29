const { EmbedBuilder } = require('discord.js');
const { CustomCommand } = require('../models');
const { logger } = require('../utils/logger');

class CustomCommandHandler {
    constructor(client) {
        this.client = client;
        this.cooldowns = new Map(); // Cooldown tracking
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('messageCreate', async (message) => {
            await this.handleCustomCommand(message);
        });
    }

    async handleCustomCommand(message) {
        try {
            // Bot mesajlarını ve DM'leri görmezden gel
            if (message.author.bot || !message.guild) return;

            // Mesaj prefix kontrolü (! veya /)
            const content = message.content.trim();
            if (!content.startsWith('!') && !content.startsWith('/')) return;

            // Komut ve argümanları parse et
            const args = content.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (!commandName) return;

            // Custom komut ara (isim veya alias ile)
            const customCommand = await CustomCommand.findOne({
                where: {
                    guildId: message.guild.id,
                    enabled: true,
                    [require('sequelize').Op.or]: [
                        { name: commandName },
                        { aliases: { [require('sequelize').Op.contains]: [commandName] } }
                    ]
                }
            });

            if (!customCommand) return;

            // İzin kontrolü
            if (!this.checkPermissions(message.member, customCommand)) {
                const noPermissionEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetki Yok')
                    .setDescription('Bu komutu kullanmak için gerekli yetkiniz yok!')
                    .setTimestamp();

                const permissionMessage = await message.reply({ embeds: [noPermissionEmbed] });
                
                // 5 saniye sonra sil
                setTimeout(async () => {
                    await permissionMessage.delete().catch(() => {});
                }, 5000);
                return;
            }

            // Cooldown kontrolü
            if (!this.checkCooldown(message.author.id, customCommand)) {
                const cooldownEmbed = new EmbedBuilder()
                    .setColor('#ffa500')
                    .setTitle('⏰ Cooldown')
                    .setDescription(`Bu komutu tekrar kullanabilmek için **${customCommand.cooldown}** saniye beklemelisiniz!`)
                    .setTimestamp();

                const cooldownMessage = await message.reply({ embeds: [cooldownEmbed] });
                
                // 3 saniye sonra sil
                setTimeout(async () => {
                    await cooldownMessage.delete().catch(() => {});
                }, 3000);
                return;
            }

            // Usage limit kontrolü
            if (customCommand.usageLimit && customCommand.usageCount >= customCommand.usageLimit) {
                const limitEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🚫 Kullanım Limiti')
                    .setDescription('Bu komutun kullanım limiti dolmuştur!')
                    .setTimestamp();

                const limitMessage = await message.reply({ embeds: [limitEmbed] });
                
                // 5 saniye sonra sil
                setTimeout(async () => {
                    await limitMessage.delete().catch(() => {});
                }, 5000);
                return;
            }

            // Komutu çalıştır
            await this.executeCustomCommand(message, customCommand, args);

        } catch (error) {
            logger.error('Custom command handler hatası', error);
        }
    }

    async executeCustomCommand(message, customCommand, args) {
        try {
            // Orijinal komutu sil (eğer ayarlıysa)
            if (customCommand.deleteCommand) {
                await message.delete().catch(() => {});
            }

            // İçeriği işle
            let processedContent = this.processVariables(customCommand.content, message, args);
            let embedData = null;

            // Embed kontrolü
            if (customCommand.contentType === 'embed' || customCommand.contentType === 'both') {
                if (customCommand.embedData) {
                    embedData = this.processEmbedVariables(customCommand.embedData, message, args);
                }
            }

            // Mesajı gönder
            const messageOptions = {};

            if (customCommand.contentType === 'text' || customCommand.contentType === 'both') {
                if (processedContent && processedContent.trim()) {
                    messageOptions.content = processedContent;
                }
            }

            if (embedData) {
                const embed = new EmbedBuilder();
                
                if (embedData.title) embed.setTitle(embedData.title);
                if (embedData.description) embed.setDescription(embedData.description);
                if (embedData.color) embed.setColor(embedData.color);
                if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
                if (embedData.image) embed.setImage(embedData.image);
                if (embedData.footer) {
                    embed.setFooter({
                        text: embedData.footer.text,
                        iconURL: embedData.footer.iconURL || message.guild.iconURL()
                    });
                }
                if (embedData.fields && Array.isArray(embedData.fields)) {
                    embedData.fields.forEach(field => {
                        embed.addFields({
                            name: field.name,
                            value: field.value,
                            inline: field.inline || false
                        });
                    });
                }
                
                embed.setTimestamp();
                messageOptions.embeds = [embed];
            }

            // Mesajı gönder
            const sentMessage = await message.channel.send(messageOptions);

            // Reactions ekle
            if (customCommand.reactions && customCommand.reactions.length > 0) {
                for (const reaction of customCommand.reactions) {
                    try {
                        await sentMessage.react(reaction);
                    } catch (error) {
                        logger.debug('Reaction ekleme hatası', { reaction, error: error.message });
                    }
                }
            }

            // Auto delete
            if (customCommand.autoDelete && customCommand.autoDelete > 0) {
                setTimeout(async () => {
                    await sentMessage.delete().catch(() => {});
                }, customCommand.autoDelete * 1000);
            }

            // İstatistikleri güncelle
            await this.updateCommandStats(customCommand, message.author.id);

            // Cooldown ayarla
            this.setCooldown(message.author.id, customCommand);

            logger.debug(`Custom command executed: ${customCommand.name} by ${message.author.tag}`);

        } catch (error) {
            logger.error('Custom command execution hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Komut Hatası')
                .setDescription('Özel komut çalıştırılırken bir hata oluştu!')
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    }

    checkPermissions(member, customCommand) {
        // Herkes kullanabilir ayarı
        if (customCommand.everyoneCanUse) return true;

        const permissions = customCommand.permissions || {};

        // Özel kullanıcı kontrolü
        if (permissions.users && permissions.users.includes(member.user.id)) {
            return true;
        }

        // Rol kontrolü
        if (permissions.roles && permissions.roles.length > 0) {
            const hasRole = permissions.roles.some(roleId => member.roles.cache.has(roleId));
            if (hasRole) return true;
        }

        // Discord permissions kontrolü
        if (permissions.permissions && permissions.permissions.length > 0) {
            const hasPermission = permissions.permissions.some(perm => member.permissions.has(perm));
            if (hasPermission) return true;
        }

        // Kanal kontrolü
        if (permissions.channels && permissions.channels.length > 0) {
            return permissions.channels.includes(member.guild.channels.cache.get(member.channel?.id)?.id);
        }

        // Varsayılan: izin yok
        return customCommand.everyoneCanUse;
    }

    checkCooldown(userId, customCommand) {
        if (!customCommand.cooldown || customCommand.cooldown <= 0) return true;

        const cooldownKey = `${userId}-${customCommand.id}`;
        const now = Date.now();
        
        if (this.cooldowns.has(cooldownKey)) {
            const expirationTime = this.cooldowns.get(cooldownKey) + (customCommand.cooldown * 1000);
            if (now < expirationTime) {
                return false;
            }
        }

        return true;
    }

    setCooldown(userId, customCommand) {
        if (!customCommand.cooldown || customCommand.cooldown <= 0) return;

        const cooldownKey = `${userId}-${customCommand.id}`;
        this.cooldowns.set(cooldownKey, Date.now());
    }

    async updateCommandStats(customCommand, userId) {
        try {
            await customCommand.update({
                usageCount: (customCommand.usageCount || 0) + 1,
                lastUsed: new Date(),
                lastUsedBy: userId
            });
        } catch (error) {
            logger.error('Command stats update hatası', error);
        }
    }

    processVariables(content, message, args = []) {
        return content
            .replace(/{user}/g, message.author.toString())
            .replace(/{user\.mention}/g, message.author.toString())
            .replace(/{user\.username}/g, message.author.username)
            .replace(/{user\.tag}/g, message.author.tag)
            .replace(/{user\.id}/g, message.author.id)
            .replace(/{user\.avatar}/g, message.author.displayAvatarURL())
            .replace(/{guild}/g, message.guild.name)
            .replace(/{guild\.name}/g, message.guild.name)
            .replace(/{guild\.id}/g, message.guild.id)
            .replace(/{guild\.memberCount}/g, message.guild.memberCount.toString())
            .replace(/{guild\.icon}/g, message.guild.iconURL() || '')
            .replace(/{channel}/g, message.channel.toString())
            .replace(/{channel\.mention}/g, message.channel.toString())
            .replace(/{channel\.name}/g, message.channel.name)
            .replace(/{channel\.id}/g, message.channel.id)
            .replace(/{args}/g, args.join(' '))
            .replace(/{args\.(\d+)}/g, (match, index) => args[parseInt(index)] || '')
            .replace(/{argsCount}/g, args.length.toString())
            .replace(/{date}/g, new Date().toLocaleDateString('tr-TR'))
            .replace(/{time}/g, new Date().toLocaleTimeString('tr-TR'))
            .replace(/{timestamp}/g, `<t:${Math.floor(Date.now() / 1000)}:F>`)
            .replace(/{timestamp\.relative}/g, `<t:${Math.floor(Date.now() / 1000)}:R>`)
            .replace(/{random\.(\d+)-(\d+)}/g, (match, min, max) => {
                return Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1)) + parseInt(min);
            })
            .replace(/{randomUser}/g, () => {
                const members = Array.from(message.guild.members.cache.values());
                const randomMember = members[Math.floor(Math.random() * members.length)];
                return randomMember ? randomMember.toString() : message.author.toString();
            })
            .replace(/{memberCount}/g, message.guild.memberCount.toString())
            .replace(/{boostCount}/g, message.guild.premiumSubscriptionCount?.toString() || '0')
            .replace(/{boostLevel}/g, message.guild.premiumTier?.toString() || '0');
    }

    processEmbedVariables(embedData, message, args = []) {
        const processedEmbed = JSON.parse(JSON.stringify(embedData)); // Deep clone

        // Process all string values in embed
        const processString = (str) => {
            if (typeof str !== 'string') return str;
            return this.processVariables(str, message, args);
        };

        if (processedEmbed.title) processedEmbed.title = processString(processedEmbed.title);
        if (processedEmbed.description) processedEmbed.description = processString(processedEmbed.description);
        if (processedEmbed.footer?.text) processedEmbed.footer.text = processString(processedEmbed.footer.text);
        
        if (processedEmbed.fields) {
            processedEmbed.fields.forEach(field => {
                field.name = processString(field.name);
                field.value = processString(field.value);
            });
        }

        return processedEmbed;
    }

    // Cleanup function
    cleanupCooldowns() {
        const now = Date.now();
        const maxCooldown = 3600000; // 1 saat

        for (const [key, timestamp] of this.cooldowns.entries()) {
            if (now - timestamp > maxCooldown) {
                this.cooldowns.delete(key);
            }
        }
    }
}

// Her 30 dakikada bir cooldown temizliği
setInterval(() => {
    if (global.customCommandHandler) {
        global.customCommandHandler.cleanupCooldowns();
    }
}, 1800000); // 30 dakika

module.exports = CustomCommandHandler;



