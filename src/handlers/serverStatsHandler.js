// ==========================================
// 🤖 NeuroViaBot - Server Stats Handler
// ==========================================
// Sunucu istatistiklerini voice channel'larda real-time gösterir

const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');

class ServerStatsHandler {
    constructor(client) {
        this.client = client;
        this.db = getDatabase();
        this.updateInterval = 5 * 60 * 1000; // 5 dakika
        this.intervals = new Map();
        this.updateTimeouts = new Map(); // Debounce için
        this.rateLimitCache = new Map(); // Rate limit koruması için
        
        logger.info('🔢 Server Stats Handler başlatıldı');
        
        // Bot hazır olduğunda ayarları yükle ve başlat
        if (client.isReady()) {
            this.initializeAllGuilds();
        } else {
            client.once('ready', () => this.initializeAllGuilds());
        }
    }

    async initializeAllGuilds() {
        try {
            for (const [guildId, guild] of this.client.guilds.cache) {
                const settings = this.getGuildStatsSettings(guildId);
                if (settings && settings.enabled) {
                    await this.setupStatsChannels(guild);
                    this.startAutoUpdate(guildId);
                }
            }
            logger.success('✅ Tüm guild\'ler için server stats başlatıldı');
        } catch (error) {
            logger.error('Server stats başlatma hatası:', error);
        }
    }

    getGuildStatsSettings(guildId) {
        if (!this.db.data.serverStatsSettings) {
            this.db.data.serverStatsSettings = new Map();
        }
        
        return this.db.data.serverStatsSettings.get(guildId) || {
            enabled: false,
            categoryId: null,
            channelIds: {
                members: null,
                bots: null,
                total: null
            },
            channelNames: {
                members: '👥 Members: {count}',
                bots: '🤖 Bots: {count}',
                total: '📊 Total Members: {count}'
            },
            autoUpdate: true,
            updateInterval: 5 // dakika
        };
    }

    saveGuildStatsSettings(guildId, settings) {
        if (!this.db.data.serverStatsSettings) {
            this.db.data.serverStatsSettings = new Map();
        }
        
        this.db.data.serverStatsSettings.set(guildId, settings);
        this.db.saveData();
        
        logger.info(`💾 Server stats ayarları kaydedildi: ${guildId}`);
        return settings;
    }

    async setupStatsChannels(guild) {
        try {
            const settings = this.getGuildStatsSettings(guild.id);
            
            // Kategori var mı kontrol et
            let category = null;
            if (settings.categoryId) {
                category = guild.channels.cache.get(settings.categoryId);
            }

            // Kategori yoksa oluştur
            if (!category) {
                category = await guild.channels.create({
                    name: '📊 Server Stats',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages],
                            allow: [PermissionFlagsBits.ViewChannel]
                        }
                    ]
                });

