const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');

class FeedbackHandler {
    constructor(client) {
        this.client = client;
        this.db = getDatabase();
        this.feedbackChannelId = process.env.FEEDBACK_CHANNEL_ID || null;
        
        if (this.feedbackChannelId) {
            this.setupListeners();
            logger.info('✅ Feedback Handler initialized with channel:', this.feedbackChannelId);
        } else {
            logger.debug('Feedback Handler: FEEDBACK_CHANNEL_ID not configured (optional feature)');
        }
    }

    setupListeners() {
        this.client.on('messageCreate', async (message) => {
            // Ignore bots and non-feedback channel messages
            if (message.author.bot) return;
            if (message.channelId !== this.feedbackChannelId) return;
            
            try {
                await this.processFeedbackMessage(message);
            } catch (error) {
                logger.error('Error processing feedback message:', error);
            }
        });
    }

    async processFeedbackMessage(message) {
        // Parse feedback from Discord message
        // Expected format: User posts feedback naturally or with a specific format
        
        // Simple parsing: treat entire message as feedback
        const content = message.content;
        
        if (content.length < 10) {
            // Too short to be useful feedback
            return;
        }

        // Check if feedback is already stored (avoid duplicates)
        const existingFeedback = this.findExistingFeedback(message.id);
        if (existingFeedback) {
            logger.debug('Feedback already exists for message:', message.id);
            return;
        }

        // Create feedback entry
        const feedbackId = `feedback_discord_${Date.now()}_${message.id}`;
        const feedbackData = {
            id: feedbackId,
            name: message.author.username,
            discordTag: `${message.author.username}#${message.author.discriminator}`,
            discordId: message.author.id,
            messageId: message.id,
            feedbackType: this.detectFeedbackType(content),
            rating: this.extractRating(content) || 5,
            title: this.extractTitle(content),
            message: content,
            timestamp: message.createdTimestamp,
            status: 'pending',
            source: 'discord',
            guildId: message.guildId,
            channelId: message.channelId
        };

        // Save to database
        if (!this.db.data.feedback) {
            this.db.data.feedback = new Map();
        }
        
        this.db.data.feedback.set(feedbackId, feedbackData);
        this.db.save();

        logger.info(`💬 New Discord feedback saved: ${feedbackId} from ${message.author.username}`);

        // React to message to confirm receipt
        try {
            await message.react('✅');
        } catch (error) {
            logger.error('Failed to react to feedback message:', error);
        }
    }

    detectFeedbackType(content) {
        const lowerContent = content.toLowerCase();
        
        // Positive keywords
        if (lowerContent.includes('teşekkür') || lowerContent.includes('harika') || 
            lowerContent.includes('mükemmel') || lowerContent.includes('çok iyi')) {
            return 'positive';
        }
        
        // Negative keywords
        if (lowerContent.includes('sorun') || lowerContent.includes('hata') || 
            lowerContent.includes('çalışmıyor') || lowerContent.includes('bug')) {
            return 'issue';
        }
        
        // Suggestion keywords
        if (lowerContent.includes('öneri') || lowerContent.includes('eklenebilir') || 
            lowerContent.includes('olsa iyi') || lowerContent.includes('eklenmeli')) {
            return 'suggestion';
        }
        
        // Default to suggestion
        return 'suggestion';
    }

    extractRating(content) {
        // Try to find rating like "5/5", "4 yıldız", "⭐⭐⭐⭐⭐"
        const ratingMatch = content.match(/(\d)\/5|(\d)\s*yıldız/i);
        if (ratingMatch) {
            return parseInt(ratingMatch[1] || ratingMatch[2]);
        }
        
        // Count star emojis
        const stars = (content.match(/⭐/g) || []).length;
        if (stars > 0 && stars <= 5) {
            return stars;
        }
        
        return null;
    }

    extractTitle(content) {
        // Take first line or first 50 characters as title
        const firstLine = content.split('\n')[0];
        if (firstLine.length > 50) {
            return firstLine.substring(0, 47) + '...';
        }
        return firstLine;
    }

    findExistingFeedback(messageId) {
        if (!this.db.data.feedback) return null;
        
        for (const [, feedback] of this.db.data.feedback) {
            if (feedback.messageId === messageId) {
                return feedback;
            }
        }
        
        return null;
    }

    // Method to manually add feedback
    addFeedback(feedbackData) {
        const feedbackId = `feedback_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (!this.db.data.feedback) {
            this.db.data.feedback = new Map();
        }
        
        const fullData = {
            id: feedbackId,
            ...feedbackData,
            timestamp: Date.now(),
            status: 'pending',
            source: 'manual'
        };
        
        this.db.data.feedback.set(feedbackId, fullData);
        this.db.save();
        
        logger.info('Manually added feedback:', feedbackId);
        return fullData;
    }

    // Get all feedback
    getAllFeedback(limit = 100) {
        if (!this.db.data.feedback) return [];
        
        const feedbackList = Array.from(this.db.data.feedback.values());
        feedbackList.sort((a, b) => b.timestamp - a.timestamp);
        
        return feedbackList.slice(0, limit);
    }

    // Get feedback by type
    getFeedbackByType(type, limit = 50) {
        if (!this.db.data.feedback) return [];
        
        const feedbackList = Array.from(this.db.data.feedback.values())
            .filter(f => f.feedbackType === type);
        
        feedbackList.sort((a, b) => b.timestamp - a.timestamp);
        
        return feedbackList.slice(0, limit);
    }
}

module.exports = FeedbackHandler;

