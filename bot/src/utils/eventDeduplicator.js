const { logger } = require('./logger');

/**
 * Event Deduplication System
 * Prevents duplicate event firing by tracking recent events with timestamps
 */
class EventDeduplicator {
    constructor() {
        // Store recent events: Map<eventKey, timestamp>
        this.recentEvents = new Map();
        
        // Default debounce time (milliseconds)
        this.defaultDebounceTime = 2000; // 2 seconds
        
        // Cleanup interval - remove old events every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
        
        logger.info('[EventDeduplicator] Initialized with 2s default debounce');
    }

    /**
     * Check if an event is duplicate
     * @param {string} eventType - Type of event (e.g., 'memberJoin', 'memberLeave')
     * @param {string} identifier - Unique identifier (e.g., userId, guildId+userId)
     * @param {number} debounceTime - Custom debounce time in ms (optional)
     * @returns {boolean} - True if duplicate, false if should process
     */
    isDuplicate(eventType, identifier, debounceTime = null) {
        const key = `${eventType}:${identifier}`;
        const now = Date.now();
        const threshold = debounceTime || this.defaultDebounceTime;

        // Check if we have a recent event
        if (this.recentEvents.has(key)) {
            const lastEventTime = this.recentEvents.get(key);
            const timeSinceLastEvent = now - lastEventTime;

            if (timeSinceLastEvent < threshold) {
                logger.debug(`[EventDeduplicator] Blocked duplicate ${eventType} for ${identifier} (${timeSinceLastEvent}ms ago)`);
                return true; // It's a duplicate
            }
        }

        // Not a duplicate, record this event
        this.recentEvents.set(key, now);
        return false;
    }

    /**
     * Manually mark an event as processed
     * @param {string} eventType - Type of event
     * @param {string} identifier - Unique identifier
     */
    markProcessed(eventType, identifier) {
        const key = `${eventType}:${identifier}`;
        this.recentEvents.set(key, Date.now());
        logger.debug(`[EventDeduplicator] Marked ${eventType}:${identifier} as processed`);
    }

    /**
     * Check and record event in one call
     * @param {string} eventType - Type of event
     * @param {string} identifier - Unique identifier
     * @param {Function} callback - Function to execute if not duplicate
     * @param {number} debounceTime - Custom debounce time in ms (optional)
     * @returns {Promise<boolean>} - True if executed, false if blocked
     */
    async process(eventType, identifier, callback, debounceTime = null) {
        if (this.isDuplicate(eventType, identifier, debounceTime)) {
            return false; // Blocked
        }

        try {
            await callback();
            return true; // Executed
        } catch (error) {
            logger.error(`[EventDeduplicator] Error in ${eventType}:${identifier}`, error);
            throw error;
        }
    }

    /**
     * Clear specific event from cache
     * @param {string} eventType - Type of event
     * @param {string} identifier - Unique identifier
     */
    clear(eventType, identifier) {
        const key = `${eventType}:${identifier}`;
        this.recentEvents.delete(key);
        logger.debug(`[EventDeduplicator] Cleared ${key}`);
    }

    /**
     * Clear all events for a specific type
     * @param {string} eventType - Type of event
     */
    clearType(eventType) {
        let count = 0;
        for (const key of this.recentEvents.keys()) {
            if (key.startsWith(`${eventType}:`)) {
                this.recentEvents.delete(key);
                count++;
            }
        }
        logger.debug(`[EventDeduplicator] Cleared ${count} events of type ${eventType}`);
    }

    /**
     * Remove events older than threshold
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        let removedCount = 0;

        for (const [key, timestamp] of this.recentEvents.entries()) {
            if (now - timestamp > maxAge) {
                this.recentEvents.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            logger.debug(`[EventDeduplicator] Cleaned up ${removedCount} old events`);
        }
    }

    /**
     * Get stats about tracked events
     * @returns {Object} - Stats object
     */
    getStats() {
        const eventTypes = {};
        
        for (const key of this.recentEvents.keys()) {
            const [type] = key.split(':');
            eventTypes[type] = (eventTypes[type] || 0) + 1;
        }

        return {
            totalTracked: this.recentEvents.size,
            byType: eventTypes,
            debounceTime: this.defaultDebounceTime
        };
    }

    /**
     * Stop the deduplicator and clean up
     */
    destroy() {
        clearInterval(this.cleanupInterval);
        this.recentEvents.clear();
        logger.info('[EventDeduplicator] Destroyed');
    }
}

// Singleton instance
let deduplicator = null;

function getEventDeduplicator() {
    if (!deduplicator) {
        deduplicator = new EventDeduplicator();
    }
    return deduplicator;
}

module.exports = {
    EventDeduplicator,
    getEventDeduplicator
};

