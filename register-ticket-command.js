const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'ticket',
        description: '🎫 Ticket sistemi yönetimi',
        options: [
            {
                type: 1, // SUB_COMMAND
                name: 'setup',
                description: '📝 Ticket sistemini kur',
                options: [
                    {
                        type: 7, // CHANNEL
                        name: 'kanal',
                        description: 'Ticket mesajının gönderileceği kanal',
                        required: true,
                        channel_types: [0] // GUILD_TEXT
                    },
                    {
                        type: 7, // CHANNEL
                        name: 'kategori',
                        description: 'Ticket kanallarının oluşturulacağı kategori',
                        required: true,
                        channel_types: [4] // GUILD_CATEGORY
                    },
                    {
                        type: 8, // ROLE
                        name: 'destek-rolü',
                        description: 'Ticket\'lere erişebilecek destek rolü',
                        required: true
                    }
                ]
            },
            {
                type: 1, // SUB_COMMAND
                name: 'close',
                description: '🔒 Ticket\'i kapat'
            },
            {
                type: 1, // SUB_COMMAND
                name: 'add',
                description: '➕ Ticket\'e kullanıcı ekle',
                options: [
                    {
                        type: 6, // USER
                        name: 'kullanıcı',
                        description: 'Eklenecek kullanıcı',
                        required: true
                    }
                ]
            },
            {
                type: 1, // SUB_COMMAND
                name: 'remove',
                description: '➖ Ticket\'ten kullanıcı çıkar',
                options: [
                    {
                        type: 6, // USER
                        name: 'kullanıcı',
                        description: 'Çıkarılacak kullanıcı',
                        required: true
                    }
                ]
            },
            {
                type: 1, // SUB_COMMAND
                name: 'claim',
                description: '👤 Ticket\'i üstlen'
            },
            {
                type: 1, // SUB_COMMAND
                name: 'unclaim',
                description: '👥 Ticket\'ten vazgeç'
            },
            {
                type: 1, // SUB_COMMAND
                name: 'transcript',
                description: '📄 Ticket transcript\'i oluştur'
            },
            {
                type: 1, // SUB_COMMAND
                name: 'stats',
                description: '📊 Ticket istatistikleri'
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerTicketCommand() {
    try {
        console.log('🎫 Ticket komutu kaydediliyor...');

        // Global komut olarak kaydet
        const data = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ Ticket komutu başarıyla kaydedildi!`);
        console.log(`📊 Toplam ${data.length} komut kaydedildi`);

    } catch (error) {
        console.error('❌ Ticket komutu kaydedilemedi:', error);
    }
}

registerTicketCommand();
