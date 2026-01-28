// ==========================================
// 🤖 NeuroViaBot - Simple JSON Database (Backend)
// Shared with bot for real-time settings sync
// ==========================================

const fs = require('fs');
const path = require('path');

class SimpleDatabase {
    constructor() {
        // Use shared data directory with bot
        this.dataDir = path.join(__dirname, '..', '..', 'data');
        this.dbPath = path.join(this.dataDir, 'database.json');
        this.backupPath = path.join(this.dataDir, 'database-backup.json');
        
        this.data = {
            users: new Map(),
            guilds: new Map(),
            guildMembers: new Map(),
            userEconomy: new Map(),
            warnings: new Map(),
            tickets: new Map(),
            giveaways: new Map(),
            customCommands: new Map(),
            settings: new Map()
        };
        
        this.ensureDirectory();
        this.loadData();
        
        // Auto-save every 5 minutes
        setInterval(() => this.saveData(), 5 * 60 * 1000);
    }

    ensureDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    // Load data from disk
    loadData() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const rawData = fs.readFileSync(this.dbPath, 'utf8');
                const jsonData = JSON.parse(rawData);
                
                // Convert JSON objects to Maps
                for (const [key, value] of Object.entries(jsonData)) {
                    if (this.data.hasOwnProperty(key)) {
                        this.data[key] = new Map(Object.entries(value || {}));
                    }
                }
                
