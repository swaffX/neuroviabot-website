const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Guild = sequelize.define('Guild', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    
    // Genel Ayarlar
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    prefix: {
        type: DataTypes.STRING,
        defaultValue: '/'
    },
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
    timezone: {
        type: DataTypes.STRING,
        defaultValue: 'Europe/Istanbul'
    },

    // Kanal Ayarları
    welcomeChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    leaveChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    logChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    modLogChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ticketCategoryId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ticketLogChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verificationChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rulesChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Rol Ayarları
    muteRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    memberRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    botRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ticketSupportRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    moderatorRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adminRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Welcome/Leave Sistemi
    welcomeEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    welcomeMessage: {
        type: DataTypes.TEXT,
        defaultValue: 'Hoş geldin {user}! Sunucumuzda {memberCount} kişi olduk!'
    },
    welcomeEmbed: {
        type: DataTypes.JSON,
        allowNull: true
    },
    leaveEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    leaveMessage: {
        type: DataTypes.TEXT,
        defaultValue: '{user} sunucumuzu terk etti. Görüşürüz!'
    },
    leaveEmbed: {
        type: DataTypes.JSON,
        allowNull: true
    },
    dmWelcome: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dmWelcomeMessage: {
        type: DataTypes.TEXT,
        defaultValue: 'Hoş geldin! {guild} sunucusuna katıldın!'
    },

    // Auto Role Sistemi
    autoRoleEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    autoRoles: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    botAutoRoleEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Ticket Sistemi
    ticketEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ticketMessage: {
        type: DataTypes.TEXT,
        defaultValue: 'Destek talebi oluşturmak için aşağıdaki butona tıklayın!'
    },
    ticketCategories: {
        type: DataTypes.JSON,
        defaultValue: [
            { name: 'Genel Destek', emoji: '🎫', description: 'Genel destek talebi' },
            { name: 'Teknik Destek', emoji: '🔧', description: 'Teknik sorunlar için' },
            { name: 'Şikayet', emoji: '⚠️', description: 'Şikayet ve öneriler' }
        ]
    },
    maxTicketsPerUser: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    ticketTranscript: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },

    // Moderasyon Sistemi
    moderationEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    autoModEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    autoDeleteInvites: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    autoDeleteLinks: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    antiSpamEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    antiCapsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    maxWarnings: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    warnAction: {
        type: DataTypes.ENUM('kick', 'ban', 'mute'),
        defaultValue: 'kick'
    },

    // Guard Sistemi
    guardEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    antiRaidEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    maxJoinsPerMinute: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    raidAction: {
        type: DataTypes.ENUM('kick', 'ban', 'lockdown'),
        defaultValue: 'kick'
    },
    whitelistUsers: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    whitelistRoles: {
        type: DataTypes.JSON,
        defaultValue: []
    },

    // Ekonomi Sistemi
    economyEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    currencyName: {
        type: DataTypes.STRING,
        defaultValue: 'Coin'
    },
    currencySymbol: {
        type: DataTypes.STRING,
        defaultValue: '💰'
    },
    dailyAmount: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    workCooldown: {
        type: DataTypes.INTEGER,
        defaultValue: 3600000 // 1 saat
    },
    workMinAmount: {
        type: DataTypes.INTEGER,
        defaultValue: 50
    },
    workMaxAmount: {
        type: DataTypes.INTEGER,
        defaultValue: 200
    },

    // Seviye Sistemi
    levelingEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    xpPerMessage: {
        type: DataTypes.INTEGER,
        defaultValue: 15
    },
    xpCooldown: {
        type: DataTypes.INTEGER,
        defaultValue: 60000 // 1 dakika
    },
    levelUpMessage: {
        type: DataTypes.TEXT,
        defaultValue: 'Tebrikler {user}! {level}. seviyeye ulaştın!'
    },
    levelUpChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    levelRoles: {
        type: DataTypes.JSON,
        defaultValue: []
    },

    // Doğrulama Sistemi
    verificationEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verificationType: {
        type: DataTypes.ENUM('button', 'captcha', 'reaction'),
        defaultValue: 'button'
    },
    verificationMessage: {
        type: DataTypes.TEXT,
        defaultValue: 'Sunucuya erişim için doğrulama yapmalısınız!'
    },
    unverifiedRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Çekiliş Sistemi
    giveawayRole: {
        type: DataTypes.STRING,
        allowNull: true
    },
    giveawayChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Müzik Sistemi Ayarları
    musicChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    djRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    maxQueueSize: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    defaultVolume: {
        type: DataTypes.INTEGER,
        defaultValue: 50
    },

    // Loglar
    messageLogsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    voiceLogsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    memberLogsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    roleLogsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    channelLogsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }

}, {
    tableName: 'guilds',
    timestamps: true,
    indexes: [
        {
            fields: ['premium']
        },
        {
            fields: ['economyEnabled']
        },
        {
            fields: ['levelingEnabled']
        }
    ]
});

module.exports = Guild;





