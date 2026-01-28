const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');
const { getAuditLogger } = require('../utils/auditLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reaction-roles')
        .setDescription('⭐ Tepki rolleri sistemi - mesaja emoji ekleyerek rol verme')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('📝 Yeni tepki rol mesajı oluştur')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Mesajın gönderileceği kanal')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('Embed başlığı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Embed açıklaması')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('Embed rengi (hex kod, örn: #5865F2)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('➕ Mevcut tepki rol mesajına emoji-rol ekle')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('Mesaj ID')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('Emoji (emoji veya emoji ID)')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Verilecek rol')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('➖ Tepki rol mesajından emoji-rol çifti sil')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('Mesaj ID')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('Kaldırılacak emoji')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Aktif tepki rol mesajlarını listele')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('🗑️ Tepki rol mesajını sil')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('Mesaj ID')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const db = getDatabase();
        const auditLogger = getAuditLogger();
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            if (subcommand === 'create') {
                await this.handleCreate(interaction, db, auditLogger);
            } else if (subcommand === 'add') {
                await this.handleAdd(interaction, db, auditLogger);
            } else if (subcommand === 'remove') {
                await this.handleRemove(interaction, db, auditLogger);
            } else if (subcommand === 'list') {
                await this.handleList(interaction, db);
            } else if (subcommand === 'delete') {
                await this.handleDelete(interaction, db, auditLogger);
            }
        } catch (error) {
            logger.error(`[ReactionRoles] Error in ${subcommand}:`, error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ef4444')
                .setTitle('❌ Hata')
                .setDescription(`Bir hata oluştu: ${error.message}`)
                .setTimestamp();

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleCreate(interaction, db, auditLogger) {
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const colorHex = interaction.options.getString('color') || '#5865F2';

        // Validate hex color
        const colorRegex = /^#([A-Fa-f0-9]{6})$/;
        if (!colorRegex.test(colorHex)) {
            return interaction.editReply({
                content: '❌ Geçersiz renk kodu! Örnek: #5865F2',
                ephemeral: true
            });
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + '\n\n**Rol almak için aşağıdaki emojilere tıklayın:**')
            .setColor(colorHex)
            .setFooter({ text: 'Tepki Rolleri - Emoji eklemek için bir yöneticiden yardım isteyin' })
            .setTimestamp();

        // Send message to channel
        const message = await channel.send({ embeds: [embed] });

        // Save to database
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.reactionRoles) {
            settings.reactionRoles = [];
        }

        settings.reactionRoles.push({
            messageId: message.id,
            channelId: channel.id,
            guildId: interaction.guild.id,
            title,
            description,
            color: colorHex,
            roles: {}, // emoji -> roleId mapping
            createdBy: interaction.user.id,
            createdAt: new Date().toISOString()
        });

        db.setGuildSettings(interaction.guild.id, settings);

        // Audit log
        auditLogger.log({
            guildId: interaction.guild.id,
            action: 'REACTION_ROLE_CREATE',
            executor: interaction.user,
            target: { id: message.id, name: title, type: 'message' },
            changes: { channelId: channel.id },
            reason: 'Reaction role message created'
        });

        const successEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Tepki Rol Mesajı Oluşturuldu')
            .setDescription(`Mesaj ${channel} kanalına gönderildi!\n\n**Mesaj ID:** \`${message.id}\`\n\nEmoji eklemek için:\n\`/reaction-roles add message-id:${message.id} emoji:😀 role:@Rol\``)
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
    },

    async handleAdd(interaction, db, auditLogger) {
        await interaction.deferReply({ ephemeral: true });

        const messageId = interaction.options.getString('message-id');
        const emojiInput = interaction.options.getString('emoji');
        const role = interaction.options.getRole('role');

        // Get reaction role config
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        const reactionRole = settings.reactionRoles?.find(rr => rr.messageId === messageId);

        if (!reactionRole) {
            return interaction.editReply({
                content: '❌ Bu mesaj ID için tepki rol sistemi bulunamadı!',
                ephemeral: true
            });
        }

        // Fetch message
        let message;
        try {
            const channel = await interaction.guild.channels.fetch(reactionRole.channelId);
            message = await channel.messages.fetch(messageId);
        } catch (error) {
            return interaction.editReply({
                content: '❌ Mesaj bulunamadı! Silinmiş olabilir.',
                ephemeral: true
            });
        }

        // Parse emoji (handle both custom and unicode)
        let emoji = emojiInput.trim();
        let emojiId = null;
        
        // Check if it's a custom emoji <:name:id> or <a:name:id>
        const customEmojiMatch = emoji.match(/<a?:(\w+):(\d+)>/);
        if (customEmojiMatch) {
            emoji = customEmojiMatch[1]; // emoji name
            emojiId = customEmojiMatch[2]; // emoji id
        }

        // Add reaction to message
        try {
            if (emojiId) {
                // Custom emoji
                await message.react(emojiId);
            } else {
                // Unicode emoji
                await message.react(emoji);
            }
        } catch (error) {
            return interaction.editReply({
                content: '❌ Emoji eklenemedi! Geçersiz emoji veya bot izinleri yetersiz.',
                ephemeral: true
            });
        }

        // Save to database
        const emojiKey = emojiId || emoji;
        reactionRole.roles[emojiKey] = role.id;
        db.setGuildSettings(interaction.guild.id, settings);

        // Update embed
        const currentEmbed = message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(currentEmbed);
        
        // Add role to description
        const roleLines = Object.entries(reactionRole.roles).map(([e, r]) => {
            const roleObj = interaction.guild.roles.cache.get(r);
            const emojiDisplay = e.length > 3 ? `<:${emoji}:${e}>` : e;
            return `${emojiDisplay} - ${roleObj ? roleObj.toString() : 'Rol Silinmiş'}`;
        });

        updatedEmbed.setDescription(
            reactionRole.description + 
            '\n\n**Rol almak için aşağıdaki emojilere tıklayın:**\n' + 
            roleLines.join('\n')
        );

        await message.edit({ embeds: [updatedEmbed] });

        // Audit log
        auditLogger.log({
            guildId: interaction.guild.id,
            action: 'REACTION_ROLE_ADD',
            executor: interaction.user,
            target: { id: role.id, name: role.name, type: 'role' },
            changes: { messageId, emoji: emojiKey },
            reason: 'Reaction role pair added'
        });

        const successEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Emoji-Rol Eklendi')
            .setDescription(`${emojiId ? `<:${emoji}:${emojiId}>` : emoji} → ${role}\n\nKullanıcılar bu emojiye tıklayarak rolü alabilir!`)
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
    },

    async handleRemove(interaction, db, auditLogger) {
        await interaction.deferReply({ ephemeral: true });

        const messageId = interaction.options.getString('message-id');
        const emojiInput = interaction.options.getString('emoji');

        const settings = db.getGuildSettings(interaction.guild.id) || {};
        const reactionRole = settings.reactionRoles?.find(rr => rr.messageId === messageId);

        if (!reactionRole) {
            return interaction.editReply({
                content: '❌ Bu mesaj ID için tepki rol sistemi bulunamadı!'
            });
        }

        // Parse emoji
        let emoji = emojiInput.trim();
        const customEmojiMatch = emoji.match(/<a?:(\w+):(\d+)>/);
        if (customEmojiMatch) {
            emoji = customEmojiMatch[2]; // use ID for custom emoji
        }

        // Remove from database
        if (reactionRole.roles[emoji]) {
            const roleId = reactionRole.roles[emoji];
            delete reactionRole.roles[emoji];
            db.setGuildSettings(interaction.guild.id, settings);

            // Fetch and update message
            try {
                const channel = await interaction.guild.channels.fetch(reactionRole.channelId);
                const message = await channel.messages.fetch(messageId);
                
                // Remove bot's reaction
                const reaction = message.reactions.cache.find(r => 
                    r.emoji.id === emoji || r.emoji.name === emoji
                );
                if (reaction) {
                    await reaction.users.remove(interaction.client.user.id);
                }

                // Update embed
                const currentEmbed = message.embeds[0];
                const updatedEmbed = EmbedBuilder.from(currentEmbed);
                const roleLines = Object.entries(reactionRole.roles).map(([e, r]) => {
                    const roleObj = interaction.guild.roles.cache.get(r);
                    const emojiDisplay = e.length > 3 ? `<:emoji:${e}>` : e;
                    return `${emojiDisplay} - ${roleObj ? roleObj.toString() : 'Rol Silinmiş'}`;
                });

                updatedEmbed.setDescription(
                    reactionRole.description + 
                    '\n\n**Rol almak için aşağıdaki emojilere tıklayın:**\n' + 
                    (roleLines.length > 0 ? roleLines.join('\n') : '*Henüz emoji eklenmedi*')
                );

                await message.edit({ embeds: [updatedEmbed] });
            } catch (error) {
                logger.warn('[ReactionRoles] Could not update message:', error.message);
            }

            // Audit log
            const role = interaction.guild.roles.cache.get(roleId);
            auditLogger.log({
                guildId: interaction.guild.id,
                action: 'REACTION_ROLE_REMOVE',
                executor: interaction.user,
                target: { id: roleId, name: role?.name || 'Unknown', type: 'role' },
                changes: { messageId, emoji },
                reason: 'Reaction role pair removed'
            });

            return interaction.editReply({
                content: `✅ Emoji-rol çifti kaldırıldı!`
            });
        } else {
            return interaction.editReply({
                content: '❌ Bu emoji için rol eşleşmesi bulunamadı!'
            });
        }
    },

    async handleList(interaction, db) {
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        const reactionRoles = settings.reactionRoles || [];

        if (reactionRoles.length === 0) {
            return interaction.reply({
                content: '📭 Bu sunucuda aktif tepki rol mesajı bulunmuyor.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle('📋 Aktif Tepki Rol Mesajları')
            .setDescription('Sunucudaki tepki rol mesajları:')
            .setTimestamp();

        for (const rr of reactionRoles) {
            const roleCount = Object.keys(rr.roles).length;
            const channelMention = `<#${rr.channelId}>`;
            
            embed.addFields({
                name: `📨 ${rr.title}`,
                value: `**Kanal:** ${channelMention}\n**Mesaj ID:** \`${rr.messageId}\`\n**Roller:** ${roleCount} adet\n**Oluşturan:** <@${rr.createdBy}>`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleDelete(interaction, db, auditLogger) {
        await interaction.deferReply({ ephemeral: true });

        const messageId = interaction.options.getString('message-id');
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        const reactionRoleIndex = settings.reactionRoles?.findIndex(rr => rr.messageId === messageId);

        if (reactionRoleIndex === -1 || !settings.reactionRoles) {
            return interaction.editReply({
                content: '❌ Bu mesaj ID için tepki rol sistemi bulunamadı!'
            });
        }

        const reactionRole = settings.reactionRoles[reactionRoleIndex];

        // Remove from database
        settings.reactionRoles.splice(reactionRoleIndex, 1);
        db.setGuildSettings(interaction.guild.id, settings);

        // Delete message
        try {
            const channel = await interaction.guild.channels.fetch(reactionRole.channelId);
            const message = await channel.messages.fetch(messageId);
            await message.delete();
        } catch (error) {
            logger.warn('[ReactionRoles] Could not delete message:', error.message);
        }

        // Audit log
        auditLogger.log({
            guildId: interaction.guild.id,
            action: 'REACTION_ROLE_DELETE',
            executor: interaction.user,
            target: { id: messageId, name: reactionRole.title, type: 'message' },
            reason: 'Reaction role message deleted'
        });

        const successEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Tepki Rol Mesajı Silindi')
            .setDescription(`"${reactionRole.title}" mesajı ve tüm tepki rol ayarları silindi.`)
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
    }
};

