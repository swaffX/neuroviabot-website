// ==========================================
// 📋 Guild Audit Log Entry Create Event
// Captures ALL Discord audit log events
// ==========================================

const { Events, AuditLogEvent } = require('discord.js');
const { getAuditLogger } = require('../utils/auditLogger');

module.exports = {
    name: Events.GuildAuditLogEntryCreate,
    
    async execute(auditLogEntry, guild) {
        try {
            const auditLogger = getAuditLogger();
            
            // Get executor (who did the action)
            const executor = auditLogEntry.executor;
            const target = auditLogEntry.target;
            const action = auditLogEntry.action;
            
            // Map Discord audit log action to our action types
            const actionMap = {
                [AuditLogEvent.ChannelCreate]: 'CHANNEL_CREATE',
                [AuditLogEvent.ChannelDelete]: 'CHANNEL_DELETE',
                [AuditLogEvent.ChannelUpdate]: 'CHANNEL_UPDATE',
                
                [AuditLogEvent.RoleCreate]: 'ROLE_CREATE',
                [AuditLogEvent.RoleDelete]: 'ROLE_DELETE',
                [AuditLogEvent.RoleUpdate]: 'ROLE_UPDATE',
                
                [AuditLogEvent.MemberBanAdd]: 'MEMBER_BAN',
                [AuditLogEvent.MemberBanRemove]: 'MEMBER_UNBAN',
                [AuditLogEvent.MemberKick]: 'MEMBER_KICK',
                [AuditLogEvent.MemberUpdate]: 'MEMBER_UPDATE',
                
                [AuditLogEvent.MessageDelete]: 'MESSAGE_DELETE',
                [AuditLogEvent.MessageBulkDelete]: 'MESSAGE_BULK_DELETE',
                
                [AuditLogEvent.GuildUpdate]: 'GUILD_UPDATE',
                
                [AuditLogEvent.EmojiCreate]: 'EMOJI_CREATE',
                [AuditLogEvent.EmojiDelete]: 'EMOJI_DELETE',
                [AuditLogEvent.EmojiUpdate]: 'EMOJI_UPDATE',
                
                [AuditLogEvent.WebhookCreate]: 'WEBHOOK_CREATE',
                [AuditLogEvent.WebhookDelete]: 'WEBHOOK_DELETE',
                [AuditLogEvent.WebhookUpdate]: 'WEBHOOK_UPDATE',
                
                [AuditLogEvent.InviteCreate]: 'INVITE_CREATE',
                [AuditLogEvent.InviteDelete]: 'INVITE_DELETE',
            };
            
            const mappedAction = actionMap[action];
            
            // Skip if action not mapped or is a bot action we don't want to track
            if (!mappedAction) {
                return;
            }
            
            // Prepare executor data
            let executorData = null;
            if (executor) {
                executorData = {
                    id: executor.id,
                    username: executor.username,
                    globalName: executor.globalName,
                    tag: executor.tag,
                    avatar: executor.avatar,
                    bot: executor.bot || false,
                };
            }
            
            // Prepare target data
            let targetData = null;
            if (target) {
                targetData = {
                    id: target.id,
                    name: target.name || target.username || target.tag || 'Unknown',
                    type: target.constructor.name,
                };
            }
            
            // Extract changes from audit log
            const changes = {};
            if (auditLogEntry.changes && auditLogEntry.changes.length > 0) {
                auditLogEntry.changes.forEach(change => {
                    changes[change.key] = {
                        old: change.old,
                        new: change.new,
                    };
                });
            }
            
            // Log to our audit system
            await auditLogger.log({
                guildId: guild.id,
                action: mappedAction,
                executor: executorData,
                target: targetData,
                changes: changes,
                reason: auditLogEntry.reason || null,
            });
            
            console.log(`[AuditLog] ${mappedAction} by ${executor?.username || 'Unknown'} in ${guild.name}`);
            
        } catch (error) {
            console.error('[GuildAuditLogEntryCreate] Error:', error);
        }
    },
};
