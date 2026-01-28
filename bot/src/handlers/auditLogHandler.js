// ==========================================
// 📋 Comprehensive Audit Log Handler
// ==========================================
// Tüm Discord event'lerini yakala ve audit log'a kaydet

const { AuditLogEvent } = require('discord.js');
const { logger } = require('../utils/logger');
const { getAuditLogger } = require('../utils/auditLogger');

class AuditLogHandler {
    constructor(client) {
        this.client = client;
        this.auditLogger = getAuditLogger();

        logger.info('📋 Audit Log Handler başlatıldı');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Member Events
        this.client.on('guildMemberAdd', (member) => this.handleMemberAdd(member));
        this.client.on('guildMemberRemove', (member) => this.handleMemberRemove(member));
        this.client.on('guildMemberUpdate', (oldMember, newMember) => this.handleMemberUpdate(oldMember, newMember));

        // Ban Events
        this.client.on('guildBanAdd', (ban) => this.handleBanAdd(ban));
        this.client.on('guildBanRemove', (ban) => this.handleBanRemove(ban));

        // Role Events
        this.client.on('roleCreate', (role) => this.handleRoleCreate(role));
        this.client.on('roleDelete', (role) => this.handleRoleDelete(role));
        this.client.on('roleUpdate', (oldRole, newRole) => this.handleRoleUpdate(oldRole, newRole));

        // Channel Events
        this.client.on('channelCreate', (channel) => this.handleChannelCreate(channel));
        this.client.on('channelDelete', (channel) => this.handleChannelDelete(channel));
        this.client.on('channelUpdate', (oldChannel, newChannel) => this.handleChannelUpdate(oldChannel, newChannel));

        // Message Events
        this.client.on('messageDelete', (message) => this.handleMessageDelete(message));
        this.client.on('messageDeleteBulk', (messages) => this.handleBulkMessageDelete(messages));

        // Guild Events
        this.client.on('guildUpdate', (oldGuild, newGuild) => this.handleGuildUpdate(oldGuild, newGuild));

        logger.success('✅ Audit Log event listeners kuruldu');
    }

    async getAuditExecutor(guild, actionType) {
        try {
            const auditLogs = await guild.fetchAuditLogs({
                limit: 1,
                type: actionType
            });
            const firstEntry = auditLogs.entries.first();
            return firstEntry?.executor || null;
        } catch (error) {
            // logger.debug('Audit executor alınamadı (sessiz):', error.message);
            return null;
        }
    }

    // Member Events
    async handleMemberAdd(member) {
        if (member.id === this.client.user.id) return;

        this.auditLogger.log({
            guildId: member.guild.id,
            action: 'MEMBER_JOIN',
            executor: null,
            target: {
                id: member.id,
                name: member.user.tag,
                type: 'member'
            },
            changes: {
                joinedAt: member.joinedAt
            },
            reason: null
        });
    }

    async handleMemberRemove(member) {
        if (member.id === this.client.user.id) return;

        const executor = await this.getAuditExecutor(member.guild, AuditLogEvent.MemberKick);

        this.auditLogger.log({
            guildId: member.guild.id,
            action: executor ? 'MEMBER_KICK' : 'MEMBER_LEAVE',
            executor: executor,
            target: {
                id: member.id,
                name: member.user.tag,
                type: 'member'
            },
            changes: {},
            reason: null
        });
    }

    async handleMemberUpdate(oldMember, newMember) {
        // Ignore updates to the bot itself to prevent feedback loops
        if (newMember.id === this.client.user.id) return;

        const changes = {};

        if (oldMember.nickname !== newMember.nickname) {
            changes.nickname = {
                old: oldMember.nickname,
                new: newMember.nickname
            };
        }

        if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
            const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
            const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

            if (addedRoles.size > 0 || removedRoles.size > 0) {
                changes.roles = {
                    added: Array.from(addedRoles.values()).map(r => ({ id: r.id, name: r.name })),
                    removed: Array.from(removedRoles.values()).map(r => ({ id: r.id, name: r.name }))
                };

                // Ignore auto-role updates done by the bot itself
                // This is hard to detect perfectly without checking audit logs, but we can skip log spam
            }
        }

