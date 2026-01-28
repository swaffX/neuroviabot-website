const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');

class ReactionRoleHandler {
    constructor(client) {
        this.client = client;
        this.db = getDatabase();
        this.activeSetups = new Map(); // messageId -> setup data
        
        this.setupListeners();
        logger.info('✅ Reaction Role Handler initialized');
    }

    setupListeners() {
        // Listen for message reactions
        this.client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot) return;
            await this.handleReactionAdd(reaction, user);
        });

        this.client.on('messageReactionRemove', async (reaction, user) => {
            if (user.bot) return;
            await this.handleReactionRemove(reaction, user);
        });
    }

    async createReactionRoleMessage(guildId, channelId, config) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                throw new Error('Guild not found');
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                throw new Error('Channel not found');
            }

            // Check bot permissions
            const botPermissions = channel.permissionsFor(guild.members.me);
            if (!botPermissions.has(['SendMessages', 'AddReactions', 'ReadMessageHistory'])) {
                throw new Error('Bot does not have required permissions (SendMessages, AddReactions, ReadMessageHistory)');
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle(config.title || '⭐ Rol Seçimi')
                .setDescription(config.description || 'Aşağıdaki reaksiyonlara tıklayarak rol alabilirsiniz!')
                .setColor(config.color || '#5865F2')
                .setTimestamp();

            // Add role information to embed
            if (config.roles && config.roles.length > 0) {
                const roleList = config.roles.map(r => `${r.emoji} - <@&${r.roleId}>`).join('\n');
                embed.addFields({
                    name: 'Roller',
                    value: roleList
                });
            }

            // Send message
            const message = await channel.send({ embeds: [embed] });

            // Add reactions (with proper error handling and retry)
            if (config.roles && config.roles.length > 0) {
                for (const roleConfig of config.roles) {
                    try {
                        // Add delay between reactions to avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 300));
                        await message.react(roleConfig.emoji);
                        logger.debug(`[ReactionRole] Added emoji ${roleConfig.emoji} to message`);
                    } catch (error) {
                        logger.error(`[ReactionRole] Failed to add reaction ${roleConfig.emoji}:`, error.message);
                        // Continue with other emojis even if one fails
                    }
                }
            }

            // Save to database
            const setup = {
                guildId,
                channelId,
                messageId: message.id,
                ...config,
                createdAt: Date.now()
            };

            if (!this.db.data.reactionRoles) {
                this.db.data.reactionRoles = new Map();
            }

            this.db.data.reactionRoles.set(message.id, setup);
            this.activeSetups.set(message.id, setup);
            this.db.save();

            logger.info(`[ReactionRole] Created reaction role message ${message.id} in ${guildId}`);

            return {
                success: true,
                messageId: message.id,
                channelId: channel.id,
                messageUrl: message.url
            };
        } catch (error) {
            logger.error('[ReactionRole] Error creating message:', error);
            throw error;
        }
    }

    async handleReactionAdd(reaction, user) {
        try {
            // Fetch partial reactions
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    logger.error('[ReactionRole] Failed to fetch partial reaction:', error);
                    return;
                }
            }

            // Fetch partial message
            if (reaction.message.partial) {
                try {
                    await reaction.message.fetch();
                } catch (error) {
                    logger.error('[ReactionRole] Failed to fetch partial message:', error);
                    return;
                }
            }

            const messageId = reaction.message.id;
            const setup = this.activeSetups.get(messageId) || 
                          this.db.data.reactionRoles?.get(messageId);

            if (!setup) return;

            // Get emoji identifier (works for both unicode and custom emojis)
            const emojiIdentifier = reaction.emoji.id 
                ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` // Custom emoji
                : reaction.emoji.name; // Unicode emoji

            // Find matching role
            const roleConfig = setup.roles?.find(r => {
                // Try exact match first
                if (r.emoji === emojiIdentifier || r.emoji === reaction.emoji.name) {
                    return true;
                }
                // Try ID match for custom emojis
                if (reaction.emoji.id && r.emoji.includes(reaction.emoji.id)) {
                    return true;
                }
                return false;
            });

            if (!roleConfig) {
                logger.debug(`[ReactionRole] No role config found for emoji ${emojiIdentifier}`);
                return;
            }

            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(roleConfig.roleId);

            if (!role) {
                logger.warn(`[ReactionRole] Role ${roleConfig.roleId} not found`);
                return;
            }

            // Check bot permissions
            if (!guild.members.me.permissions.has('ManageRoles')) {
                logger.error('[ReactionRole] Bot missing ManageRoles permission');
                return;
            }

            // Add role
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role, 'Reaction role');
                logger.info(`[ReactionRole] Added role ${role.name} to ${user.tag}`);
            }
        } catch (error) {
            logger.error('[ReactionRole] Error handling reaction add:', error);
        }
    }

    async handleReactionRemove(reaction, user) {
        try {
            // Fetch partial reactions
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    logger.error('[ReactionRole] Failed to fetch partial reaction:', error);
                    return;
                }
            }

            // Fetch partial message
            if (reaction.message.partial) {
                try {
                    await reaction.message.fetch();
                } catch (error) {
                    logger.error('[ReactionRole] Failed to fetch partial message:', error);
                    return;
                }
            }

            const messageId = reaction.message.id;
            const setup = this.activeSetups.get(messageId) || 
                          this.db.data.reactionRoles?.get(messageId);

            if (!setup) return;

            // Get emoji identifier (works for both unicode and custom emojis)
            const emojiIdentifier = reaction.emoji.id 
                ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` // Custom emoji
                : reaction.emoji.name; // Unicode emoji

            // Find matching role
            const roleConfig = setup.roles?.find(r => {
                // Try exact match first
                if (r.emoji === emojiIdentifier || r.emoji === reaction.emoji.name) {
                    return true;
                }
                // Try ID match for custom emojis
                if (reaction.emoji.id && r.emoji.includes(reaction.emoji.id)) {
                    return true;
                }
                return false;
            });

            if (!roleConfig) {
                logger.debug(`[ReactionRole] No role config found for emoji ${emojiIdentifier}`);
                return;
            }

            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(roleConfig.roleId);

            if (!role) {
                logger.warn(`[ReactionRole] Role ${roleConfig.roleId} not found`);
                return;
            }

            // Check bot permissions
            if (!guild.members.me.permissions.has('ManageRoles')) {
                logger.error('[ReactionRole] Bot missing ManageRoles permission');
                return;
            }

            // Remove role
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role, 'Reaction role removed');
                logger.info(`[ReactionRole] Removed role ${role.name} from ${user.tag}`);
            }
        } catch (error) {
            logger.error('[ReactionRole] Error handling reaction remove:', error);
        }
    }

    async deleteReactionRoleMessage(messageId) {
        try {
            const setup = this.db.data.reactionRoles?.get(messageId);
            if (!setup) {
                throw new Error('Reaction role message not found');
            }

            const guild = this.client.guilds.cache.get(setup.guildId);
            if (guild) {
                const channel = guild.channels.cache.get(setup.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(messageId).catch(() => null);
                    if (message) {
                        await message.delete();
                    }
                }
            }

            this.db.data.reactionRoles.delete(messageId);
            this.activeSetups.delete(messageId);
            this.db.save();

            logger.info(`[ReactionRole] Deleted reaction role message ${messageId}`);
            return { success: true };
        } catch (error) {
            logger.error('[ReactionRole] Error deleting message:', error);
            throw error;
        }
    }

    getActiveSetups(guildId) {
        if (!this.db.data.reactionRoles) return [];

        const setups = [];
        this.db.data.reactionRoles.forEach((setup, messageId) => {
            if (setup.guildId === guildId) {
                setups.push({ messageId, ...setup });
            }
        });

        return setups;
    }

    async loadActiveSetups() {
        if (!this.db.data.reactionRoles) return;

        this.db.data.reactionRoles.forEach((setup, messageId) => {
            this.activeSetups.set(messageId, setup);
        });

        logger.info(`[ReactionRole] Loaded ${this.activeSetups.size} active setups`);
    }
}

module.exports = ReactionRoleHandler;
