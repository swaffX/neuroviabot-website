// ==========================================
// 🔊 NeuroViaBot - Voice State Update Event
// ==========================================

const { logger } = require('../utils/logger');
const { getQuestProgressTracker } = require('../utils/questProgressTracker');

module.exports = {
    name: 'voiceStateUpdate',
    once: false,
    async execute(oldState, newState, client) {
        try {
            // Ignore bot voice changes
            if (newState.member.user.bot) return;

            const userId = newState.member.id;
            const guildId = newState.guild.id;

            // User joined a voice channel
            if (!oldState.channel && newState.channel) {
                logger.debug(`[Voice] ${newState.member.user.tag} joined voice channel in ${newState.guild.name}`);

                // Track quest progress
                const questTracker = getQuestProgressTracker();
                await questTracker.trackVoiceActivity(userId, guildId, true);
            }

            // User left a voice channel
            if (oldState.channel && !newState.channel) {
                logger.debug(`[Voice] ${newState.member.user.tag} left voice channel in ${newState.guild.name}`);

                // Track quest progress
                const questTracker = getQuestProgressTracker();
                await questTracker.trackVoiceActivity(userId, guildId, false);
            }

            // User switched voice channels
            if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                logger.debug(`[Voice] ${newState.member.user.tag} switched voice channels in ${newState.guild.name}`);
                
                // End tracking in old channel, start in new
                const questTracker = getQuestProgressTracker();
                await questTracker.trackVoiceActivity(userId, guildId, false);
                await questTracker.trackVoiceActivity(userId, guildId, true);
            }

        } catch (error) {
            logger.error('voiceStateUpdate event error', error, {
                guild: newState.guild?.name,
                user: newState.member?.user.tag
            });
        }
    }
};

