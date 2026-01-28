const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const GuildMember = sequelize.define('GuildMember', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    
    // İlişkiler
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'guilds',
            key: 'id'
        }
    },
    
    // Temel Bilgiler
    nickname: {
        type: DataTypes.STRING,
        allowNull: true
    },
    joinedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // Ekonomi Sistemi
    balance: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    bank: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    lastDaily: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastWork: {
        type: DataTypes.DATE,
        allowNull: true
    },
    inventory: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    dailyStreak: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    workStreak: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    
    // Seviye Sistemi
    xp: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastXpGain: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // Moderasyon
    warnings: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    kicks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    bans: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    mutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    
    // Mute Sistemi
    isMuted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    muteUntil: {
        type: DataTypes.DATE,
        allowNull: true
    },
    muteReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mutedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // İstatistikler
    messageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    voiceTime: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    commandsUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    
    // Voice Statistics
    voiceJoins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastVoiceJoin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    currentVoiceChannel: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Doğrulama
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // Roller
    roles: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    tempRoles: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Notlar
    notes: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Son Aktiviteler
    lastMessage: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastCommand: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastActive: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    
    // Ödüller ve Başarımlar
    achievements: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    rewards: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Özel Ayarlar
    settings: {
        type: DataTypes.JSON,
        defaultValue: {
            notifications: true,
            privateProfile: false,
            showStats: true
        }
    }

}, {
    tableName: 'guild_members',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'guildId']
        },
        {
            fields: ['balance']
        },
        {
            fields: ['level']
        },
        {
            fields: ['xp']
        },
        {
            fields: ['warnings']
        },
        {
            fields: ['isMuted']
        },
        {
            fields: ['verified']
        },
        {
            fields: ['messageCount']
        },
        {
            fields: ['voiceTime']
        },
        {
            fields: ['lastActive']
        }
    ]
});

module.exports = GuildMember;





