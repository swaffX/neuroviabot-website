const { sequelize, initializeDatabase } = require('../database/connection');
const { logger } = require('../utils/logger');

// Model importları
const User = require('./User');
const Guild = require('./Guild');
const GuildMember = require('./GuildMember');
const Ticket = require('./Ticket');
const Warning = require('./Warning');
const Giveaway = require('./Giveaway');
const ModerationCase = require('./ModerationCase');
const CustomCommand = require('./CustomCommand');

// Model ilişkilerini tanımla
function defineAssociations() {
    // User ilişkileri
    User.hasMany(GuildMember, { foreignKey: 'userId', as: 'memberships' });
    User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
    User.hasMany(Warning, { foreignKey: 'userId', as: 'warnings' });
    User.hasMany(Warning, { foreignKey: 'moderatorId', as: 'givenWarnings' });
    User.hasMany(Giveaway, { foreignKey: 'hosterId', as: 'hostedGiveaways' });
    User.hasMany(ModerationCase, { foreignKey: 'userId', as: 'moderationCases' });
    User.hasMany(ModerationCase, { foreignKey: 'moderatorId', as: 'performedModerations' });

    // Guild ilişkileri
    Guild.hasMany(GuildMember, { foreignKey: 'guildId', as: 'members' });
    Guild.hasMany(Ticket, { foreignKey: 'guildId', as: 'tickets' });
    Guild.hasMany(Warning, { foreignKey: 'guildId', as: 'warnings' });
    Guild.hasMany(Giveaway, { foreignKey: 'guildId', as: 'giveaways' });
    Guild.hasMany(ModerationCase, { foreignKey: 'guildId', as: 'moderationCases' });

    // GuildMember ilişkileri
    GuildMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    GuildMember.belongsTo(Guild, { foreignKey: 'guildId', as: 'guild' });

    // Ticket ilişkileri
    Ticket.belongsTo(User, { foreignKey: 'userId', as: 'creator' });
    Ticket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
    Ticket.belongsTo(User, { foreignKey: 'closedBy', as: 'closer' });
    Ticket.belongsTo(Guild, { foreignKey: 'guildId', as: 'guild' });

    // Warning ilişkileri
    Warning.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Warning.belongsTo(User, { foreignKey: 'moderatorId', as: 'moderator' });
    Warning.belongsTo(User, { foreignKey: 'revokedBy', as: 'revoker' });
    Warning.belongsTo(Guild, { foreignKey: 'guildId', as: 'guild' });

    // Giveaway ilişkileri
    Giveaway.belongsTo(User, { foreignKey: 'hosterId', as: 'host' });
    Giveaway.belongsTo(User, { foreignKey: 'endedBy', as: 'ender' });
    Giveaway.belongsTo(Guild, { foreignKey: 'guildId', as: 'guild' });

    // ModerationCase ilişkileri
    ModerationCase.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    ModerationCase.belongsTo(User, { foreignKey: 'moderatorId', as: 'moderator' });
    ModerationCase.belongsTo(User, { foreignKey: 'revokedBy', as: 'revoker' });
    ModerationCase.belongsTo(Guild, { foreignKey: 'guildId', as: 'guild' });
    ModerationCase.belongsTo(ModerationCase, { foreignKey: 'relatedCaseId', as: 'relatedCase' });

    logger.success('Model ilişkileri tanımlandı!');
}

// Database'i başlat
async function initializeModels() {
    try {
        // İlişkileri tanımla
        defineAssociations();

        // Database'i başlat
        const initialized = await initializeDatabase();
        if (!initialized) {
            throw new Error('Database başlatılamadı');
        }

        logger.success('Tüm modeller başarıyla başlatıldı!');
        return true;
    } catch (error) {
        logger.error('Model başlatma hatası', error);
        return false;
    }
}

// Helper fonksiyonları
async function getOrCreateUser(userId, userData = {}) {
    try {
        const [user, created] = await User.findOrCreate({
            where: { id: userId },
            defaults: {
                username: userData.username || 'Unknown',
                discriminator: userData.discriminator || '0000',
                globalName: userData.globalName || null,
                avatar: userData.avatar || null,
                ...userData
            }
        });

        if (!created && userData.username) {
            // Kullanıcı bilgilerini güncelle
            await user.update({
                username: userData.username,
                discriminator: userData.discriminator,
                globalName: userData.globalName,
                avatar: userData.avatar,
                lastSeen: new Date()
            });
        }

        return user;
    } catch (error) {
        logger.error('User getOrCreate hatası', error);
        return null;
    }
}

async function getOrCreateGuild(guildId, guildData = {}) {
    try {
        const [guild, created] = await Guild.findOrCreate({
            where: { id: guildId },
            defaults: {
                name: guildData.name || 'Unknown Guild',
                ...guildData
            }
        });

        if (!created && guildData.name) {
            // Guild bilgilerini güncelle
            await guild.update({
                name: guildData.name
            });
        }

        return guild;
    } catch (error) {
        logger.error('Guild getOrCreate hatası', error);
        return null;
    }
}

async function getOrCreateGuildMember(userId, guildId, memberData = {}) {
    try {
        const [guildMember, created] = await GuildMember.findOrCreate({
            where: { userId, guildId },
            defaults: {
                nickname: memberData.nickname || null,
                joinedAt: memberData.joinedAt || new Date(),
                ...memberData
            }
        });

        if (!created) {
            // Member bilgilerini güncelle
            await guildMember.update({
                nickname: memberData.nickname,
                lastActive: new Date(),
                ...memberData
            });
        }

        return guildMember;
    } catch (error) {
        logger.error('GuildMember getOrCreate hatası', error);
        return null;
    }
}

// Statistics fonksiyonları
async function getDatabaseStats() {
    try {
        const stats = {
            users: await User.count(),
            guilds: await Guild.count(),
            guildMembers: await GuildMember.count(),
            tickets: await Ticket.count(),
            warnings: await Warning.count(),
            giveaways: await Giveaway.count(),
            moderationCases: await ModerationCase.count()
        };

        return stats;
    } catch (error) {
        logger.error('Database stats hatası', error);
        return null;
    }
}

module.exports = {
    // Sequelize
    sequelize,
    
    // Models
    User,
    Guild,
    GuildMember,
    Ticket,
    Warning,
    Giveaway,
    ModerationCase,
    CustomCommand,
    
    // Functions
    initializeModels,
    defineAssociations,
    getOrCreateUser,
    getOrCreateGuild,
    getOrCreateGuildMember,
    getDatabaseStats
};
