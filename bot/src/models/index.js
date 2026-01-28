// ==========================================
// 🤖 NeuroViaBot - Database Models (Simple DB)
// ==========================================

const db = require('../database/simple-db');
const { logger } = require('../utils/logger');

// Database işlemlerini başlat
async function initializeModels() {
    try {
        logger.success('Simple Database sistemi başlatıldı!');
        
        // Eski backup dosyalarını temizle
        db.cleanOldBackups();
        
        return true;
    } catch (error) {
        logger.error('Database başlatma hatası', error);
        return false;
    }
}

// User model fonksiyonları
const User = {
    async findOrCreate(userId, userData = {}) {
        return db.getOrCreateUser(userId, userData);
    },

    async findById(userId) {
        return db.getUser(userId);
    },

    async update(userId, userData) {
        const user = db.getOrCreateUser(userId);
        return db.getOrCreateUser(userId, { ...user, ...userData });
    },

    async count() {
        return db.data.users.size;
    }
};

// Guild model fonksiyonları
const Guild = {
    async findOrCreate(guildId, guildData = {}) {
        return db.getOrCreateGuild(guildId, guildData);
    },

    async findById(guildId) {
        return db.getGuild(guildId);
    },

    async update(guildId, guildData) {
        const guild = db.getOrCreateGuild(guildId);
        return db.getOrCreateGuild(guildId, { ...guild, ...guildData });
    },

    async count() {
        return db.data.guilds.size;
    }
};

// GuildMember model fonksiyonları
const GuildMember = {
    async findOrCreate(userId, guildId, memberData = {}) {
        const key = `${guildId}-${userId}`;
        let member = db.data.guildMembers.get(key);
        
        if (!member) {
            member = {
                userId,
                guildId,
                nickname: memberData.nickname || null,
                joinedAt: memberData.joinedAt || new Date().toISOString(),
                leftAt: null,
                lastActive: new Date().toISOString(),
                ...memberData
            };
            db.data.guildMembers.set(key, member);
        } else {
            // Güncelle
            if (memberData.nickname !== undefined) member.nickname = memberData.nickname;
            if (memberData.joinedAt) member.joinedAt = memberData.joinedAt;
            member.lastActive = new Date().toISOString();
            db.data.guildMembers.set(key, member);
        }
        
        return member;
    },

    async findOne(where) {
        const key = `${where.guildId}-${where.userId}`;
        return db.data.guildMembers.get(key) || null;
    },

    async update(member, updateData) {
        const key = `${member.guildId}-${member.userId}`;
        const current = db.data.guildMembers.get(key);
        if (current) {
            const updated = { ...current, ...updateData };
            db.data.guildMembers.set(key, updated);
            return updated;
        }
        return null;
    },

    async count() {
        return db.data.guildMembers.size;
    }
};

// Economy model fonksiyonları
const Economy = {
    async getUserBalance(userId) {
        const economy = db.getUserEconomy(userId);
        return economy.balance || 0;
    },

    async updateBalance(userId, amount) {
        const economy = db.getUserEconomy(userId);
        const newBalance = Math.max(0, economy.balance + amount);
        return db.updateUserEconomy(userId, { balance: newBalance });
    },

    async setBalance(userId, amount) {
        return db.updateUserEconomy(userId, { balance: Math.max(0, amount) });
    },

    async getUserEconomy(userId) {
        return db.getUserEconomy(userId);
    },

    async updateUserEconomy(userId, economyData) {
        return db.updateUserEconomy(userId, economyData);
    },

    async getTopUsers(limit = 10) {
        const users = Array.from(db.data.userEconomy.values())
            .sort((a, b) => b.balance - a.balance)
            .slice(0, limit);
        return users;
    }
};

// Warning model fonksiyonları
const Warning = {
    async create(userId, guildId, moderatorId, reason) {
        return db.addWarning(userId, guildId, moderatorId, reason);
    },

    async findAll(userId, guildId) {
        return db.getUserWarnings(userId, guildId);
    },

    async remove(warningId) {
        return db.removeWarning(warningId);
    },

    async count() {
        return db.data.warnings.size;
    }
};

// Settings model fonksiyonları
const Settings = {
    async getGuildSettings(guildId) {
        return db.getGuildSettings(guildId);
    },

    async updateGuildSettings(guildId, settings) {
        return db.updateGuildSettings(guildId, settings);
    }
};

