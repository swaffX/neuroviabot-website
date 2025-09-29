const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const { Player } = require('discord-player');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { logger } = require('./utils/logger');
const { initializeModels, getOrCreateUser, getOrCreateGuild, getOrCreateGuildMember } = require('./models');
const TicketHandler = require('./handlers/ticketHandler');
const GiveawayHandler = require('./handlers/giveawayHandler');
const WelcomeHandler = require('./handlers/welcomeHandler');
const LevelingHandler = require('./handlers/levelingHandler');
const GuardHandler = require('./handlers/guardHandler');
const CustomCommandHandler = require('./handlers/customCommandHandler');
const RoleReactionHandler = require('./handlers/roleReactionHandler');
const VerificationHandler = require('./handlers/verificationHandler');
const BackupHandler = require('./handlers/backupHandler');
const { startServer, setClient, setupSocketIO, broadcastToGuild, broadcastGlobally } = require('./web/backend/server');
const { realtimeUpdates } = require('./utils/realtime');

// Client oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// Player oluştur
const player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
});

// Collections tanımla
client.commands = new Collection();
client.player = player;

// Command handler
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] ${filePath} komutunda "data" veya "execute" property'si eksik.`);
    }
}

// Event handler
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Player event handlers
player.events.on('audioTrackAdd', (queue, track) => {
    logger.musicEvent('Track Added', { track: track.title, author: track.author, guild: queue.guild.name });
    
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎵 Şarkı Eklendi')
        .setDescription(`**${track.title}** kuyruğa eklendi!`)
        .setThumbnail(track.thumbnail)
        .addFields(
            { name: '🎤 Sanatçı', value: track.author, inline: true },
            { name: '⏱️ Süre', value: track.duration, inline: true },
            { name: '👤 Ekleyen', value: track.requestedBy.username, inline: true }
        )
        .setTimestamp();
    
    queue.metadata.send({ embeds: [embed] });
});

player.events.on('audioTracksAdd', (queue, tracks) => {
    logger.musicEvent('Multiple Tracks Added', { count: tracks.length, guild: queue.guild.name });
    
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎵 Çoklu Şarkı Eklendi')
        .setDescription(`**${tracks.length}** şarkı kuyruğa eklendi!`)
        .setTimestamp();
    
    queue.metadata.send({ embeds: [embed] });
});

player.events.on('playerStart', (queue, track) => {
    logger.musicEvent('Track Started', { track: track.title, author: track.author, guild: queue.guild.name });
    
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎵 Şimdi Çalıyor')
        .setDescription(`**${track.title}** çalınıyor!`)
        .setThumbnail(track.thumbnail)
        .addFields(
            { name: '🎤 Sanatçı', value: track.author, inline: true },
            { name: '⏱️ Süre', value: track.duration, inline: true },
            { name: '👤 İsteyen', value: track.requestedBy.username, inline: true }
        )
        .setTimestamp();
    
    queue.metadata.send({ embeds: [embed] });
});

player.events.on('emptyQueue', (queue) => {
    logger.musicEvent('Queue Empty', { guild: queue.guild.name });
    
    const embed = new EmbedBuilder()
        .setColor('#ffa500')
        .setTitle('📭 Kuyruk Boş')
        .setDescription('Kuyrukta daha fazla şarkı yok!')
        .setTimestamp();
    
    queue.metadata.send({ embeds: [embed] });
});

player.events.on('emptyChannel', (queue) => {
    logger.musicEvent('Channel Empty', { guild: queue.guild.name });
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('👋 Kanal Boş')
        .setDescription('Sesli kanalda kimse kalmadığı için ayrılıyorum!')
        .setTimestamp();
    
    queue.metadata.send({ embeds: [embed] });
});

player.events.on('error', (queue, error) => {
    logger.playerError(error, { guild: queue.guild?.name });
});

player.events.on('playerError', (queue, error) => {
    logger.playerError(error, { guild: queue.guild?.name, track: queue.currentTrack?.title });
});

// Slash commands'ları deploy et
async function deployCommands() {
    try {
        console.log('Slash commands deploy ediliyor...');
        
        const rest = new REST().setToken(config.token);
        
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );
        
        console.log('✅ Slash commands başarıyla deploy edildi!');
    } catch (error) {
        console.error('❌ Slash commands deploy edilirken hata:', error);
    }
}