        if (Object.keys(changes).length > 0) {
            // Add a small delay/cache to prevent spamming Discord API
            const executor = await this.getAuditExecutor(newMember.guild, AuditLogEvent.MemberUpdate);

            // If executor is the bot itself, skip logging to prevent loops from automated actions
            if (executor?.id === this.client.user.id) return;

            this.auditLogger.log({
                guildId: newMember.guild.id,
                action: 'MEMBER_UPDATE',
                executor: executor,
                target: {
                    id: newMember.id,
                    name: newMember.user.tag,
                    type: 'member'
                },
                changes,
                reason: null
            });
        }
    }

    // Ban Events
    async handleBanAdd(ban) {
        const executor = await this.getAuditExecutor(ban.guild, AuditLogEvent.MemberBanAdd);

        this.auditLogger.log({
            guildId: ban.guild.id,
            action: 'MEMBER_BAN',
            executor: executor,
            target: {
                id: ban.user.id,
                name: ban.user.tag,
                type: 'member'
            },
            changes: {},
            reason: ban.reason
        });
    }

    async handleBanRemove(ban) {
        const executor = await this.getAuditExecutor(ban.guild, AuditLogEvent.MemberBanRemove);

        this.auditLogger.log({
            guildId: ban.guild.id,
            action: 'MEMBER_UNBAN',
            executor: executor,
            target: {
                id: ban.user.id,
                name: ban.user.tag,
                type: 'member'
            },
            changes: {},
            reason: ban.reason
        });
    }

    // Role Events
    async handleRoleCreate(role) {
        const executor = await this.getAuditExecutor(role.guild, AuditLogEvent.RoleCreate);

        this.auditLogger.log({
            guildId: role.guild.id,
            action: 'ROLE_CREATE',
            executor: executor,
            target: {
                id: role.id,
                name: role.name,
                type: 'role'
            },
            changes: {
                color: role.hexColor,
                permissions: role.permissions.bitfield.toString()
            },
            reason: null
        });
    }

    async handleRoleDelete(role) {
        const executor = await this.getAuditExecutor(role.guild, AuditLogEvent.RoleDelete);

        this.auditLogger.log({
            guildId: role.guild.id,
            action: 'ROLE_DELETE',
            executor: executor,
            target: {
                id: role.id,
                name: role.name,
                type: 'role'
            },
            changes: {},
            reason: null
        });
    }

    async handleRoleUpdate(oldRole, newRole) {
        const changes = {};

        if (oldRole.name !== newRole.name) {
            changes.name = { old: oldRole.name, new: newRole.name };
        }

        if (oldRole.hexColor !== newRole.hexColor) {
            changes.color = { old: oldRole.hexColor, new: newRole.hexColor };
        }

        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            changes.permissions = {
                old: oldRole.permissions.bitfield.toString(),
                new: newRole.permissions.bitfield.toString()
            };
        }

        if (Object.keys(changes).length > 0) {
            const executor = await this.getAuditExecutor(newRole.guild, AuditLogEvent.RoleUpdate);

            this.auditLogger.log({
                guildId: newRole.guild.id,
                action: 'ROLE_UPDATE',
                executor: executor,
                target: {
                    id: newRole.id,
                    name: newRole.name,
                    type: 'role'
                },
                changes,
                reason: null
            });
        }
    }

    // Channel Events
    async handleChannelCreate(channel) {
        if (!channel.guild) return;

        const executor = await this.getAuditExecutor(channel.guild, AuditLogEvent.ChannelCreate);

        this.auditLogger.log({
            guildId: channel.guild.id,
            action: 'CHANNEL_CREATE',
            executor: executor,
            target: {
                id: channel.id,
                name: channel.name,
                type: 'channel'
            },
            changes: {
                type: channel.type
            },
            reason: null
        });
    }

    async handleChannelDelete(channel) {
        if (!channel.guild) return;

        const executor = await this.getAuditExecutor(channel.guild, AuditLogEvent.ChannelDelete);

        this.auditLogger.log({
            guildId: channel.guild.id,
            action: 'CHANNEL_DELETE',
            executor: executor,
            target: {
                id: channel.id,
                name: channel.name,
                type: 'channel'
            },
            changes: {},
            reason: null
        });
    }

    async handleChannelUpdate(oldChannel, newChannel) {
        if (!newChannel.guild) return;

        const changes = {};

        if (oldChannel.name !== newChannel.name) {
            changes.name = { old: oldChannel.name, new: newChannel.name };
        }

        if (oldChannel.topic !== newChannel.topic) {
            changes.topic = { old: oldChannel.topic, new: newChannel.topic };
        }

        if (Object.keys(changes).length > 0) {
            const executor = await this.getAuditExecutor(newChannel.guild, AuditLogEvent.ChannelUpdate);

            this.auditLogger.log({
                guildId: newChannel.guild.id,
                action: 'CHANNEL_UPDATE',
                executor: executor,
                target: {
                    id: newChannel.id,
                    name: newChannel.name,
                    type: 'channel'
                },
                changes,
                reason: null
            });
        }
    }

    // Message Events
    async handleMessageDelete(message) {
        if (!message.guild || message.author?.bot) return;

        const executor = await this.getAuditExecutor(message.guild, AuditLogEvent.MessageDelete);

        this.auditLogger.log({
            guildId: message.guild.id,
            action: 'MESSAGE_DELETE',
            executor: executor,
            target: {
                id: message.id,
                name: message.author?.tag || 'Unknown',
                type: 'message'
            },
            changes: {
                content: message.content?.substring(0, 100) || '',
                channel: message.channel.name
            },
            reason: null
        });
    }

    async handleBulkMessageDelete(messages) {
        const firstMessage = messages.first();
        if (!firstMessage?.guild) return;

        const executor = await this.getAuditExecutor(firstMessage.guild, AuditLogEvent.MessageBulkDelete);

        this.auditLogger.log({
            guildId: firstMessage.guild.id,
            action: 'MESSAGE_BULK_DELETE',
            executor: executor,
            target: {
                id: firstMessage.channel.id,
                name: firstMessage.channel.name,
                type: 'channel'
            },
            changes: {
                count: messages.size
            },
            reason: null
        });
    }

    // Guild Events
    async handleGuildUpdate(oldGuild, newGuild) {
        const changes = {};

        if (oldGuild.name !== newGuild.name) {
            changes.name = { old: oldGuild.name, new: newGuild.name };
        }

        if (oldGuild.icon !== newGuild.icon) {
            changes.icon = { changed: true };
        }

        if (Object.keys(changes).length > 0) {
            const executor = await this.getAuditExecutor(newGuild, AuditLogEvent.GuildUpdate);

            this.auditLogger.log({
                guildId: newGuild.id,
                action: 'GUILD_UPDATE',
                executor: executor,
                target: {
                    id: newGuild.id,
                    name: newGuild.name,
                    type: 'guild'
                },
                changes,
                reason: null
            });
        }
    }

    // Manual audit log method (for command usage, etc.)
    logCustomAction(guildId, action, executor, target, changes, reason) {
        this.auditLogger.log({
            guildId,
            action,
            executor,
            target,
            changes: changes || {},
            reason: reason || null
        });
    }
}

module.exports = AuditLogHandler;

