const cron = require('cron');
const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getOrCreateGuild } = require('../models');
const { logger } = require('../utils/logger');

class BackupHandler {
    constructor(client) {
        this.client = client;
        this.scheduledJobs = new Map();
        
        this.setupEventListeners();
        this.initializeScheduledBackups();
    }

    setupEventListeners() {
        // Handle backup button interactions
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            const customId = interaction.customId;

            if (customId.startsWith('backup_restore_')) {
                await this.handleRestoreConfirmation(interaction);
            } else if (customId === 'backup_cancel') {
                await this.handleCancelAction(interaction);
            } else if (customId.startsWith('backup_download_')) {
                await this.handleDownloadBackup(interaction);
            }
        });
    }

    async initializeScheduledBackups() {
        try {
            // Load all guilds and filter for backup settings
            const { Guild } = require('../models');
            const guilds = await Guild.findAll();

            let scheduledCount = 0;
            for (const guildData of guilds) {
                try {
                    // Safely parse backup settings
                    let settings = null;
                    if (guildData.backupSettings) {
                        if (typeof guildData.backupSettings === 'string') {
                            settings = JSON.parse(guildData.backupSettings);
                        } else {
                            settings = guildData.backupSettings;
                        }
                    }

                    if (settings && settings.autoBackup === true) {
                        this.scheduleBackup(guildData.id, settings.interval || '0 0 * * *'); // Default: daily
                        scheduledCount++;
                    }
                } catch (parseError) {
                    logger.warn(`Failed to parse backup settings for guild ${guildData.id}:`, parseError);
                }
            }

            logger.info(`Initialized ${scheduledCount} scheduled backup jobs from ${guilds.length} guilds`);
        } catch (error) {
            logger.error('Failed to initialize scheduled backups:', error);
        }
    }

    scheduleBackup(guildId, interval) {
        // Stop existing job if any
        if (this.scheduledJobs.has(guildId)) {
            this.scheduledJobs.get(guildId).stop();
        }

        let cronPattern;
        switch (interval) {
            case 'daily':
                cronPattern = '0 3 * * *'; // Every day at 3 AM
                break;
            case 'weekly':
                cronPattern = '0 3 * * 0'; // Every Sunday at 3 AM
                break;
            case 'monthly':
                cronPattern = '0 3 1 * *'; // First day of month at 3 AM
                break;
            default:
                return;
        }

        const job = new cron.CronJob(cronPattern, async () => {
            await this.performAutomaticBackup(guildId);
        });

        job.start();
        this.scheduledJobs.set(guildId, job);
        
        logger.info(`Scheduled ${interval} backup for guild ${guildId}`);
    }

    async performAutomaticBackup(guildId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                logger.warn(`Guild ${guildId} not found for automatic backup`);
                return;
            }

            const guildData = await getOrCreateGuild(guildId, guild.name);
            
            // Create backup
            const backupData = await this.createGuildBackup(guild, false);
            const backupId = this.generateBackupId('auto');
            
            // Save backup to file
            const backupsDir = path.join(__dirname, '../data/backups');
            await fs.mkdir(backupsDir, { recursive: true });
            
            const backupFile = path.join(backupsDir, `${backupId}.json`);
            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));

            // Update guild backup list
            const backupInfo = {
                id: backupId,
                name: `Auto-${new Date().toLocaleDateString('tr-TR')}`,
                createdAt: new Date(),
                createdBy: 'system',
                size: JSON.stringify(backupData).length,
                includesMessages: false,
                channelCount: backupData.channels.length,
                roleCount: backupData.roles.length,
                memberCount: backupData.members.length,
                automatic: true
            };

            let backups = guildData.backups || [];
            backups.push(backupInfo);

            // Keep only last 10 automatic backups
            const autoBackups = backups.filter(b => b.automatic);
            if (autoBackups.length > 10) {
                const oldBackups = autoBackups.slice(0, autoBackups.length - 10);
                for (const oldBackup of oldBackups) {
                    try {
                        await fs.unlink(path.join(backupsDir, `${oldBackup.id}.json`));
                    } catch (error) {
                        logger.warn(`Could not delete old backup file: ${oldBackup.id}`);
                    }
                }
                backups = backups.filter(b => !oldBackups.some(ob => ob.id === b.id));
            }

            await guildData.update({ 
                backups,
                lastAutoBackup: new Date()
            });

            // Send notification to designated channel
            const notificationChannel = guild.channels.cache.find(c => 
                c.name.includes('log') || c.name.includes('admin')
            );

            if (notificationChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#43b581')
                    .setTitle('🔄 Otomatik Backup Tamamlandı')
                    .setDescription('Zamanlanmış sunucu backup\'ı başarıyla oluşturuldu!')
                    .addFields(
                        { name: '📁 Backup ID', value: `\`${backupId}\``, inline: true },
                        { name: '📊 Boyut', value: `${(backupInfo.size / 1024).toFixed(2)} KB`, inline: true },
                        { name: '📺 Kanallar', value: backupInfo.channelCount.toString(), inline: true }
                    )
                    .setTimestamp();

                await notificationChannel.send({ embeds: [embed] });
            }

            logger.info(`Automatic backup created for guild ${guild.name}: ${backupId}`);

        } catch (error) {
            logger.error(`Automatic backup failed for guild ${guildId}:`, error);
        }
    }

    async handleRestoreConfirmation(interaction) {
        const [, , backupId, clearServer] = interaction.customId.split('_');
        const shouldClear = clearServer === 'true';

        try {
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#faa61a')
                        .setTitle('⏳ Backup Geri Yükleniyor')
                        .setDescription('Backup geri yükleme işlemi başlatıldı, lütfen bekleyin...')
                        .setTimestamp()
                ],
                components: []
            });

            // Load backup data
            const backupFile = path.join(__dirname, '../data/backups', `${backupId}.json`);
            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));

            // Perform restore operation
            await this.restoreGuildFromBackup(interaction.guild, backupData, shouldClear);

            const successEmbed = new EmbedBuilder()
                .setColor('#43b581')
                .setTitle('✅ Backup Geri Yüklendi')
                .setDescription('Sunucu backup\'ı başarıyla geri yüklendi!')
                .addFields(
                    { name: '📁 Backup', value: backupData.name || backupId, inline: true },
                    { name: '📅 Backup Tarihi', value: new Date(backupData.createdAt).toLocaleDateString('tr-TR'), inline: true },
                    { name: '🔄 İşlem Türü', value: shouldClear ? 'Tam Geri Yükleme' : 'Üzerine Yazma', inline: true }
                )
                .setFooter({ text: 'Bazı değişikliklerin etkili olması birkaç dakika sürebilir' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            logger.error('Backup restore error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#f04747')
                .setTitle('❌ Geri Yükleme Hatası')
                .setDescription('Backup geri yükleme işlemi başarısız oldu.')
                .addFields({ name: 'Hata', value: error.message })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }
    }

    async handleCancelAction(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#36393f')
            .setTitle('❌ İşlem İptal Edildi')
            .setDescription('Backup işlemi iptal edildi.')
            .setTimestamp();

        await interaction.update({ embeds: [embed], components: [] });
    }

    async handleDownloadBackup(interaction) {
        const backupId = interaction.customId.split('_')[2];

        try {
            const backupFile = path.join(__dirname, '../data/backups', `${backupId}.json`);
            const backupData = await fs.readFile(backupFile, 'utf8');

            // Create a download link or send file
            const embed = new EmbedBuilder()
                .setColor('#5865f2')
                .setTitle('💾 Backup İndirme')
                .setDescription('Backup dosyası hazırlandı!')
                .addFields(
                    { name: '📁 Dosya', value: `${backupId}.json`, inline: true },
                    { name: '📊 Boyut', value: `${(backupData.length / 1024).toFixed(2)} KB`, inline: true }
                )
                .setFooter({ text: 'Backup dosyasını güvenli bir yerde saklayın' })
                .setTimestamp();

            // For now, just show info. In production, you'd implement file serving
            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            logger.error('Backup download error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#f04747')
                .setTitle('❌ İndirme Hatası')
                .setDescription('Backup dosyası indirilemedi.')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }

    async restoreGuildFromBackup(guild, backupData, clearServer = false) {
        // This is a complex operation that should be done carefully
        // In a real implementation, you'd want to add more safety checks
        
        if (clearServer) {
            // Delete existing channels and roles (except @everyone)
            const channels = await guild.channels.fetch();
            for (const [channelId, channel] of channels) {
                if (channel.deletable) {
                    try {
                        await channel.delete('Backup restore - clearing server');
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
                    } catch (error) {
                        logger.warn(`Could not delete channel ${channel.name}: ${error.message}`);
                    }
                }
            }

            const roles = await guild.roles.fetch();
            for (const [roleId, role] of roles) {
                if (role.name !== '@everyone' && role.deletable) {
                    try {
                        await role.delete('Backup restore - clearing server');
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
                    } catch (error) {
                        logger.warn(`Could not delete role ${role.name}: ${error.message}`);
                    }
                }
            }
        }

        // Restore roles
        const roleMapping = new Map();
        for (const roleData of backupData.roles) {
            try {
                const role = await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    mentionable: roleData.mentionable,
                    permissions: roleData.permissions,
                    reason: 'Backup restore'
                });
                roleMapping.set(roleData.id, role.id);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
            } catch (error) {
                logger.warn(`Could not restore role ${roleData.name}: ${error.message}`);
            }
        }

        // Restore channels
        const channelMapping = new Map();
        
        // First pass: Create channels without parents
        for (const channelData of backupData.channels.filter(c => !c.parentId)) {
            try {
                const channel = await guild.channels.create({
                    name: channelData.name,
                    type: channelData.type,
                    topic: channelData.topic,
                    nsfw: channelData.nsfw,
                    rateLimitPerUser: channelData.rateLimitPerUser,
                    reason: 'Backup restore'
                });
                channelMapping.set(channelData.id, channel.id);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
            } catch (error) {
                logger.warn(`Could not restore channel ${channelData.name}: ${error.message}`);
            }
        }

        // Second pass: Create child channels
        for (const channelData of backupData.channels.filter(c => c.parentId)) {
            try {
                const parentId = channelMapping.get(channelData.parentId);
                const channel = await guild.channels.create({
                    name: channelData.name,
                    type: channelData.type,
                    parent: parentId,
                    topic: channelData.topic,
                    nsfw: channelData.nsfw,
                    rateLimitPerUser: channelData.rateLimitPerUser,
                    reason: 'Backup restore'
                });
                channelMapping.set(channelData.id, channel.id);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
            } catch (error) {
                logger.warn(`Could not restore channel ${channelData.name}: ${error.message}`);
            }
        }

        // Restore permission overwrites
        for (const channelData of backupData.channels) {
            const channelId = channelMapping.get(channelData.id);
            if (!channelId) continue;

            const channel = guild.channels.cache.get(channelId);
            if (!channel) continue;

            for (const overwrite of channelData.permissionOverwrites) {
                try {
                    const targetId = overwrite.type === 0 ? roleMapping.get(overwrite.id) || overwrite.id : overwrite.id;
                    await channel.permissionOverwrites.create(targetId, {
                        allow: overwrite.allow,
                        deny: overwrite.deny
                    }, { reason: 'Backup restore' });
                    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
                } catch (error) {
                    logger.warn(`Could not restore permission overwrite: ${error.message}`);
                }
            }
        }

        logger.info(`Backup restore completed for guild ${guild.name}`);
    }

    async createGuildBackup(guild, includeMessages = false) {
        // This is the same function from the backup command
        // Extracted here for reuse
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

        return backupData;
    }

    generateBackupId(prefix = 'backup') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    stopScheduledBackup(guildId) {
        if (this.scheduledJobs.has(guildId)) {
            this.scheduledJobs.get(guildId).stop();
            this.scheduledJobs.delete(guildId);
            logger.info(`Stopped scheduled backup for guild ${guildId}`);
        }
    }

    updateScheduledBackup(guildId, interval) {
        this.stopScheduledBackup(guildId);
        if (interval !== 'disabled') {
            this.scheduleBackup(guildId, interval);
        }
    }
}

module.exports = BackupHandler;
