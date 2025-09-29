const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ModerationCase = sequelize.define('ModerationCase', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    
    // Temel Bilgiler
    caseNumber: {
        type: DataTypes.INTEGER,
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
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    moderatorId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    
    // İşlem Türü
    type: {
        type: DataTypes.ENUM(
            'warn', 'kick', 'ban', 'unban', 'mute', 'unmute', 
            'timeout', 'untimeout', 'note', 'voice_kick', 
            'voice_ban', 'voice_unban', 'role_add', 'role_remove'
        ),
        allowNull: false
    },
    
    // Sebep ve Detaylar
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Süre Bilgileri (mute, ban vs için)
    duration: {
        type: DataTypes.BIGINT, // milisaniye
        allowNull: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // Durum
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    revokedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    revokedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    revokeReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Mesaj ve Kanal Bilgileri
    channelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Kanıt ve Ekler
    evidence: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    attachments: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Otomatik İşlem
    automated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    autoReason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Bağlantılı İşlemler
    relatedCaseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'moderation_cases',
            key: 'id'
        }
    },
    
    // Notlar
    notes: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Log Mesajı
    logMessageId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // DM Durumu
    dmSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dmError: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Metadata
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }

}, {
    tableName: 'moderation_cases',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['guildId', 'caseNumber']
        },
        {
            fields: ['userId']
        },
        {
            fields: ['moderatorId']
        },
        {
            fields: ['type']
        },
        {
            fields: ['active']
        },
        {
            fields: ['revoked']
        },
        {
            fields: ['expiresAt']
        },
        {
            fields: ['automated']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = ModerationCase;