                settings.categoryId = category.id;
                logger.success(`✅ Kategori oluşturuldu: ${guild.name}`);
            }

            // Stats kanallarını oluştur
            const stats = await this.calculateStats(guild);
            
            // Members kanalı
            if (!settings.channelIds.members || !guild.channels.cache.get(settings.channelIds.members)) {
                const membersChannel = await guild.channels.create({
                    name: settings.channelNames.members.replace('{count}', stats.members),
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.Connect],
                            allow: [PermissionFlagsBits.ViewChannel]
                        }
                    ]
                });
                settings.channelIds.members = membersChannel.id;
                logger.success(`✅ Members kanalı oluşturuldu: ${guild.name}`);
            }

            // Bots kanalı
            if (!settings.channelIds.bots || !guild.channels.cache.get(settings.channelIds.bots)) {
                const botsChannel = await guild.channels.create({
                    name: settings.channelNames.bots.replace('{count}', stats.bots),
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.Connect],
                            allow: [PermissionFlagsBits.ViewChannel]
                        }
                    ]
                });
                settings.channelIds.bots = botsChannel.id;
                logger.success(`✅ Bots kanalı oluşturuldu: ${guild.name}`);
            }

            // Total members kanalı
            if (!settings.channelIds.total || !guild.channels.cache.get(settings.channelIds.total)) {
                const totalChannel = await guild.channels.create({
                    name: settings.channelNames.total.replace('{count}', stats.total),
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.Connect],
                            allow: [PermissionFlagsBits.ViewChannel]
                        }
                    ]
                });
                settings.channelIds.total = totalChannel.id;
                logger.success(`✅ Total members kanalı oluşturuldu: ${guild.name}`);
            }

            this.saveGuildStatsSettings(guild.id, settings);
            
            // İlk güncelleme
            await this.updateStatsChannels(guild);
            
            return { success: true, settings };

        } catch (error) {
            logger.error(`Stats kanalları oluşturma hatası (${guild.name}):`, error);
            return { success: false, error: error.message };
        }
    }

    async calculateStats(guild) {
        try {
            // Guild'i cache'den tam al
            const fullGuild = await guild.fetch();
            
            // Tüm üyeleri al
            const members = await fullGuild.members.fetch();
            
            const stats = {
                members: members.filter(m => !m.user.bot).size,
                bots: members.filter(m => m.user.bot).size,
                total: members.size
            };

            return stats;
        } catch (error) {
            logger.error(`Stats hesaplama hatası (${guild.name}):`, error);
            // Fallback: cache'den
            return {
                members: guild.members.cache.filter(m => !m.user.bot).size,
                bots: guild.members.cache.filter(m => m.user.bot).size,
                total: guild.memberCount || guild.members.cache.size
            };
        }
    }

    async updateStatsChannels(guild) {
        try {
            const settings = this.getGuildStatsSettings(guild.id);
            
            if (!settings.enabled) {
                return;
            }

            // Rate limit koruması: Son güncelleme 10 saniye içindeyse atla
            const lastUpdate = this.rateLimitCache.get(guild.id);
            const now = Date.now();
            if (lastUpdate && (now - lastUpdate) < 10000) {
                logger.debug(`⏭️ Rate limit: ${guild.name} için güncelleme atlandı`);
                return;
            }

            const stats = await this.calculateStats(guild);
            
            // Members kanalını güncelle
            if (settings.channelIds.members) {
                const membersChannel = guild.channels.cache.get(settings.channelIds.members);
                if (membersChannel) {
                    const newName = settings.channelNames.members.replace('{count}', stats.members);
                    if (membersChannel.name !== newName) {
                        await membersChannel.setName(newName);
                        logger.debug(`📊 Members kanalı güncellendi: ${guild.name} - ${stats.members}`);
                        // Her kanal güncellemesi arasında kısa bir bekleme
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            // Bots kanalını güncelle
            if (settings.channelIds.bots) {
                const botsChannel = guild.channels.cache.get(settings.channelIds.bots);
                if (botsChannel) {
                    const newName = settings.channelNames.bots.replace('{count}', stats.bots);
                    if (botsChannel.name !== newName) {
                        await botsChannel.setName(newName);
                        logger.debug(`🤖 Bots kanalı güncellendi: ${guild.name} - ${stats.bots}`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            // Total members kanalını güncelle
            if (settings.channelIds.total) {
                const totalChannel = guild.channels.cache.get(settings.channelIds.total);
                if (totalChannel) {
                    const newName = settings.channelNames.total.replace('{count}', stats.total);
                    if (totalChannel.name !== newName) {
                        await totalChannel.setName(newName);
                        logger.debug(`📊 Total members kanalı güncellendi: ${guild.name} - ${stats.total}`);
                    }
                }
            }
            
            // Rate limit cache'i güncelle
            this.rateLimitCache.set(guild.id, now);

            // Socket.IO ile frontend'e bildir
            if (this.client.socket) {
                this.client.socket.emit('broadcast_to_guild', {
                    guildId: guild.id,
                    event: 'server_stats_updated',
                    data: {
                        stats,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            return { success: true, stats };

        } catch (error) {
            // Rate limit hatası yakalama
            if (error.code === 50013) {
                logger.warn(`⚠️ Stats güncelleme yetki hatası (${guild.name}): Botun kanalları düzenleme yetkisi yok`);
            } else if (error.code === 429) {
                logger.warn(`⚠️ Rate limit hatası (${guild.name}): ${error.retry_after}ms sonra tekrar denenecek`);
            } else {
                logger.error(`Stats güncelleme hatası (${guild.name}):`, error);
            }
            return { success: false, error: error.message };
        }
    }

    async removeStatsChannels(guild) {
        try {
            const settings = this.getGuildStatsSettings(guild.id);
            
            logger.info(`🗑️ Server stats silme başlatıldı: ${guild.name}`);
            
            // Önce kanalları sil
            const channelTypes = ['members', 'bots', 'total'];
            for (const channelType of channelTypes) {
                const channelId = settings.channelIds[channelType];
                if (channelId) {
                    try {
                        const channel = guild.channels.cache.get(channelId);
                        if (channel) {
                            await channel.delete('Server stats devre dışı bırakıldı');
                            logger.success(`✅ ${channelType} kanalı silindi: ${guild.name}`);
                        } else {
                            logger.warn(`⚠️ ${channelType} kanalı bulunamadı (${channelId})`);
                        }
                    } catch (channelError) {
                        logger.error(`❌ ${channelType} kanalı silinirken hata:`, channelError.message);
                    }
                }
            }

            // Kısa bir bekleme (Discord API için)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Kategoriyi sil
            if (settings.categoryId) {
                try {
                    const category = guild.channels.cache.get(settings.categoryId);
                    if (category) {
                        await category.delete('Server stats devre dışı bırakıldı');
                        logger.success(`✅ Kategori silindi: ${guild.name}`);
                    } else {
                        logger.warn(`⚠️ Kategori bulunamadı (${settings.categoryId})`);
                    }
                } catch (categoryError) {
                    logger.error(`❌ Kategori silinirken hata:`, categoryError.message);
                }
            }

            // Ayarları temizle
            settings.enabled = false;
            settings.categoryId = null;
            settings.channelIds = { members: null, bots: null, total: null };
            this.saveGuildStatsSettings(guild.id, settings);

            // Auto update'i durdur
            this.stopAutoUpdate(guild.id);

            logger.success(`✅ Server stats tamamen silindi: ${guild.name}`);
            
            // Socket.IO ile frontend'e bildir
            if (this.client.socket) {
                this.client.socket.emit('broadcast_to_guild', {
                    guildId: guild.id,
                    event: 'server_stats_deleted',
                    data: {
                        timestamp: new Date().toISOString()
                    }
                });
            }

            return { success: true, message: 'Server stats kanalları başarıyla silindi' };

        } catch (error) {
            logger.error(`❌ Stats kanalları silme hatası (${guild.name}):`, error);
            return { success: false, error: error.message };
        }
    }

    startAutoUpdate(guildId) {
        // Mevcut interval varsa temizle
        this.stopAutoUpdate(guildId);

        const settings = this.getGuildStatsSettings(guildId);
        if (!settings.autoUpdate) {
            return;
        }

        const updateInterval = (settings.updateInterval || 5) * 60 * 1000;

        const interval = setInterval(async () => {
            const guild = this.client.guilds.cache.get(guildId);
            if (guild) {
                await this.updateStatsChannels(guild);
            } else {
                this.stopAutoUpdate(guildId);
            }
        }, updateInterval);

        this.intervals.set(guildId, interval);
        logger.info(`⏰ Auto update başlatıldı: ${guildId} (${settings.updateInterval} dakika)`);
    }

    stopAutoUpdate(guildId) {
        const interval = this.intervals.get(guildId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(guildId);
            logger.info(`⏹️ Auto update durduruldu: ${guildId}`);
        }
    }

    async toggleStats(guildId, enabled) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                return { success: false, error: 'Guild bulunamadı' };
            }

            const settings = this.getGuildStatsSettings(guildId);
            
            if (enabled) {
                // Etkinleştir
                settings.enabled = true;
                this.saveGuildStatsSettings(guildId, settings);
                
                await this.setupStatsChannels(guild);
                this.startAutoUpdate(guildId);
                
                return { success: true, message: 'Server stats etkinleştirildi' };
            } else {
                // Devre dışı bırak
                await this.removeStatsChannels(guild);
                return { success: true, message: 'Server stats devre dışı bırakıldı' };
            }
        } catch (error) {
            logger.error(`Toggle stats hatası (${guildId}):`, error);
            return { success: false, error: error.message };
        }
    }

    async updateChannelNames(guildId, channelNames) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                return { success: false, error: 'Guild bulunamadı' };
            }

            const settings = this.getGuildStatsSettings(guildId);
            settings.channelNames = { ...settings.channelNames, ...channelNames };
            this.saveGuildStatsSettings(guildId, settings);

            // Kanalları hemen güncelle
            await this.updateStatsChannels(guild);

            return { success: true, message: 'Kanal isimleri güncellendi' };
        } catch (error) {
            logger.error(`Kanal ismi güncelleme hatası (${guildId}):`, error);
            return { success: false, error: error.message };
        }
    }

    // Event handlers
    async handleMemberAdd(member) {
        const settings = this.getGuildStatsSettings(member.guild.id);
        if (settings && settings.enabled) {
            // Debounce: Birden fazla üye aynı anda katılırsa tek seferde güncelle
            const guildId = member.guild.id;
            if (this.updateTimeouts && this.updateTimeouts.has(guildId)) {
                clearTimeout(this.updateTimeouts.get(guildId));
            }
            
            if (!this.updateTimeouts) {
                this.updateTimeouts = new Map();
            }
            
            const timeout = setTimeout(async () => {
                await this.updateStatsChannels(member.guild);
                this.updateTimeouts.delete(guildId);
            }, 3000); // 3 saniye bekle
            
            this.updateTimeouts.set(guildId, timeout);
        }
    }

    async handleMemberRemove(member) {
        const settings = this.getGuildStatsSettings(member.guild.id);
        if (settings && settings.enabled) {
            // Debounce: Birden fazla üye aynı anda ayrılırsa tek seferde güncelle
            const guildId = member.guild.id;
            if (this.updateTimeouts && this.updateTimeouts.has(guildId)) {
                clearTimeout(this.updateTimeouts.get(guildId));
            }
            
            if (!this.updateTimeouts) {
                this.updateTimeouts = new Map();
            }
            
            const timeout = setTimeout(async () => {
                await this.updateStatsChannels(member.guild);
                this.updateTimeouts.delete(guildId);
            }, 3000); // 3 saniye bekle
            
            this.updateTimeouts.set(guildId, timeout);
        }
    }

    // Cleanup
    destroy() {
        // Tüm interval'leri temizle
        for (const [guildId, interval] of this.intervals) {
            clearInterval(interval);
        }
        this.intervals.clear();
        
        // Tüm timeout'ları temizle
        if (this.updateTimeouts) {
            for (const [guildId, timeout] of this.updateTimeouts) {
                clearTimeout(timeout);
            }
            this.updateTimeouts.clear();
        }
        
        logger.info('🔢 Server Stats Handler kapatıldı');
    }
}

module.exports = ServerStatsHandler;

