const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const cron = require('cron');
const { getOrCreateGuild } = require('../models');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Sunucu backup sistemi yönetimi')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Sunucu backup\'ı oluştur')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Backup ismi')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('include-messages')
                        .setDescription('Mesajları dahil et')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('restore')
                .setDescription('Sunucu backup\'ını geri yükle')
                .addStringOption(option =>
                    option
                        .setName('backup-id')
                        .setDescription('Backup ID\'si')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('clear-server')
                        .setDescription('Sunucuyu önce temizle')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Backup\'ları listele')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Backup\'ı sil')
                .addStringOption(option =>
                    option
                        .setName('backup-id')
                        .setDescription('Backup ID\'si')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('schedule')
                .setDescription('Otomatik backup zamanla')
                .addStringOption(option =>
                    option
                        .setName('interval')
                        .setDescription('Backup aralığı')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Günlük', value: 'daily' },
                            { name: 'Haftalık', value: 'weekly' },
                            { name: 'Aylık', value: 'monthly' },
                            { name: 'Kapalı', value: 'disabled' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Backup detaylarını görüntüle')
                .addStringOption(option =>
                    option
                        .setName('backup-id')
                        .setDescription('Backup ID\'si')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

    async execute(interaction) {
        const { guild, user } = interaction;
        const subcommand = interaction.options.getSubcommand();

        try {
            await interaction.deferReply();

            const guildData = await getOrCreateGuild(guild.id, guild.name);

            switch (subcommand) {
                case 'create':
                    await this.handleCreateBackup(interaction, guildData);
                    break;
                case 'restore':
                    await this.handleRestoreBackup(interaction, guildData);
                    break;
                case 'list':
                    await this.handleListBackups(interaction, guildData);
                    break;
                case 'delete':
                    await this.handleDeleteBackup(interaction, guildData);
                    break;
                case 'schedule':
                    await this.handleScheduleBackup(interaction, guildData);
                    break;
                case 'info':
                    await this.handleBackupInfo(interaction, guildData);
                    break;
            }

            logger.info(`Backup command executed: ${subcommand} by ${user.tag} in ${guild.name}`);

        } catch (error) {
            logger.error('Backup command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#f04747')
                .setTitle('❌ Hata')
                .setDescription('Backup işlemi sırasında bir hata oluştu.')
                .addFields({ name: 'Hata', value: error.message })
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleCreateBackup(interaction, guildData) {
        const { guild } = interaction;
        const name = interaction.options.getString('name');
        const includeMessages = interaction.options.getBoolean('include-messages') || false;

        const embed = new EmbedBuilder()
            .setColor('#faa61a')
            .setTitle('⏳ Backup Oluşturuluyor')
            .setDescription('Sunucu backup\'ı oluşturuluyor, lütfen bekleyin...')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        try {
            const backupData = await this.createGuildBackup(guild, includeMessages);
            const backupId = this.generateBackupId();
            
            // Save backup to file
            const backupsDir = path.join(__dirname, '../data/backups');
            await fs.mkdir(backupsDir, { recursive: true });
            
            const backupFile = path.join(backupsDir, `${backupId}.json`);
            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));

            // Update guild backup list
            const backupInfo = {
                id: backupId,
                name: name,
                createdAt: new Date(),
                createdBy: interaction.user.id,
                size: JSON.stringify(backupData).length,
                includesMessages: includeMessages,
                channelCount: backupData.channels.length,
                roleCount: backupData.roles.length,
                memberCount: backupData.members.length
            };

            const backups = guildData.backups || [];
            backups.push(backupInfo);
            await guildData.update({ backups });

            const successEmbed = new EmbedBuilder()
                .setColor('#43b581')
                .setTitle('✅ Backup Oluşturuldu')
                .setDescription(`Sunucu backup'ı başarıyla oluşturuldu!`)
                .addFields(
                    { name: '📁 Backup ID', value: `\`${backupId}\``, inline: true },
                    { name: '📝 İsim', value: name, inline: true },
                    { name: '📊 Boyut', value: `${(backupInfo.size / 1024).toFixed(2)} KB`, inline: true },
                    { name: '📺 Kanallar', value: backupInfo.channelCount.toString(), inline: true },
                    { name: '👥 Roller', value: backupInfo.roleCount.toString(), inline: true },
                    { name: '📱 Üyeler', value: backupInfo.memberCount.toString(), inline: true }
                )
                .setFooter({ text: `Backup ID: ${backupId}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            throw new Error(`Backup oluşturulamadı: ${error.message}`);
        }
    },

    async handleRestoreBackup(interaction, guildData) {
        const backupId = interaction.options.getString('backup-id');
        const clearServer = interaction.options.getBoolean('clear-server') || false;

        // Load backup data
        const backupFile = path.join(__dirname, '../data/backups', `${backupId}.json`);
        
        try {
            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
            
            const confirmEmbed = new EmbedBuilder()
                .setColor('#faa61a')
                .setTitle('⚠️ Backup Geri Yükleme Onayı')
                .setDescription('Bu işlem sunucunuza önemli değişiklikler yapacak!')
                .addFields(
                    { name: '📁 Backup', value: backupData.name || backupId, inline: true },
                    { name: '📅 Oluşturulma', value: new Date(backupData.createdAt).toLocaleDateString('tr-TR'), inline: true },
                    { name: '🗑️ Sunucuyu Temizle', value: clearServer ? 'Evet' : 'Hayır', inline: true },
                    { name: '⚠️ Uyarı', value: clearServer ? 
                        'Mevcut kanallar, roller ve ayarlar silinecek!' : 
                        'Mevcut ayarların üzerine yazılacak!', inline: false }
                )
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`backup_restore_${backupId}_${clearServer}`)
                        .setLabel('Geri Yükle')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔄'),
                    new ButtonBuilder()
                        .setCustomId('backup_cancel')
                        .setLabel('İptal')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❌')
                );

            await interaction.editReply({ embeds: [confirmEmbed], components: [row] });

        } catch (error) {
            throw new Error(`Backup bulunamadı: ${backupId}`);
        }
    },

    async handleListBackups(interaction, guildData) {
        const backups = guildData.backups || [];
        
        if (backups.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#36393f')
                .setTitle('📁 Backup Listesi')
                .setDescription('Henüz hiç backup oluşturulmamış.')
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('📁 Backup Listesi')
            .setDescription(`Toplam ${backups.length} backup bulundu`)
            .setTimestamp();

        backups.slice(0, 10).forEach(backup => {
            embed.addFields({
                name: `📦 ${backup.name}`,
                value: [
                    `**ID:** \`${backup.id}\``,
                    `**Tarih:** ${new Date(backup.createdAt).toLocaleDateString('tr-TR')}`,
                    `**Boyut:** ${(backup.size / 1024).toFixed(2)} KB`,
                    `**Kanallar:** ${backup.channelCount} | **Roller:** ${backup.roleCount}`
                ].join('\n'),
                inline: true
            });
        });

        if (backups.length > 10) {
            embed.setFooter({ text: `Ve ${backups.length - 10} backup daha...` });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    async handleDeleteBackup(interaction, guildData) {
        const backupId = interaction.options.getString('backup-id');
        const backups = guildData.backups || [];
        
        const backup = backups.find(b => b.id === backupId);
        if (!backup) {
            throw new Error('Backup bulunamadı!');
        }

        // Delete backup file
        const backupFile = path.join(__dirname, '../data/backups', `${backupId}.json`);
        try {
            await fs.unlink(backupFile);
        } catch (error) {
            logger.warn(`Backup file could not be deleted: ${backupFile}`);
        }

        // Remove from database
        const updatedBackups = backups.filter(b => b.id !== backupId);
        await guildData.update({ backups: updatedBackups });

        const embed = new EmbedBuilder()
            .setColor('#43b581')
            .setTitle('🗑️ Backup Silindi')
            .setDescription(`**${backup.name}** backup'ı başarıyla silindi.`)
            .addFields(
                { name: '📁 Backup ID', value: `\`${backupId}\``, inline: true },
                { name: '📅 Oluşturulma', value: new Date(backup.createdAt).toLocaleDateString('tr-TR'), inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleScheduleBackup(interaction, guildData) {
        const interval = interaction.options.getString('interval');
        
        // Update scheduled backup settings
        const backupSettings = guildData.backupSettings || {};
        backupSettings.autoBackup = interval !== 'disabled';
        backupSettings.interval = interval;
        backupSettings.lastBackup = guildData.lastAutoBackup || null;

        await guildData.update({ backupSettings });

        if (interval === 'disabled') {
            const embed = new EmbedBuilder()
                .setColor('#43b581')
                .setTitle('⏹️ Otomatik Backup Kapatıldı')
                .setDescription('Otomatik backup sistemi devre dışı bırakıldı.')
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const scheduleText = {
            'daily': 'Her gün saat 03:00',
            'weekly': 'Her Pazar saat 03:00',
            'monthly': 'Her ayın 1\'i saat 03:00'
        };

        const embed = new EmbedBuilder()
            .setColor('#43b581')
            .setTitle('⏰ Otomatik Backup Zamanlandı')
            .setDescription('Otomatik backup sistemi aktif edildi!')
            .addFields(
                { name: '🕒 Zamanlama', value: scheduleText[interval], inline: true },
                { name: '📁 Backup Türü', value: 'Tam Backup (Mesajlar hariç)', inline: true },
                { name: '📊 Maksimum Backup', value: '10 adet', inline: true }
            )
            .setFooter({ text: 'Otomatik backup\'lar "Auto-" öneki ile oluşturulur' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleBackupInfo(interaction, guildData) {
        const backupId = interaction.options.getString('backup-id');
        const backups = guildData.backups || [];
        
        const backup = backups.find(b => b.id === backupId);
        if (!backup) {
            throw new Error('Backup bulunamadı!');
        }

        // Load backup data for detailed info
        try {
            const backupFile = path.join(__dirname, '../data/backups', `${backupId}.json`);
            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));

            const embed = new EmbedBuilder()
                .setColor('#5865f2')
                .setTitle('📁 Backup Detayları')
                .setDescription(`**${backup.name}** backup bilgileri`)
                .addFields(
                    { name: '🆔 Backup ID', value: `\`${backup.id}\``, inline: true },
                    { name: '👤 Oluşturan', value: `<@${backup.createdBy}>`, inline: true },
                    { name: '📅 Oluşturulma', value: new Date(backup.createdAt).toLocaleDateString('tr-TR'), inline: true },
                    { name: '📊 Dosya Boyutu', value: `${(backup.size / 1024).toFixed(2)} KB`, inline: true },
                    { name: '💬 Mesajlar Dahil', value: backup.includesMessages ? 'Evet' : 'Hayır', inline: true },
                    { name: '🔢 Versiyon', value: backupData.version || '1.0', inline: true },
                    { name: '📺 Kanallar', value: `${backup.channelCount} adet`, inline: true },
                    { name: '👥 Roller', value: `${backup.roleCount} adet`, inline: true },
                    { name: '👤 Üyeler', value: `${backup.memberCount} adet`, inline: true }
                )
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`backup_download_${backupId}`)
                        .setLabel('İndir')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('💾'),
                    new ButtonBuilder()
                        .setCustomId(`backup_restore_${backupId}_false`)
                        .setLabel('Geri Yükle')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔄')
                );

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            throw new Error(`Backup dosyası okunamadı: ${error.message}`);
        }
    },

    async createGuildBackup(guild, includeMessages = false) {
        const backupData = {
            version: '2.0',
            name: guild.name,
            icon: guild.iconURL(),
            createdAt: new Date(),
            channels: [],
            roles: [],
            members: [],
            settings: {},
            bans: []
        };

        // Backup channels
        const channels = await guild.channels.fetch();
        for (const [channelId, channel] of channels) {
            const channelData = {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                topic: channel.topic,
                position: channel.position,
                parentId: channel.parentId,
                nsfw: channel.nsfw,
                rateLimitPerUser: channel.rateLimitPerUser,
                permissionOverwrites: []
            };

            // Backup permission overwrites
            for (const [overwriteId, overwrite] of channel.permissionOverwrites.cache) {
                channelData.permissionOverwrites.push({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray()
                });
            }

            // Backup messages if requested
            if (includeMessages && channel.isTextBased()) {
                try {
                    const messages = await channel.messages.fetch({ limit: 100 });
                    channelData.messages = messages.map(msg => ({
                        id: msg.id,
                        content: msg.content,
                        author: {
                            id: msg.author.id,
                            username: msg.author.username,
                            discriminator: msg.author.discriminator
                        },
                        createdAt: msg.createdAt,
                        attachments: msg.attachments.map(att => ({
                            name: att.name,
                            url: att.url
                        }))
                    }));
                } catch (error) {
                    logger.warn(`Could not backup messages for channel ${channel.name}: ${error.message}`);
                }
            }

            backupData.channels.push(channelData);
        }

        // Backup roles
        const roles = await guild.roles.fetch();
        for (const [roleId, role] of roles) {
            if (role.name !== '@everyone') {
                backupData.roles.push({
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    permissions: role.permissions.toArray(),
                    position: role.position
                });
            }
        }

        // Backup members (basic info only)
        const members = await guild.members.fetch();
        for (const [memberId, member] of members) {
            if (!member.user.bot) {
                backupData.members.push({
                    id: member.id,
                    username: member.user.username,
                    discriminator: member.user.discriminator,
                    nickname: member.nickname,
                    roles: member.roles.cache.map(role => role.id),
                    joinedAt: member.joinedAt
                });
            }
        }

        // Backup server settings
        backupData.settings = {
            verificationLevel: guild.verificationLevel,
            defaultMessageNotifications: guild.defaultMessageNotifications,
            explicitContentFilter: guild.explicitContentFilter,
            afkChannelId: guild.afkChannelId,
            afkTimeout: guild.afkTimeout,
            systemChannelId: guild.systemChannelId,
            systemChannelFlags: guild.systemChannelFlags
        };

        // Backup bans
        try {
            const bans = await guild.bans.fetch();
            for (const [userId, ban] of bans) {
                backupData.bans.push({
                    userId: ban.user.id,
                    reason: ban.reason
                });
            }
        } catch (error) {
            logger.warn(`Could not backup bans: ${error.message}`);
        }

        return backupData;
    },

    generateBackupId() {
        return 'backup_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const { guild } = interaction;

        try {
            const guildData = await getOrCreateGuild(guild.id, guild.name);
            const backups = guildData.backups || [];

            const filtered = backups
                .filter(backup => backup.id.includes(focusedValue) || backup.name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25)
                .map(backup => ({
                    name: `${backup.name} (${backup.id})`,
                    value: backup.id
                }));

            await interaction.respond(filtered);
        } catch (error) {
            logger.error('Backup autocomplete error:', error);
            await interaction.respond([]);
        }
    }
};





