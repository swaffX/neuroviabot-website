// ==========================================
// 🔄 Real-Time Sync Handler
// ==========================================
// Synchronizes Discord events with frontend via Socket.IO

const { logger } = require('../utils/logger');

class RealtimeSync {
    constructor(client, io) {
        this.client = client;
        this.io = io;
        this.isActive = true;
    }

    /**
     * Broadcast level up to frontend
     */
    levelUpdate(data) {
        try {
            if (!this.io || !this.isActive) return;

            const { guildId, userId, username, avatar, oldLevel, newLevel, xp, timestamp } = data;

            // Broadcast to guild room
            this.io.to(`guild_${guildId}`).emit('level_up', {
                userId,
                username,
                avatar,
                oldLevel,
                newLevel,
                xp,
                timestamp
            });

            logger.debug(`[RealtimeSync] Level up broadcasted: ${username} ${oldLevel}->${newLevel} in guild ${guildId}`);
        } catch (error) {
            logger.error('[RealtimeSync] Level update error:', error);
        }
    }

    /**
     * Broadcast channel creation to frontend
     */
    channelCreate(channel) {
        try {
            if (!this.io || !this.isActive) return;
            if (!channel.guild) return;

            this.io.to(`guild_${channel.guild.id}`).emit('channel_created', {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                parentId: channel.parentId,
                position: channel.position,
                timestamp: Date.now()
            });

            logger.debug(`[RealtimeSync] Channel created: ${channel.name} in ${channel.guild.name}`);
        } catch (error) {
            logger.error('[RealtimeSync] Channel create error:', error);
        }
    }

    /**
     * Broadcast channel update to frontend
     */
    channelUpdate(oldChannel, newChannel) {
        try {
            if (!this.io || !this.isActive) return;
            if (!newChannel.guild) return;

            this.io.to(`guild_${newChannel.guild.id}`).emit('channel_updated', {
                id: newChannel.id,
                name: newChannel.name,
                type: newChannel.type,
                parentId: newChannel.parentId,
                position: newChannel.position,
                changes: {
                    name: oldChannel.name !== newChannel.name ? { old: oldChannel.name, new: newChannel.name } : null,
                    topic: oldChannel.topic !== newChannel.topic ? { old: oldChannel.topic, new: newChannel.topic } : null
                },
                timestamp: Date.now()
            });

            logger.debug(`[RealtimeSync] Channel updated: ${newChannel.name}`);
        } catch (error) {
            logger.error('[RealtimeSync] Channel update error:', error);
        }
    }

    /**
     * Broadcast channel deletion to frontend
     */
    channelDelete(channel) {
        try {
            if (!this.io || !this.isActive) return;
            if (!channel.guild) return;

            this.io.to(`guild_${channel.guild.id}`).emit('channel_deleted', {
                id: channel.id,
                name: channel.name,
                timestamp: Date.now()
            });

            logger.debug(`[RealtimeSync] Channel deleted: ${channel.name}`);
        } catch (error) {
            logger.error('[RealtimeSync] Channel delete error:', error);
        }
    }

    /**
     * Broadcast role creation to frontend
     */
    roleCreate(role) {
        try {
            if (!this.io || !this.isActive) return;

            this.io.to(`guild_${role.guild.id}`).emit('role_created', {
                id: role.id,
                name: role.name,
                color: role.hexColor,
                permissions: role.permissions.bitfield.toString(),
                position: role.position,
                hoist: role.hoist,
                mentionable: role.mentionable,
                timestamp: Date.now()
            });

            logger.debug(`[RealtimeSync] Role created: ${role.name}`);
        } catch (error) {
            logger.error('[RealtimeSync] Role create error:', error);
        }
    }

    /**
     * Broadcast role update to frontend
     */
    roleUpdate(oldRole, newRole) {
        try {
            if (!this.io || !this.isActive) return;

            this.io.to(`guild_${newRole.guild.id}`).emit('role_updated', {
                id: newRole.id,
                name: newRole.name,
                color: newRole.hexColor,
                permissions: newRole.permissions.bitfield.toString(),
                position: newRole.position,
                changes: {
                    name: oldRole.name !== newRole.name ? { old: oldRole.name, new: newRole.name } : null,
                    color: oldRole.hexColor !== newRole.hexColor ? { old: oldRole.hexColor, new: newRole.hexColor } : null
                },
                timestamp: Date.now()
            });

            logger.debug(`[RealtimeSync] Role updated: ${newRole.name}`);
        } catch (error) {
            logger.error('[RealtimeSync] Role update error:', error);
        }
    }

    /**
     * Broadcast role deletion to frontend
     */
    roleDelete(role) {
        try {
            if (!this.io || !this.isActive) return;

            this.io.to(`guild_${role.guild.id}`).emit('role_deleted', {
                id: role.id,
                name: role.name,
                timestamp: Date.now()
            });

            logger.debug(`[RealtimeSync] Role deleted: ${role.name}`);
        } catch (error) {
            logger.error('[RealtimeSync] Role delete error:', error);
        }
    }

    /**
     * Broadcast member join to frontend
     */
    memberJoin(member) {
        try {
            if (!this.io || !this.isActive) return;

            this.io.to(`guild_${member.guild.id}`).emit('member_joined', {
                id: member.id,
                username: member.user.username,
                discriminator: member.user.discriminator,
                avatar: member.user.displayAvatarURL(),
                joinedAt: member.joinedTimestamp,
                timestamp: Date.now()
            });

            logger.debug(`[RealtimeSync] Member joined: ${member.user.tag}`);
        } catch (error) {
            logger.error('[RealtimeSync] Member join error:', error);
        }
    }

    /**
     * Broadcast member leave to frontend
     */
    memberLeave(member) {
        try {
            if (!this.io || !this.isActive) return;

            this.io.to(`guild_${member.guild.id}`).emit('member_left', {
                id: member.id,
                username: member.user.username,
                timestamp: Date.now()
            });

            logger.debug(`[RealtimeSync] Member left: ${member.user.tag}`);
        } catch (error) {
            logger.error('[RealtimeSync] Member leave error:', error);
        }
    }

    /**
     * Disable real-time sync
     */
    disable() {
        this.isActive = false;
        logger.info('[RealtimeSync] Real-time sync disabled');
    }

    /**
     * Enable real-time sync
     */
    enable() {
        this.isActive = true;
        logger.info('[RealtimeSync] Real-time sync enabled');
    }
}

module.exports = RealtimeSync;