                console.log('[Backend DB] Database loaded from JSON file');
            } else {
                console.log('[Backend DB] Creating new database');
                this.saveData();
            }
        } catch (error) {
            console.error('[Backend DB] Database load error:', error.message);
            
            // Try to restore from backup
            if (fs.existsSync(this.backupPath)) {
                try {
                    const backupData = fs.readFileSync(this.backupPath, 'utf8');
                    const jsonBackup = JSON.parse(backupData);
                    
                    for (const [key, value] of Object.entries(jsonBackup)) {
                        if (this.data.hasOwnProperty(key)) {
                            this.data[key] = new Map(Object.entries(value || {}));
                        }
                    }
                    
                    console.warn('[Backend DB] Database restored from backup');
                } catch (backupError) {
                    console.error('[Backend DB] Backup restore error:', backupError.message);
                }
            }
        }
    }

    // Save data to disk
    saveData() {
        try {
            // Create backup
            if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, this.backupPath);
            }
            
            // Convert Maps to JSON objects
            const jsonData = {};
            for (const [key, mapValue] of Object.entries(this.data)) {
                jsonData[key] = Object.fromEntries(mapValue);
            }
            
            // Write to file
            fs.writeFileSync(this.dbPath, JSON.stringify(jsonData, null, 2), 'utf8');
            
        } catch (error) {
            console.error('[Backend DB] Database save error:', error.message);
        }
    }

    // Guild operations
    getOrCreateGuild(guildId, guildData = {}) {
        let guild = this.data.guilds.get(guildId);
        
        if (!guild) {
            guild = {
                id: guildId,
                name: guildData.name || 'Unknown',
                memberCount: guildData.memberCount || 0,
                ownerId: guildData.ownerId || null,
                icon: guildData.icon || null,
                active: guildData.active !== undefined ? guildData.active : true,
                joinedAt: guildData.joinedAt || new Date().toISOString(),
                ...guildData
            };
            
            this.data.guilds.set(guildId, guild);
            this.saveData();
            console.log(`[Backend DB] Guild created: ${guild.name} (${guildId})`);
        }
        
        return guild;
    }

    // Guild settings operations
    getGuildSettings(guildId) {
        let settings = this.data.settings.get(guildId);
        
        if (!settings) {
            // Default settings matching bot format
            settings = {
                guildId,
                prefix: '!',
                language: 'tr',
                welcomeChannel: null,
                leaveChannel: null,
                logChannel: null,
                muteRole: null,
                features: {
                    music: true,
                    economy: true,
                    moderation: true,
                    leveling: true,
                    tickets: true,
                    giveaways: true,
                    welcome: true,
                    autorole: false
                },
                welcome: {
                    enabled: true,
                    channelId: null,
                    message: 'Hoş geldin {user}! Sunucumuza katıldığın için teşekkürler! 🎉',
                    embedEnabled: false,
                    embedColor: '#5865F2',
                },
                leave: {
                    enabled: false,
                    channelId: null,
                    message: '{user} sunucudan ayrıldı. Görüşmek üzere! 👋',
                },
                moderation: {
                    enabled: true,
                    autoMod: true,
                    spamProtection: true,
                    antiInvite: false,
                    antiLink: false,
                    bannedWords: [],
                    logChannelId: null,
                    muteRoleId: null,
                    maxWarnings: 3,
                },
                leveling: {
                    enabled: true,
                    xpPerMessage: 15,
                    xpCooldown: 60,
                    levelUpMessage: 'Tebrikler {user}! {level}. seviyeye ulaştın! 🎉',
                    levelUpChannelId: null,
                },
                autorole: {
                    enabled: false,
                    roleIds: [],
                },
                general: {
                    prefix: '!',
                    language: 'tr',
                },
                // Logging settings
                loggingEnabled: false,
                messageLogChannel: null,
                serverLogChannel: null,
            };
            
            this.data.settings.set(guildId, settings);
            this.saveData();
            console.log(`[Backend DB] Default settings created for guild: ${guildId}`);
        }
        
        return settings;
    }

    updateGuildSettings(guildId, updates) {
        console.log(`[Backend DB] Updating settings for guild ${guildId}`);
        
        const current = this.getGuildSettings(guildId);
        
        // Deep merge nested objects (welcome, leave, moderation, leveling, etc.)
        const updated = {
            guildId,
            prefix: updates.general?.prefix ?? updates.prefix ?? current.prefix,
            language: updates.general?.language ?? updates.language ?? current.language,
            welcomeChannel: current.welcomeChannel,
            leaveChannel: current.leaveChannel,
            logChannel: current.logChannel,
            muteRole: current.muteRole,
            features: { ...current.features, ...updates.features },
            welcome: { ...current.welcome, ...updates.welcome },
            leave: { ...current.leave, ...updates.leave },
            moderation: { ...current.moderation, ...updates.moderation },
            leveling: { ...current.leveling, ...updates.leveling },
            autorole: { ...current.autorole, ...updates.autorole },
            general: { ...current.general, ...updates.general },
            loggingEnabled: updates.loggingEnabled ?? current.loggingEnabled,
            messageLogChannel: updates.messageLogChannel ?? current.messageLogChannel,
            serverLogChannel: updates.serverLogChannel ?? current.serverLogChannel,
        };
        
        this.data.settings.set(guildId, updated);
        this.saveData();
        
        console.log(`[Backend DB] Settings saved for guild ${guildId}`);
        return updated;
    }

    updateGuildSettingsCategory(guildId, category, updates) {
        console.log(`[Backend DB] Updating ${category} settings for guild ${guildId}:`, updates);
        
        const current = this.getGuildSettings(guildId);
        current[category] = { ...current[category], ...updates };
        
        this.data.settings.set(guildId, current);
        this.saveData();
        
        console.log(`[Backend DB] Category ${category} saved for guild ${guildId}`);
        return current;
    }

    // Guild Features yönetimi (guild-specific)
    isGuildFeatureEnabled(guildId, feature) {
        const settings = this.getGuildSettings(guildId);
        return settings.features?.[feature] === true;
    }

    updateGuildFeature(guildId, feature, enabled) {
        const settings = this.getGuildSettings(guildId);
        if (!settings.features) {
            settings.features = {};
        }
        settings.features[feature] = enabled;
        this.updateGuildSettings(guildId, settings);
        this.saveData();
        return true;
    }

    getGuildFeatures(guildId) {
        const settings = this.getGuildSettings(guildId);
        return settings.features || {};
    }

    // Statistics
    getStats() {
        return {
            users: this.data.users.size,
            guilds: this.data.guilds.size,
            guildMembers: this.data.guildMembers.size,
            economy: this.data.userEconomy.size,
            warnings: this.data.warnings.size,
            tickets: this.data.tickets.size,
            giveaways: this.data.giveaways.size,
            customCommands: this.data.customCommands.size,
            settings: this.data.settings.size
        };
    }
}

// Singleton instance
let dbInstance = null;

function getDatabase() {
    if (!dbInstance) {
        dbInstance = new SimpleDatabase();
    }
    return dbInstance;
}

module.exports = {
    getDatabase,
    SimpleDatabase
};

