const { REST, Routes } = require('discord.js');
const rateLimitQueue = require('./rateLimitQueue');
const { logger } = require('./logger');

class CommandQueueManager {
    constructor(client) {
        this.client = client;
        this.rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        this.registeredCommands = new Map();
        this.guildQueues = new Map();
        this.isProcessing = false;
        
        // Her sunucu için ayrı kuyruk
        this.initializeGuildQueues();
    }

    // Sunucu kuyruklarını başlat
    initializeGuildQueues() {
        this.client.guilds.cache.forEach(guild => {
            this.guildQueues.set(guild.id, {
                queue: [],
                isProcessing: false,
                lastRequest: 0
            });
        });
    }

    // Komutları kuyruğa ekle
    async queueCommandRegistration(guildId, commands) {
        const guildQueue = this.guildQueues.get(guildId);
        if (!guildQueue) {
            logger.error(`Guild queue not found for ${guildId}`);
            return;
        }

        return new Promise((resolve, reject) => {
            guildQueue.queue.push({
                commands,
                resolve,
                reject,
                timestamp: Date.now()
            });

            this.processGuildQueue(guildId);
        });
    }

    // Sunucu kuyruğunu işle
    async processGuildQueue(guildId) {
        const guildQueue = this.guildQueues.get(guildId);
        if (!guildQueue || guildQueue.isProcessing || guildQueue.queue.length === 0) {
            return;
        }

        guildQueue.isProcessing = true;

        try {
            while (guildQueue.queue.length > 0) {
                const request = guildQueue.queue.shift();
                
                try {
                    // Rate limit kontrolü
                    const timeSinceLastRequest = Date.now() - guildQueue.lastRequest;
                    if (timeSinceLastRequest < 100) { // 100ms bekleme
                        await this.sleep(100 - timeSinceLastRequest);
                    }

                    // Komutları kaydet
                    const result = await this.registerCommandsForGuild(guildId, request.commands);
                    request.resolve(result);
                    
                    guildQueue.lastRequest = Date.now();
                    
                } catch (error) {
                    request.reject(error);
                }
            }
        } finally {
            guildQueue.isProcessing = false;
        }
    }

    // Belirli sunucu için komutları kaydet
    async registerCommandsForGuild(guildId, commands) {
        try {
            const data = await this.rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                { body: commands }
            );

            logger.info(`✅ ${commands.length} komut ${guildId} sunucusuna kaydedildi`);
            return data;
        } catch (error) {
            logger.error(`❌ ${guildId} sunucusuna komut kaydetme hatası:`, error);
            throw error;
        }
    }

    // Global komutları kaydet
    async registerGlobalCommands(commands) {
        return new Promise((resolve, reject) => {
            rateLimitQueue.addRequest({
                method: 'PUT',
                url: `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/commands`,
                data: commands,
                headers: {}
            }).then(resolve).catch(reject);
        });
    }

    // Tüm sunuculara komutları dağıt
    async distributeCommandsToAllGuilds(commands) {
        const guilds = Array.from(this.client.guilds.cache.keys());
        const promises = [];

        // Her sunucu için komut kaydını kuyruğa ekle
        for (const guildId of guilds) {
            promises.push(
                this.queueCommandRegistration(guildId, commands)
            );
        }

        // Tüm sunucuların komut kaydını bekle
        try {
            await Promise.allSettled(promises);
            logger.info(`✅ Tüm sunuculara komut dağıtımı tamamlandı`);
        } catch (error) {
            logger.error(`❌ Komut dağıtım hatası:`, error);
        }
    }

    // Komut kullanımını kuyruğa ekle
    async queueCommandUsage(guildId, commandName, userId) {
        const guildQueue = this.guildQueues.get(guildId);
        if (!guildQueue) {
            return;
        }

        // Komut kullanım istatistiği
        const usage = {
            command: commandName,
            user: userId,
            timestamp: Date.now(),
            guild: guildId
        };

        // İstatistikleri kaydet (isteğe bağlı)
        this.logCommandUsage(usage);
    }

    // Komut kullanım istatistiği
    logCommandUsage(usage) {
        logger.info(`🎮 Komut kullanıldı: ${usage.command} - ${usage.user} (${usage.guild})`);
    }

    // Kuyruk durumunu al
    getQueueStatus() {
        const status = {
            global: rateLimitQueue.getQueueStatus(),
            guilds: {}
        };

        this.guildQueues.forEach((queue, guildId) => {
            status.guilds[guildId] = {
                queueLength: queue.queue.length,
                isProcessing: queue.isProcessing,
                lastRequest: queue.lastRequest
            };
        });

        return status;
    }

    // Bekleme fonksiyonu
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Yeni sunucu eklendiğinde kuyruk oluştur
    onGuildCreate(guild) {
        this.guildQueues.set(guild.id, {
            queue: [],
            isProcessing: false,
            lastRequest: 0
        });
    }

    // Sunucu silindiğinde kuyruğu temizle
    onGuildDelete(guild) {
        this.guildQueues.delete(guild.id);
    }
}

module.exports = CommandQueueManager;
