const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    
    // Temel Bilgiler
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    discriminator: {
        type: DataTypes.STRING,
        allowNull: false
    },
    globalName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Global Ayarlar
    premium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    premiumUntil: {
        type: DataTypes.DATE,
        allowNull: true
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'tr'
    },
    blacklisted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    blacklistReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Global Ekonomi
    globalBalance: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    globalBank: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    globalLastDaily: {
        type: DataTypes.DATE,
        allowNull: true
    },
    globalLastWork: {
        type: DataTypes.DATE,
        allowNull: true
    },
    globalInventory: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Global İstatistikler
    totalCommands: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalMessages: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalVoiceTime: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    totalMusicTime: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    
    // Global Achievements
    achievements: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // API Ayarları
    apiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: 'apiKey_unique'
    },
    dashboardAccess: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Son Aktivite
    lastSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    lastGuild: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Etiketler
    badges: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Ödüller
    rewards: {
        type: DataTypes.JSON,
        defaultValue: []
    }

}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        {
            fields: ['premium']
        },
        {
            fields: ['blacklisted']
        },
        {
            fields: ['globalBalance']
        },
        {
            fields: ['totalCommands']
        },
        {
            fields: ['lastSeen']
        },
        {
            fields: ['apiKey']
        }
    ]
});

module.exports = User;

