const { logger } = require('./logger');

class WebCommandHandler {
    constructor(client) {
        this.client = client;
        this.commandHistory = new Map();
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        // HTTP API üzerinden komut çalıştırma desteği
        logger.info('🌐 WebCommandHandler başlatıldı - HTTP API modunda');
    }

    // Handler'ı yeniden başlat
    restart() {
        // WebCommandHandler için özel restart gerekmez
        // HTTP API zaten aktif
    }

    async executeWebCommand(command, guildId, userId, subcommand, params) {
        logger.info(`🌐 Web komutu alındı: ${command} ${subcommand} - Guild: ${guildId}, User: ${userId}, Params: ${JSON.stringify(params)}`);
        
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
            throw new Error('Sunucu bulunamadı');
        }

        const user = this.client.users.cache.get(userId);
        if (!user) {
            throw new Error('Kullanıcı bulunamadı');
        }

        // Mock interaction objesi oluştur
        const mockInteraction = {
            guild,
            user,
            member: guild.members.cache.get(userId),
            commandName: command,
            options: {
                getSubcommand: () => subcommand,
                getString: (name) => params[name],
                getInteger: (name) => parseInt(params[name]),
                getBoolean: (name) => params[name] === 'true',
                getChannel: (name) => guild.channels.cache.get(params[name]),
                getRole: (name) => guild.roles.cache.get(params[name]),
                getUser: (name) => guild.members.cache.get(params[name])?.user
            },
            reply: async (options) => {
                logger.info(`📝 Komut yanıtı: ${options.content || 'Komut çalıştırıldı'}`);
                return { content: options.content || 'Komut çalıştırıldı' };
            },
            editReply: async (options) => {
                logger.info(`📝 Komut güncellendi: ${options.content || 'Komut güncellendi'}`);
                return { content: options.content || 'Komut güncellendi' };
            },
            deferReply: async (options) => {
                logger.info(`📝 Komut işleniyor...`);
                return { content: 'Komut işleniyor...' };
            },
            followUp: async (options) => {
                logger.info(`📝 Takip mesajı: ${options.content || 'Takip mesajı'}`);
                return { content: options.content || 'Takip mesajı' };
            }
        };

        // Komut dosyasını bul ve çalıştır
        const commandFile = this.client.commands.get(command);
        if (!commandFile) {
            throw new Error(`Komut bulunamadı: ${command}`);
        }

        // Komut geçmişine ekle
        this.addToHistory({
            command,
            subcommand,
            guildId,
            userId,
            user: user.username,
            timestamp: Date.now(),
            success: true
        });

        // Komutu çalıştır
        await commandFile.execute(mockInteraction, this.client);
        
        return `${command}${subcommand ? ` ${subcommand}` : ''} komutu başarıyla çalıştırıldı`;
    }

    addToHistory(data) {
        const guildId = data.guildId;
        if (!this.commandHistory.has(guildId)) {
            this.commandHistory.set(guildId, []);
        }
        
        const history = this.commandHistory.get(guildId);
        history.unshift({
            id: Date.now(),
            ...data
        });
        
        // Son 100 komutu tut
        if (history.length > 100) {
            history.splice(100);
        }
    }

    getHistory(guildId, limit = 50) {
        const history = this.commandHistory.get(guildId) || [];
        return history.slice(0, limit);
    }

    // Özellik durumunu kontrol et
    isFeatureEnabled(feature) {
        return configSync.isFeatureEnabled(feature);
    }

    // Bot durumunu al
    getBotStatus() {
        return {
            online: this.client.readyAt ? true : false,
            uptime: this.client.uptime,
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            commands: this.client.commands.size,
            features: {
                economy: this.isFeatureEnabled('economy'),
                moderation: this.isFeatureEnabled('moderation'),
                leveling: this.isFeatureEnabled('leveling'),
                tickets: this.isFeatureEnabled('tickets'),
                giveaways: this.isFeatureEnabled('giveaways')
            }
        };
    }
}

module.exports = WebCommandHandler;
