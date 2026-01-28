const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');

class RaidProtectionHandler {
    constructor(client) {
        this.client = client;
        this.db = getDatabase();
        this.joinTracker = new Map(); // guildId -> [{userId, timestamp}]
        this.verificationPending = new Map(); // userId -> {guildId, joinedAt}
        
        this.setupListeners();
        logger.info('✅ Raid Protection Handler initialized');
    }

    setupListeners() {
        this.client.on('guildMemberAdd', async (member) => {
            await this.checkForRaid(member);
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId === 'verify_user') {
                await this.handleVerification(interaction);
            }
        });
    }

    async checkForRaid(member) {
        try {
            const guildId = member.guild.id;
            const settings = this.getRaidSettings(guildId);
            
            if (!settings.enabled) return;

            // Track join
            if (!this.joinTracker.has(guildId)) {
                this.joinTracker.set(guildId, []);
            }

            const joins = this.joinTracker.get(guildId);
            const now = Date.now();
            
            // Add current join
            joins.push({
                userId: member.user.id,
                timestamp: now
            });

            // Clean old joins (older than detection window)
            const recentJoins = joins.filter(j => now - j.timestamp < settings.detectionWindow);
            this.joinTracker.set(guildId, recentJoins);

            // Check if raid threshold exceeded
            if (recentJoins.length >= settings.joinThreshold) {
                await this.activateRaidMode(member.guild, recentJoins);
                return;
            }

            // Check if verification is required
            if (settings.verificationEnabled) {
                await this.requireVerification(member);
            }

        } catch (error) {
            logger.error('[RaidProtection] Error checking for raid:', error);
        }
    }

    async activateRaidMode(guild, recentJoins) {
        try {
            logger.warn(`[RaidProtection] Raid detected in ${guild.name}! ${recentJoins.length} joins detected`);

            const settings = this.getRaidSettings(guild.id);

            // Update settings to raid mode
            settings.raidModeActive = true;
            settings.raidModeActivatedAt = Date.now();
            this.updateRaidSettings(guild.id, settings);

            // Execute raid protection actions
            if (settings.autoKickNewMembers) {
                // Kick recent joiners
                for (const join of recentJoins) {
                    const member = await guild.members.fetch(join.userId).catch(() => null);
                    if (member) {
                        await member.kick('Raid protection: Auto-kick').catch(() => {});
                    }
                }
            }

            if (settings.lockdownServer) {
                // Lock all channels
                await this.lockdownChannels(guild);
            }

            // Send alert to mod channel
            await this.sendRaidAlert(guild, recentJoins);

            // Auto-disable raid mode after duration
            setTimeout(() => {
                this.deactivateRaidMode(guild.id);
            }, settings.raidModeDuration);

        } catch (error) {
            logger.error('[RaidProtection] Error activating raid mode:', error);
        }
    }

    async lockdownChannels(guild) {
        try {
            const everyoneRole = guild.roles.everyone;
            
            for (const channel of guild.channels.cache.values()) {
                if (channel.isTextBased()) {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: false,
                        AddReactions: false
                    }).catch(() => {});
                }
            }

            logger.info(`[RaidProtection] Locked down ${guild.name}`);
        } catch (error) {
            logger.error('[RaidProtection] Error locking down channels:', error);
        }
    }

    async unlockChannels(guild) {
        try {
            const everyoneRole = guild.roles.everyone;
            
            for (const channel of guild.channels.cache.values()) {
                if (channel.isTextBased()) {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: null,
                        AddReactions: null
                    }).catch(() => {});
                }
            }

            logger.info(`[RaidProtection] Unlocked ${guild.name}`);
        } catch (error) {
            logger.error('[RaidProtection] Error unlocking channels:', error);
        }
    }

    async deactivateRaidMode(guildId) {
        try {
            const settings = this.getRaidSettings(guildId);
            settings.raidModeActive = false;
            this.updateRaidSettings(guildId, settings);

            const guild = this.client.guilds.cache.get(guildId);
            if (guild) {
                if (settings.lockdownServer) {
                    await this.unlockChannels(guild);
                }

                // Send deactivation message
                const modChannel = guild.channels.cache.find(c => 
                    c.name.includes('mod-log') || c.name.includes('raid')
                );

                if (modChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('🛡️ Raid Mode Deactivated')
                        .setDescription('Raid protection has been automatically disabled.')
                        .setTimestamp();

                    await modChannel.send({ embeds: [embed] });
                }
            }

            logger.info(`[RaidProtection] Raid mode deactivated for ${guildId}`);
        } catch (error) {
            logger.error('[RaidProtection] Error deactivating raid mode:', error);
        }
    }

    async requireVerification(member) {
        try {
            const settings = this.getRaidSettings(member.guild.id);
            
            // Create unverified role if it doesn't exist
            let unverifiedRole = member.guild.roles.cache.find(r => r.name === 'Unverified');
            
            if (!unverifiedRole) {
                unverifiedRole = await member.guild.roles.create({
                    name: 'Unverified',
                    color: '#808080',
                    permissions: []
                });

                // Set permissions for all channels
                for (const channel of member.guild.channels.cache.values()) {
                    await channel.permissionOverwrites.create(unverifiedRole, {
                        ViewChannel: false
                    }).catch(() => {});
                }
            }

            // Add unverified role
            await member.roles.add(unverifiedRole);

            // Create verification channel if needed
            let verifyChannel = member.guild.channels.cache.find(c => c.name === 'verification');
            
            if (!verifyChannel) {
                verifyChannel = await member.guild.channels.create({
                    name: 'verification',
                    permissionOverwrites: [
                        {
                            id: member.guild.roles.everyone,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: unverifiedRole.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        }
                    ]
                });
            }

            // Send verification message
            const verifyButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify_user')
                        .setLabel('✅ Doğrula')
                        .setStyle(ButtonStyle.Success)
                );

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🛡️ Doğrulama Gerekli')
                .setDescription(`Merhaba ${member}!\n\nSunucumuza erişmek için lütfen aşağıdaki butona tıklayarak kendinizi doğrulayın.`)
                .addFields({
                    name: 'Neden Doğrulama?',
                    value: 'Sunucumuzu spam ve raid saldırılarından korumak için doğrulama sistemi kullanıyoruz.'
                })
                .setTimestamp();

            await verifyChannel.send({
                content: `${member}`,
                embeds: [embed],
                components: [verifyButton]
            });

            // Track verification
            this.verificationPending.set(member.user.id, {
                guildId: member.guild.id,
                joinedAt: Date.now()
            });

            // Auto-kick if not verified within time limit
            setTimeout(async () => {
                if (this.verificationPending.has(member.user.id)) {
                    await member.kick('Verification timeout').catch(() => {});
                    this.verificationPending.delete(member.user.id);
                }
            }, settings.verificationTimeout);

        } catch (error) {
            logger.error('[RaidProtection] Error requiring verification:', error);
        }
    }

    async handleVerification(interaction) {
        try {
            const userId = interaction.user.id;
            const pending = this.verificationPending.get(userId);

            if (!pending) {
                return interaction.reply({ content: '❌ Doğrulama kaydınız bulunamadı.', ephemeral: true });
            }

            const member = interaction.member;
            const unverifiedRole = interaction.guild.roles.cache.find(r => r.name === 'Unverified');

            if (unverifiedRole) {
                await member.roles.remove(unverifiedRole);
            }

            // Give member role
            const memberRole = interaction.guild.roles.cache.find(r => 
                r.name.toLowerCase() === 'member' || r.name.toLowerCase() === 'üye'
            );

            if (memberRole) {
                await member.roles.add(memberRole);
            }

            this.verificationPending.delete(userId);

            await interaction.reply({ 
                content: '✅ Başarıyla doğrulandınız! Sunucuya hoş geldiniz!', 
                ephemeral: true 
            });

            logger.info(`[RaidProtection] ${member.user.tag} verified in ${interaction.guild.name}`);

        } catch (error) {
            logger.error('[RaidProtection] Error handling verification:', error);
            await interaction.reply({ 
                content: '❌ Doğrulama sırasında bir hata oluştu.', 
                ephemeral: true 
            });
        }
    }

    async sendRaidAlert(guild, recentJoins) {
        try {
            const modChannel = guild.channels.cache.find(c => 
                c.name.includes('mod-log') || c.name.includes('raid') || c.name.includes('admin')
            );

            if (!modChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🚨 RAID ALERT!')
                .setDescription(`**${recentJoins.length} kullanıcı** kısa sürede sunucuya katıldı!\n\nRaid koruması aktif edildi.`)
                .addFields(
                    { name: 'Katılanlar', value: recentJoins.length.toString(), inline: true },
                    { name: 'Zaman Penceresi', value: '10 saniye', inline: true },
                    { name: 'Durum', value: '🔴 Raid Mode Active', inline: true }
                )
                .setTimestamp();

            await modChannel.send({ 
                content: '@here',
                embeds: [embed] 
            });

        } catch (error) {
            logger.error('[RaidProtection] Error sending raid alert:', error);
        }
    }

    getRaidSettings(guildId) {
        if (!this.db.data.raidSettings) {
            this.db.data.raidSettings = new Map();
        }

        if (!this.db.data.raidSettings.has(guildId)) {
            return {
                enabled: false,
                joinThreshold: 5, // 5 joins
                detectionWindow: 10000, // 10 seconds
                verificationEnabled: false,
                verificationTimeout: 300000, // 5 minutes
                autoKickNewMembers: false,
                lockdownServer: true,
                raidModeDuration: 600000, // 10 minutes
                raidModeActive: false
            };
        }

        return this.db.data.raidSettings.get(guildId);
    }

    updateRaidSettings(guildId, settings) {
        if (!this.db.data.raidSettings) {
            this.db.data.raidSettings = new Map();
        }

        this.db.data.raidSettings.set(guildId, settings);
        this.db.save();
    }
}

module.exports = RaidProtectionHandler;