// Ticket model fonksiyonları
const Ticket = {
    async create(ticketData) {
        const ticketId = Date.now().toString();
        const ticket = {
            id: ticketId,
            userId: ticketData.userId,
            guildId: ticketData.guildId,
            channelId: ticketData.channelId,
            category: ticketData.category || 'general',
            status: 'open',
            createdAt: new Date().toISOString(),
            closedAt: null,
            ...ticketData
        };
        
        db.data.tickets.set(ticketId, ticket);
        return ticket;
    },

    async findById(ticketId) {
        return db.data.tickets.get(ticketId) || null;
    },

    async findByChannel(channelId) {
        for (const [id, ticket] of db.data.tickets) {
            if (ticket.channelId === channelId) {
                return ticket;
            }
        }
        return null;
    },

    async update(ticketId, updateData) {
        const ticket = db.data.tickets.get(ticketId);
        if (ticket) {
            const updated = { ...ticket, ...updateData };
            db.data.tickets.set(ticketId, updated);
            return updated;
        }
        return null;
    },

    async count() {
        return db.data.tickets.size;
    }
};

// Giveaway model fonksiyonları
const Giveaway = {
    async create(giveawayData) {
        const giveawayId = Date.now().toString();
        const giveaway = {
            id: giveawayId,
            guildId: giveawayData.guildId,
            channelId: giveawayData.channelId,
            messageId: giveawayData.messageId,
            hosterId: giveawayData.hosterId,
            title: giveawayData.title,
            description: giveawayData.description || null,
            prize: giveawayData.prize,
            winnerCount: giveawayData.winnerCount || 1,
            endTime: giveawayData.endTime,
            entries: giveawayData.entries || [],
            winners: giveawayData.winners || [],
            status: 'active',
            createdAt: new Date().toISOString(),
            ...giveawayData
        };
        
        db.data.giveaways.set(giveawayId, giveaway);
        return giveaway;
    },

    async findById(giveawayId) {
        return db.data.giveaways.get(giveawayId) || null;
    },

    async findByMessage(messageId) {
        for (const [id, giveaway] of db.data.giveaways) {
            if (giveaway.messageId === messageId) {
                return giveaway;
            }
        }
        return null;
    },

    async findActive() {
        const activeGiveaways = [];
        for (const [id, giveaway] of db.data.giveaways) {
            if (giveaway.status === 'active' && new Date(giveaway.endTime) > new Date()) {
                activeGiveaways.push(giveaway);
            }
        }
        return activeGiveaways;
    },

    async update(giveawayId, updateData) {
        const giveaway = db.data.giveaways.get(giveawayId);
        if (giveaway) {
            const updated = { ...giveaway, ...updateData };
            db.data.giveaways.set(giveawayId, updated);
            return updated;
        }
        return null;
    },

    async count() {
        return db.data.giveaways.size;
    }
};

// Custom Command model fonksiyonları
const CustomCommand = {
    async create(commandData) {
        const commandId = Date.now().toString();
        const command = {
            id: commandId,
            guildId: commandData.guildId,
            name: commandData.name.toLowerCase(),
            response: commandData.response,
            createdBy: commandData.createdBy,
            createdAt: new Date().toISOString(),
            usageCount: 0,
            ...commandData
        };
        
        db.data.customCommands.set(commandId, command);
        return command;
    },

    async findByName(guildId, commandName) {
        for (const [id, command] of db.data.customCommands) {
            if (command.guildId === guildId && command.name === commandName.toLowerCase()) {
                return command;
            }
        }
        return null;
    },

    async findByGuild(guildId) {
        const guildCommands = [];
        for (const [id, command] of db.data.customCommands) {
            if (command.guildId === guildId) {
                guildCommands.push(command);
            }
        }
        return guildCommands;
    },

    async update(commandId, updateData) {
        const command = db.data.customCommands.get(commandId);
        if (command) {
            const updated = { ...command, ...updateData };
            db.data.customCommands.set(commandId, updated);
            return updated;
        }
        return null;
    },

    async delete(commandId) {
        return db.data.customCommands.delete(commandId);
    },

    async count() {
        return db.data.customCommands.size;
    }
};

// Helper fonksiyonları
async function getOrCreateUser(userId, userData = {}) {
    return User.findOrCreate(userId, userData);
}

async function getOrCreateGuild(guildId, guildData = {}) {
    return Guild.findOrCreate(guildId, guildData);
}

async function getOrCreateGuildMember(userId, guildId, memberData = {}) {
    return GuildMember.findOrCreate(userId, guildId, memberData);
}

// Statistics fonksiyonları
async function getDatabaseStats() {
    return db.getStats();
}

// Backup fonksiyonları
async function createBackup() {
    return db.createBackup();
}

module.exports = {
    // Database
    db,
    
    // Models
    User,
    Guild,
    GuildMember,
    Economy,
    Warning,
    Settings,
    Ticket,
    Giveaway,
    CustomCommand,
    
    // Functions
    initializeModels,
    getOrCreateUser,
    getOrCreateGuild,
    getOrCreateGuildMember,
    getDatabaseStats,
    createBackup
};