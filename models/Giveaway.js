const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Giveaway = sequelize.define('Giveaway', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    
    // Temel Bilgiler
    messageId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'guilds',
            key: 'id'
        }
    },
    hosterId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    
    // Çekiliş Detayları
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    prize: {
        type: DataTypes.STRING,
        allowNull: false
    },
    winnerCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    
    // Zaman Bilgileri
    startTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER, // milisaniye cinsinden
        allowNull: false
    },
    
    // Durum
    status: {
        type: DataTypes.ENUM('active', 'ended', 'cancelled', 'paused'),
        defaultValue: 'active'
    },
    
    // Gereksinimler
    requirements: {
        type: DataTypes.JSON,
        defaultValue: {
            roles: [],
            minLevel: 0,
            minMessages: 0,
            minAge: 0, // gün cinsinden
            blacklistedRoles: [],
            requiredChannels: []
        }
    },
    
    // Katılımcılar
    participants: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    participantCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    
    // Kazananlar
    winners: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    winnersPicked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    winnersAnnounced: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Bitiş Bilgileri
    endedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    endedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    endReason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Ayarlar
    settings: {
        type: DataTypes.JSON,
        defaultValue: {
            allowMultipleEntries: false,
            dmWinners: true,
            deleteAfterEnd: false,
            autoReroll: false,
            pingWinners: true,
            showParticipants: true
        }
    },
    
    // Otomatik Tekrar
    rerollCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxRerolls: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    lastRerollAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // Emoji ve Görünüm
    emoji: {
        type: DataTypes.STRING,
        defaultValue: '🎉'
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#ff6b6b'
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Bonus Sistemler
    bonusEntries: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Mesajlar
    winMessage: {
        type: DataTypes.TEXT,
        defaultValue: 'Tebrikler {winners}! **{prize}** kazandınız!'
    },
    noWinnerMessage: {
        type: DataTypes.TEXT,
        defaultValue: 'Çekilişe kimse katılmadığı için iptal edildi.'
    },
    dmMessage: {
        type: DataTypes.TEXT,
        defaultValue: 'Tebrikler! **{guild}** sunucusundaki **{prize}** çekilişini kazandınız!'
    },
    
    // İstatistikler
    totalMessages: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    
    // Metadata
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }

}, {
    tableName: 'giveaways',
    timestamps: true,
    indexes: [
        {
            fields: ['messageId']
        },
        {
            fields: ['guildId']
        },
        {
            fields: ['hosterId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['endTime']
        },
        {
            fields: ['winnersPicked']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Giveaway;



