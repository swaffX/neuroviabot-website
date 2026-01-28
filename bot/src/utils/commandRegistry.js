// ==========================================
// 📋 Command Registry & Categorization
// ==========================================
// Central command management and filtering

const { logger } = require('./logger');

// Command categories
const COMMAND_CATEGORIES = {
    ADMIN: {
        name: 'Yönetim',
        icon: '⚙️',
        commands: ['admin', 'setup', 'quicksetup', 'backup', 'custom', 'guard', 'moderation']
    },
    MODERATION: {
        name: 'Moderasyon',
        icon: '🛡️',
        commands: ['automod', 'clear', 'moderation']
    },
    LEVELING: {
        name: 'Seviye Sistemi',
        icon: '📊',
        commands: ['level', 'leaderboard', 'profile']
    },
    ECONOMY: {
        name: 'Ekonomi',
        icon: '💰',
        commands: ['economy', 'shop', 'inventory', 'trade', 'market-config', 'invest', 'lottery']
    },
    CASINO: {
        name: 'Casino',
        icon: '🎰',
        commands: ['slots', 'blackjack', 'roulette', 'coinflip', 'dice', 'racing']
    },
    UTILITY: {
        name: 'Araçlar',
        icon: '🔧',
        commands: ['help', 'ping', 'stats', 'features', 'quest', 'queue-status']
    },
    ENGAGEMENT: {
        name: 'Etkileşim',
        icon: '🎉',
        commands: ['giveaway', 'ticket', 'reaction-roles', 'role', 'welcome', 'verify']
    },
    PREMIUM: {
        name: 'Premium',
        icon: '⭐',
        commands: ['premium']
    }
};

// Commands that should NOT be shown in dashboard
const HIDDEN_COMMANDS = [
    // Developer only commands
    'eval',
    'reload',
    'restart',
    // System commands
    'deploy',
    'guild-deploy'
];

// Commands that are essential and cannot be disabled
const ESSENTIAL_COMMANDS = [
    'help',
    'ping',
    'features'
];

/**
 * Get all commands with their categories
 */
function getAllCommands(client) {
    const commands = [];
    
    if (!client || !client.commands) {
        logger.error('[CommandRegistry] Client or commands not available');
        return commands;
    }
    
    client.commands.forEach((command, name) => {
        // Skip hidden commands
        if (HIDDEN_COMMANDS.includes(name)) {
            return;
        }
        
        // Find category
        let category = 'UTILITY';
        for (const [catKey, catData] of Object.entries(COMMAND_CATEGORIES)) {
            if (catData.commands.includes(name)) {
                category = catKey;
                break;
            }
        }
        
        commands.push({
            name,
            description: command.data?.description || 'Açıklama yok',
            category,
            categoryName: COMMAND_CATEGORIES[category]?.name || 'Araçlar',
            categoryIcon: COMMAND_CATEGORIES[category]?.icon || '🔧',
            essential: ESSENTIAL_COMMANDS.includes(name),
            permissions: command.data?.default_member_permissions || null,
            usage: command.usage || `/${name}`,
            enabled: true // Default enabled, can be toggled per guild
        });
    });
    
    return commands.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get commands for a specific guild
 */
function getGuildCommands(client, guildId) {
    const allCommands = getAllCommands(client);
    
    // Get guild-specific settings from database
    const { getDatabase } = require('../database/database');
    const db = getDatabase();
    const guildData = db.getGuild(guildId);
    
    if (!guildData || !guildData.disabledCommands) {
        return allCommands;
    }
    
    // Mark disabled commands
    return allCommands.map(cmd => ({
        ...cmd,
        enabled: !guildData.disabledCommands.includes(cmd.name)
    }));
}

/**
 * Toggle command for a guild
 */
function toggleGuildCommand(guildId, commandName) {
    // Can't disable essential commands
    if (ESSENTIAL_COMMANDS.includes(commandName)) {
        throw new Error('Bu komut devre dışı bırakılamaz');
    }
    
    const { getDatabase } = require('../database/database');
    const db = getDatabase();
    const guildData = db.getGuild(guildId);
    
    if (!guildData) {
        throw new Error('Sunucu bulunamadı');
    }
    
    if (!guildData.disabledCommands) {
        guildData.disabledCommands = [];
    }
    
    const isDisabled = guildData.disabledCommands.includes(commandName);
    
    if (isDisabled) {
        // Enable command
        guildData.disabledCommands = guildData.disabledCommands.filter(cmd => cmd !== commandName);
    } else {
        // Disable command
        guildData.disabledCommands.push(commandName);
    }
    
    db.saveGuild(guildId, guildData);
    
    return {
        command: commandName,
        enabled: !isDisabled,
        message: isDisabled ? 'Komut etkinleştirildi' : 'Komut devre dışı bırakıldı'
    };
}

/**
 * Get command categories
 */
function getCommandCategories() {
    return COMMAND_CATEGORIES;
}

module.exports = {
    getAllCommands,
    getGuildCommands,
    toggleGuildCommand,
    getCommandCategories,
    COMMAND_CATEGORIES,
    HIDDEN_COMMANDS,
    ESSENTIAL_COMMANDS
};

