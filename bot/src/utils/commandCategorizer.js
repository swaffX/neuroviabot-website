// ==========================================
// 📂 Command Categorization Utility
// ==========================================
// Auto-categorize commands based on name patterns

/**
 * Categorize a command based on its name
 * @param {string} commandName - The name of the command
 * @returns {string} The category name
 */
function categorizeCommand(commandName) {
    const categories = {
        economy: ['economy', 'shop', 'trade', 'invest', 'market-config', 'inventory'],
        moderation: ['moderation', 'automod', 'guard', 'clear', 'clear-messages'],
        leveling: ['level', 'leaderboard'],
        games: ['blackjack', 'coinflip', 'dice', 'slots', 'roulette', 'lottery', 'racing'],
        utility: ['ping', 'stats', 'help', 'profile'],
        setup: ['setup', 'quicksetup', 'admin', 'features', 'welcome', 'verify', 'backup'],
        roles: ['role', 'reaction-roles'],
        quests: ['quest'],
        tickets: ['ticket'],
        giveaway: ['giveaway'],
        premium: ['premium'],
        custom: ['custom']
    };
    
    for (const [category, commands] of Object.entries(categories)) {
        if (commands.includes(commandName)) {
            return category;
        }
    }
    
    return 'general';
}

module.exports = { categorizeCommand };

