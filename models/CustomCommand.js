const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CustomCommand = sequelize.define('CustomCommand', {
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
    createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    
    // Komut Bilgileri
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    aliases: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Komut İçeriği
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    contentType: {
        type: DataTypes.ENUM('text', 'embed', 'both'),
        defaultValue: 'text'
    },
    embedData: {
        type: DataTypes.JSON,
        allowNull: true
    },
    
    // Ayarlar
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    deleteCommand: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Cooldown ve Limitler
    cooldown: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // saniye
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true // null = sınırsız
    },
    
    // İzinler
    permissions: {
        type: DataTypes.JSON,
        defaultValue: {
            roles: [],
            users: [],
            channels: [],
            permissions: []
        }
    },
    everyoneCanUse: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    
    // İstatistikler
    usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastUsed: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastUsedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Variables ve Functions
    variables: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    autoRespond: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Tag System
    tags: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'general'
    },
    
    // Advanced Features
    reactions: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    autoDelete: {
        type: DataTypes.INTEGER,
        allowNull: true // saniye, null = otomatik silme yok
    },
    
    // Conditional Logic
    conditions: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    
    // Metadata
    version: {
        type: DataTypes.STRING,
        defaultValue: '1.0.0'
    },
    lastModified: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    modifiedBy: {
        type: DataTypes.STRING,
        allowNull: true
    }

}, {
    tableName: 'custom_commands',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['guildId', 'name']
        },
        {
            fields: ['guildId']
        },
        {
            fields: ['createdBy']
        },
        {
            fields: ['enabled']
        },
        {
            fields: ['category']
        },
        {
            fields: ['usageCount']
        },
        {
            fields: ['lastUsed']
        }
    ]
});

module.exports = CustomCommand;