// Bot hazır olduğunda
client.once('ready', async () => {
    try {
        logger.botStartup(client);
        
        // Database'i başlat
        const dbInitialized = await initializeModels();
        if (!dbInitialized) {
            logger.error('Database başlatılamadı, ancak bot çalışmaya devam ediyor (limitli modda)');
            // Bot'u crash ettirme, sadece database özelliklerini devre dışı bırak
            global.databaseDisabled = true;
            return;
        }
    
    // Slash commands'ları deploy et
    await deployCommands();
    
    // Sunucuları ve kullanıcıları database'e kaydet
    await syncGuildsAndUsers();
    
    // Handler'ları başlat
    new TicketHandler(client);
    logger.success('Ticket sistemi başlatıldı!');
    
    new GiveawayHandler(client);
    logger.success('Çekiliş sistemi başlatıldı!');
    
    new WelcomeHandler(client);
    logger.success('Welcome/Leave sistemi başlatıldı!');
    
    const levelingHandler = new LevelingHandler(client);
    global.levelingHandler = levelingHandler; // Global erişim için
    logger.success('Leveling sistemi başlatıldı!');
    
    const guardHandler = new GuardHandler(client);
    global.guardHandler = guardHandler; // Global erişim için
    logger.success('Guard sistemi başlatıldı!');
    
    const customCommandHandler = new CustomCommandHandler(client);
    global.customCommandHandler = customCommandHandler; // Global erişim için
    logger.success('Custom Command sistemi başlatıldı!');
    
    const roleReactionHandler = new RoleReactionHandler(client);
    roleReactionHandler.loadFromFile();
    roleReactionHandler.startAutoSave();
    global.roleReactionHandler = roleReactionHandler; // Global erişim için
    logger.success('Role Reaction sistemi başlatıldı!');
    
    const verificationHandler = new VerificationHandler(client);
    global.verificationHandler = verificationHandler; // Global erişim için
    logger.success('Verification sistemi başlatıldı!');
    
    const backupHandler = new BackupHandler(client);
    global.backupHandler = backupHandler; // Global erişim için
    logger.success('Backup sistemi başlatıldı!');
    
    // Web Panel Backend'ini başlat
    setClient(client);
    try {
        const server = await startServer();
        setupSocketIO(server);
        global.broadcastToGuild = broadcastToGuild;
        global.broadcastGlobally = broadcastGlobally;
        
        // Real-time update sistemini initialize et
        realtimeUpdates.setBroadcastFunctions(broadcastToGuild, broadcastGlobally);
        global.realtimeUpdates = realtimeUpdates;
        
        // Heartbeat başlat (her 30 saniyede bir)
        setInterval(() => {
            realtimeUpdates.heartbeat();
        }, 30000);
        
        logger.success('Web Panel Backend, Socket.IO ve Real-time Updates başlatıldı!');
    } catch (error) {
        logger.error('Web Panel Backend başlatılamadı', error);
    }
    
        // Status ayarla
        updateBotStatus();
        
        logger.success('Bot tamamen hazır ve çalışıyor!');
    } catch (error) {
        logger.error('🚨 Bot başlatma sırasında kritik hata', error);
        console.error('⚠️  Bot başlatma hatası, ancak bot çalışmaya devam ediyor...');
        
        // En azından temel ayarları yap
        try {
            updateBotStatus();
            logger.success('Bot temel modda başlatıldı!');
        } catch (statusError) {
            logger.error('Status ayarlama hatası', statusError);
        }
    }
});

// Sunucuları ve kullanıcıları senkronize et
async function syncGuildsAndUsers() {
    try {
        logger.info('Sunucular ve kullanıcılar senkronize ediliyor...');
        
        for (const guild of client.guilds.cache.values()) {
            // Guild'i database'e ekle/güncelle
            await getOrCreateGuild(guild.id, {
                name: guild.name
            });
            
            logger.debug(`${guild.name} sunucusu senkronize edildi`);
        }
        
        logger.success(`${client.guilds.cache.size} sunucu senkronize edildi!`);
    } catch (error) {
        logger.error('Sunucu senkronizasyon hatası', error);
    }
}

// Bot status güncelle
function updateBotStatus() {
    const activities = [
        'OĞUZ\'UN BABANNESİYLE',
        '🎵 Müzik çalıyor | /help',
        '🎧 Kaliteli ses deneyimi',
        '🎤 Spotify desteği aktif',
        '📻 Playlist oluştur',
        '🎫 Ticket sistemi aktif',
        '💰 Ekonomi sistemi',
        '🎉 Çekiliş yap',
        '🛡️ Moderasyon araçları'
    ];
    
    const activityTypes = [
        'PLAYING',
        'LISTENING',
        'LISTENING',
        'LISTENING',
        'LISTENING',
        'WATCHING',
        'WATCHING',
        'WATCHING',
        'WATCHING'
    ];
    
    let currentActivity = 0;
    
    // İlk activity'i ayarla
    client.user.setActivity(activities[currentActivity], { type: activityTypes[currentActivity] });
    
    // Her 30 saniyede bir activity değiştir
    setInterval(() => {
        currentActivity = (currentActivity + 1) % activities.length;
        client.user.setActivity(activities[currentActivity], { type: activityTypes[currentActivity] });
    }, 30000);
}

// Interaction verilerini database'e kaydet
async function saveInteractionData(interaction) {
    try {
        if (!interaction.user || !interaction.guild) return;
        if (global.databaseDisabled) return; // Database devre dışıysa skip et

        // Kullanıcıyı kaydet/güncelle
        await getOrCreateUser(interaction.user.id, {
            username: interaction.user.username,
            discriminator: interaction.user.discriminator,
            globalName: interaction.user.globalName,
            avatar: interaction.user.avatar
        });

        // Guild'i kaydet/güncelle
        await getOrCreateGuild(interaction.guild.id, {
            name: interaction.guild.name
        });

        // Guild member'ı kaydet/güncelle
        const member = interaction.member;
        if (member) {
            await getOrCreateGuildMember(interaction.user.id, interaction.guild.id, {
                nickname: member.nickname,
                joinedAt: member.joinedAt,
                lastCommand: new Date()
            });
        }
    } catch (error) {
        logger.error('Interaction data kaydetme hatası', error);
    }
}

