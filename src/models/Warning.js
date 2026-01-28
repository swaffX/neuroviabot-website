const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Warning = sequelize.define('Warning', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    
    // İlişkiler
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
    
    // Uyarı Detayları
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    severity: {
        type: DataTypes.ENUM('minor', 'moderate', 'severe', 'critical'),
        defaultValue: 'moderate'
    },
    
    // Durum
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    
    // Kanal ve Mesaj Bilgileri
    channelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Otomatik İşlemler
    autoAction: {
        type: DataTypes.ENUM('none', 'kick', 'ban', 'mute'),
        defaultValue: 'none'
    },
    autoActionExecuted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Süre Bilgileri
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // İptal Bilgileri
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
    
    // Case Number
    caseNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    
    // Notlar
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Kanıt
    evidence: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Metadata
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }

}, {
    tableName: 'warnings',
    timestamps: true,
    indexes: [
        {
            fields: ['guildId', 'userId']
        },
        {
            fields: ['moderatorId']
        },
        {
            fields: ['active']
        },
        {
            fields: ['severity']
        },
        {
            fields: ['caseNumber']
        },
        {
            fields: ['expiresAt']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Warning;





