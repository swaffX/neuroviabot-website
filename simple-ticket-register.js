const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerTicketCommand() {
    try {
        console.log('🎫 Basit ticket komutu kaydediliyor...');

        // Sadece temel ticket komutu
        const commands = [
            {
                name: 'ticket',
                description: '🎫 Ticket sistemi',
                options: [
                    {
                        type: 1, // SUB_COMMAND
                        name: 'setup',
                        description: 'Ticket sistemini kur',
                        options: [
                            {
                                type: 7, // CHANNEL
                                name: 'kanal',
                                description: 'Ticket mesaj kanalı',
                                required: true
                            },
                            {
                                type: 7, // CHANNEL
                                name: 'kategori',
                                description: 'Ticket kategori',
                                required: true
                            },
                            {
                                type: 8, // ROLE
                                name: 'rol',
                                description: 'Destek rolü',
                                required: true
                            }
                        ]
                    }
                ]
            }
        ];

        // Global komut olarak kaydet
        const data = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ Ticket komutu kaydedildi!`);
        console.log(`📊 ${data.length} komut aktif`);

    } catch (error) {
        console.error('❌ Hata:', error.message);
        if (error.code === 50001) {
            console.log('💡 Bot yetkisi eksik olabilir');
        } else if (error.code === 429) {
            console.log('⏰ Rate limit - birkaç dakika bekleyin');
        }
    }
}

registerTicketCommand();