// Guild join event
client.on('guildCreate', async (guild) => {
    try {
        await getOrCreateGuild(guild.id, {
            name: guild.name
        });
        
        logger.info(`Yeni sunucuya katıldı: ${guild.name} (${guild.id})`);
    } catch (error) {
        logger.error('Guild create event hatası', error);
    }
});

// Guild member join event
client.on('guildMemberAdd', async (member) => {
    try {
        // Kullanıcıyı kaydet
        await getOrCreateUser(member.user.id, {
            username: member.user.username,
            discriminator: member.user.discriminator,
            globalName: member.user.globalName,
            avatar: member.user.avatar
        });

        // Guild member'ı kaydet
        await getOrCreateGuildMember(member.user.id, member.guild.id, {
            nickname: member.nickname,
            joinedAt: member.joinedAt
        });

        logger.debug(`Yeni üye katıldı: ${member.user.tag} -> ${member.guild.name}`);
    } catch (error) {
        logger.error('Guild member add event hatası', error);
    }
});

// Interaction handler
client.on('interactionCreate', async interaction => {
    // Autocomplete handling
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command || !command.autocomplete) return;
        
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            logger.error('Autocomplete hatası', error, { command: interaction.commandName });
        }
        return;
    }

    // Slash command handling
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        logger.error(`Komut bulunamadı: ${interaction.commandName}`);
        return;
    }

    try {
        // Kullanıcı ve guild verilerini database'e kaydet (database aktifse)
        if (!global.databaseDisabled) {
            await saveInteractionData(interaction);
        }
        
        await command.execute(interaction);
        logger.commandUsage(interaction.commandName, interaction.user, interaction.guild, true);
    } catch (error) {
        logger.error(`Komut hatası: ${interaction.commandName}`, error, {
            user: interaction.user.id,
            guild: interaction.guild?.id,
            channel: interaction.channel?.id
        });
        
        // Sadece interaction henüz cevaplanmadıysa hata mesajı gönder
        if (!interaction.replied && !interaction.deferred) {
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Bu komutu çalıştırırken bir hata oluştu!')
                    .setTimestamp();

                await interaction.reply({ 
                    embeds: [errorEmbed], 
                    flags: 64 // MessageFlags.Ephemeral
                });
            } catch (replyError) {
                console.error('Error replying to failed interaction:', replyError);
            }
        }
    }
});

// Comprehensive Error Handling - Bot crash'ini önler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('🚨 Yakalanmamış Promise Reddi', reason, {
        promise: promise.toString(),
        stack: reason?.stack,
        timestamp: new Date().toISOString()
    });
    
    // Bot'u crash ettirme, sadece logla
    console.error('⚠️  Unhandled Promise Rejection - Bot devam ediyor...');
});

process.on('uncaughtException', (error) => {
    logger.error('🚨 Yakalanmamış İstisna', error, {
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    
    console.error('⚠️  Uncaught Exception - Bot yeniden başlatılıyor...');
    
    // Graceful restart yerine immediate restart
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
    logger.error('🔍 İstisna İzleyici', error, {
        origin,
        timestamp: new Date().toISOString()
    });
});

process.on('warning', (warning) => {
    logger.warn('⚠️  Node.js Warning', warning, {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
    });
});

// Discord client error handling
client.on('error', (error) => {
    logger.error('🤖 Discord Client Hatası', error, {
        timestamp: new Date().toISOString()
    });
});

client.on('warn', (warning) => {
    logger.warn('🤖 Discord Client Uyarısı', { warning });
});

client.on('debug', (info) => {
    // Sadece önemli debug bilgilerini logla
    if (info.includes('Heartbeat') || info.includes('Session') || info.includes('Ready')) {
        logger.debug('🤖 Discord Debug', { info });
    }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT alındı - Bot kapatılıyor...');
    await gracefulShutdown();
});

process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM alındı - Bot kapatılıyor...');
    await gracefulShutdown();
});

async function gracefulShutdown() {
    try {
        logger.info('🔄 Graceful shutdown başlatıldı...');
        
        // Discord client'ı temizle
        if (client) {
            client.destroy();
            logger.info('✅ Discord client kapatıldı');
        }
        
        // Database bağlantısını kapat
        if (require('./models').sequelize) {
            await require('./models').sequelize.close();
            logger.info('✅ Database bağlantısı kapatıldı');
        }
        
        logger.info('✅ Graceful shutdown tamamlandı');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Graceful shutdown hatası', error);
        process.exit(1);
    }
}

// Bot'u başlat
if (config.token === 'BOT_TOKEN_BURAYA_GELECEK') {
    console.log('❌ Lütfen config.json dosyasında bot token\'ınızı ayarlayın!');
    process.exit(1);
} else {
    client.login(config.token);
}
