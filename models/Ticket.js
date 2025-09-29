const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    
    // Temel Bilgiler
    ticketId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    // Ticket Detayları
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    
    // Durum
    status: {
        type: DataTypes.ENUM('open', 'in_progress', 'waiting', 'closed'),
        defaultValue: 'open'
    },
    
    // Katılımcılar
    assignedTo: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    participants: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Zaman Bilgileri
    openedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    closedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    closedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    closeReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Mesaj İstatistikleri
    messageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastMessage: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // Transcript
    transcriptUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transcriptCreated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Rating ve Feedback
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Etiketler
    tags: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Notlar (Staff için)
    notes: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Otomatik Kapanma
    autoCloseAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    autoCloseWarned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // İstatistikler
    responseTime: {
        type: DataTypes.INTEGER, // dakika cinsinden
        allowNull: true
    },
    resolutionTime: {
        type: DataTypes.INTEGER, // dakika cinsinden
        allowNull: true
    },
    
    // Metadata
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }

}, {
    tableName: 'tickets',
    timestamps: true,
    indexes: [
        {
            fields: ['ticketId']
        },
        {
            fields: ['guildId']
        },
        {
            fields: ['userId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['category']
        },
        {
            fields: ['priority']
        },
        {
            fields: ['assignedTo']
        },
        {
            fields: ['openedAt']
        },
        {
            fields: ['closedAt']
        },
        {
            fields: ['rating']
        }
    ]
});

module.exports = Ticket;



