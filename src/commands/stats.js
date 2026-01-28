const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Guild, GuildMember, Ticket, Warning, Giveaway, ModerationCase, User } = require('../models');
const { logger } = require('../utils/logger');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 İstatistik sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('🏠 Sunucu istatistikleri')
                .addStringOption(option =>
                    option.setName('period')
                        .setDescription('Zaman aralığı')
                        .addChoices(
                            { name: '📅 Bugün', value: '24h' },
                            { name: '📅 Bu Hafta', value: '7d' },
                            { name: '📅 Bu Ay', value: '30d' },
                            { name: '📅 Tüm Zamanlar', value: 'all' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('👤 Kullanıcı istatistikleri')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('İstatistikleri görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('activity')
                .setDescription('📈 Aktivite istatistikleri')
                .addStringOption(option =>
                    option.setName('tür')
                        .setDescription('Aktivite türü')
                        .addChoices(
                            { name: '💬 Mesajlar', value: 'messages' },
                            { name: '🎫 Ticket\'lar', value: 'tickets' },
                            { name: '🛡️ Moderasyon', value: 'moderation' },
                            { name: '🎉 Çekilişler', value: 'giveaways' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('🏆 Liderlik tablosu')
                .addStringOption(option =>
                    option.setName('kategori')
                        .setDescription('Liderlik kategorisi')
                        .addChoices(
                            { name: '💬 Mesaj Sayısı', value: 'messages' },
                            { name: '🎯 Seviye', value: 'level' },
                            { name: '⏰ Ses Süresi', value: 'voice' },
                            { name: '🎫 Ticket Sayısı', value: 'tickets' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bot')
                .setDescription('🤖 Bot istatistikleri')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('📺 Kanal istatistikleri')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'server':
                    await this.handleServerStats(interaction);
                    break;
                case 'user':
                    await this.handleUserStats(interaction);
                    break;
                case 'activity':
                    await this.handleActivityStats(interaction);
                    break;
                case 'leaderboard':
                    await this.handleLeaderboard(interaction);
                    break;
                case 'bot':
                    await this.handleBotStats(interaction);
                    break;
                case 'channels':
                    await this.handleChannelStats(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Stats komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ İstatistik Hatası')
                .setDescription('İstatistik işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    },

    async handleServerStats(interaction) {
        const period = interaction.options.getString('period') || '7d';

        await interaction.deferReply();

        try {
            // Zaman aralığını belirle
            let startDate = new Date();
            let periodText = '';
            
            switch (period) {
                case '24h':
                    startDate.setHours(startDate.getHours() - 24);
                    periodText = 'Son 24 Saat';
                    break;
                case '7d':
                    startDate.setDate(startDate.getDate() - 7);
                    periodText = 'Son 7 Gün';
                    break;
                case '30d':
                    startDate.setDate(startDate.getDate() - 30);
                    periodText = 'Son 30 Gün';
                    break;
                case 'all':
                    startDate = new Date(0);
                    periodText = 'Tüm Zamanlar';
                    break;
            }

            const whereClause = period === 'all' ? { guildId: interaction.guild.id } : {
                guildId: interaction.guild.id,
                createdAt: { [require('sequelize').Op.gte]: startDate }
            };

            // İstatistikleri topla
            const stats = await Promise.all([
                // Yeni üyeler
                GuildMember.count({ where: whereClause }),
                // Yeni ticket'lar
                Ticket.count({ where: whereClause }),
                // Moderasyon işlemleri
                ModerationCase.count({ where: whereClause }),
                // Çekilişler
                Giveaway.count({ where: whereClause }),
                // Aktif uyarılar
                Warning.count({ 
                    where: { 
                        guildId: interaction.guild.id, 
                        active: true 
                    } 
                })
            ]);

            // Sunucu genel bilgileri
            const guild = interaction.guild;
            const channels = guild.channels.cache;
            const roles = guild.roles.cache;
            
            const textChannels = channels.filter(ch => ch.isTextBased()).size;
            const voiceChannels = channels.filter(ch => ch.isVoiceBased()).size;
            const categories = channels.filter(ch => ch.type === 4).size;

            // Bot bilgileri
            const botMember = guild.members.me;
            const joinedAgo = moment(botMember.joinedAt).fromNow();

            const serverEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📊 ${guild.name} - Sunucu İstatistikleri`)
                .setDescription(`**${periodText}** dönemi istatistikleri`)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: '👥 Toplam Üye', value: guild.memberCount.toString(), inline: true },
                    { name: '🤖 Bot Sayısı', value: guild.members.cache.filter(m => m.user.bot).size.toString(), inline: true },
                    { name: '👤 İnsan Sayısı', value: guild.members.cache.filter(m => !m.user.bot).size.toString(), inline: true },
                    { name: '📺 Metin Kanalları', value: textChannels.toString(), inline: true },
                    { name: '🔊 Ses Kanalları', value: voiceChannels.toString(), inline: true },
                    { name: '📁 Kategoriler', value: categories.toString(), inline: true },
                    { name: '🎭 Rol Sayısı', value: (roles.size - 1).toString(), inline: true }, // @everyone hariç
                    { name: '⭐ Boost Sayısı', value: (guild.premiumSubscriptionCount || 0).toString(), inline: true },
                    { name: '🏆 Boost Seviyesi', value: (guild.premiumTier || 0).toString(), inline: true }
                )
                .addFields(
                    { name: '\u200B', value: '\u200B', inline: false }, // Spacer
                    { name: `📈 ${periodText} Aktivitesi`, value: '\u200B', inline: false },
                    { name: '👋 Yeni Üyeler', value: stats[0].toString(), inline: true },
                    { name: '🎫 Yeni Ticket\'lar', value: stats[1].toString(), inline: true },
                    { name: '🛡️ Moderasyon İşlemi', value: stats[2].toString(), inline: true },
                    { name: '🎉 Çekilişler', value: stats[3].toString(), inline: true },
                    { name: '⚠️ Aktif Uyarılar', value: stats[4].toString(), inline: true },
                    { name: '🤖 Bot Katılım', value: joinedAgo, inline: true }
                )
                .setFooter({
                    text: `Sunucu Oluşturulma: ${moment(guild.createdAt).format('DD/MM/YYYY')}`,
                    iconURL: guild.iconURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [serverEmbed] });

        } catch (error) {
            logger.error('Server stats hatası', error);
        }
    },

    async handleUserStats(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarının istatistikleri gösterilmez!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        await interaction.deferReply();

        try {
            // Kullanıcı verilerini al
            const guildMember = await GuildMember.findOne({
                where: {
                    userId: targetUser.id,
                    guildId: interaction.guild.id
                }
            });

            if (!guildMember) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Veri Bulunamadı')
                    .setDescription('Bu kullanıcı için veri bulunamadı!')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Discord üye bilgileri
            const discordMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            // İstatistikleri topla
            const stats = await Promise.all([
                Ticket.count({ 
                    where: { 
                        userId: targetUser.id, 
                        guildId: interaction.guild.id 
                    } 
                }),
                Warning.count({ 
                    where: { 
                        userId: targetUser.id, 
                        guildId: interaction.guild.id,
                        active: true 
                    } 
                }),
                ModerationCase.count({ 
                    where: { 
                        userId: targetUser.id, 
                        guildId: interaction.guild.id 
                    } 
                }),
                Giveaway.count({ 
                    where: { 
                        hosterId: targetUser.id, 
                        guildId: interaction.guild.id 
                    } 
                })
            ]);

            // Hesap yaşı ve sunucuda kalma süresi
            const accountAge = moment().diff(moment(targetUser.createdAt), 'days');
            const joinedAgo = discordMember ? moment().diff(moment(discordMember.joinedAt), 'days') : 0;

            // Son aktivite
            const lastActive = guildMember.lastActive ? moment(guildMember.lastActive).fromNow() : 'Bilinmiyor';
            const lastMessage = guildMember.lastMessage ? moment(guildMember.lastMessage).fromNow() : 'Hiç';

            // Seviye ve XP bilgileri
            const level = guildMember.level || 0;
            const xp = guildMember.xp || 0;
            const nextLevelXp = Math.floor(Math.pow(level + 1, 2) * 100);
            const currentLevelXp = Math.floor(Math.pow(level, 2) * 100);
            const progressXp = xp - currentLevelXp;
            const neededXp = nextLevelXp - currentLevelXp;
            const progressPercent = Math.floor((progressXp / neededXp) * 100);

            const userEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📊 ${targetUser.username} - Kullanıcı İstatistikleri`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: '👤 Temel Bilgiler', value: '\u200B', inline: false },
                    { name: '🆔 User ID', value: targetUser.id, inline: true },
                    { name: '📅 Hesap Yaşı', value: `${accountAge} gün`, inline: true },
                    { name: '📅 Sunucuda', value: `${joinedAgo} gün`, inline: true },
                    { name: '🎭 Rol Sayısı', value: discordMember ? (discordMember.roles.cache.size - 1).toString() : '0', inline: true },
                    { name: '⏰ Son Aktivite', value: lastActive, inline: true },
                    { name: '💬 Son Mesaj', value: lastMessage, inline: true },
                    
                    { name: '📈 Seviye Sistemi', value: '\u200B', inline: false },
                    { name: '🏆 Seviye', value: level.toString(), inline: true },
                    { name: '⭐ XP', value: xp.toLocaleString(), inline: true },
                    { name: '📊 İlerleme', value: `${progressPercent}% (${progressXp.toLocaleString()}/${neededXp.toLocaleString()})`, inline: true },
                    { name: '💬 Mesaj Sayısı', value: (guildMember.messageCount || 0).toLocaleString(), inline: true },
                    { name: '🔊 Ses Süresi', value: this.formatDuration(guildMember.voiceTime || 0), inline: true },
                    { name: '🎯 Komut Kullanımı', value: (guildMember.commandsUsed || 0).toString(), inline: true },
                    
                    { name: '🎫 Bot İstatistikleri', value: '\u200B', inline: false },
                    { name: '🎫 Ticket Sayısı', value: stats[0].toString(), inline: true },
                    { name: '⚠️ Aktif Uyarılar', value: stats[1].toString(), inline: true },
                    { name: '🛡️ Moderasyon Geçmişi', value: stats[2].toString(), inline: true },
                    { name: '🎉 Düzenlenen Çekilişler', value: stats[3].toString(), inline: true },
                    { name: '💰 Bakiye', value: `${(guildMember.balance || 0).toLocaleString()} coin`, inline: true },
                    { name: '🏦 Banka', value: `${(guildMember.bank || 0).toLocaleString()} coin`, inline: true }
                )
                .setFooter({
                    text: `${interaction.guild.name} • ${moment().format('DD/MM/YYYY HH:mm')}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [userEmbed] });

        } catch (error) {
            logger.error('User stats hatası', error);
        }
    },

    async handleBotStats(interaction) {
        await interaction.deferReply();

        try {
            const client = interaction.client;
            const { getDatabase } = require('../database/simple-db');
            const db = getDatabase();
            
            // Bot başlangıç süresi
            const uptime = this.formatDuration(client.uptime || 0);
            
            // Sunucu sayıları
            const guilds = client.guilds.cache.size;
            const users = client.users.cache.size;
            const channels = client.channels.cache.size;
            
            // Memory kullanımı
            const memoryUsage = process.memoryUsage();
            const usedMemory = Math.round(memoryUsage.heapUsed / 1024 / 1024);
            const totalMemory = Math.round(memoryUsage.heapTotal / 1024 / 1024);
            
            // Database istatistikleri (simple-db'den)
            const userCount = db.data.users?.size || 0;
            const guildCount = db.data.guilds?.size || 0;
            const memberCount = db.data.members?.size || 0;
            const ticketCount = db.data.tickets?.size || 0;

            const botEmbed = new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('🤖 Bot İstatistikleri')
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: '⚡ Sistem Bilgileri', value: '\u200B', inline: false },
                    { name: '⏰ Çalışma Süresi', value: uptime, inline: true },
                    { name: '💾 RAM Kullanımı', value: `${usedMemory}MB / ${totalMemory}MB`, inline: true },
                    { name: '📡 Ping', value: `${client.ws.ping}ms`, inline: true },
                    { name: '🔧 Node.js', value: process.version, inline: true },
                    { name: '📚 Discord.js', value: require('discord.js').version, inline: true },
                    { name: '🖥️ Platform', value: process.platform, inline: true },
                    
                    { name: '📊 Bot Kapsamı', value: '\u200B', inline: false },
                    { name: '🏠 Sunucu Sayısı', value: guilds.toLocaleString(), inline: true },
                    { name: '👥 Kullanıcı Sayısı', value: users.toLocaleString(), inline: true },
                    { name: '📺 Kanal Sayısı', value: channels.toLocaleString(), inline: true },
                    
                    { name: '🗄️ Database İstatistikleri', value: '\u200B', inline: false },
                    { name: '👤 Kullanıcı Kaydı', value: userCount.toLocaleString(), inline: true },
                    { name: '🏠 Sunucu Kaydı', value: guildCount.toLocaleString(), inline: true },
                    { name: '👥 Üye Kaydı', value: memberCount.toLocaleString(), inline: true },
                    { name: '🎫 Ticket Kaydı', value: ticketCount.toLocaleString(), inline: true },
                    { name: '🎵 Müzik Oturumu', value: this.getMusicSessionCount(client), inline: true }
                )
                .setFooter({
                    text: `${client.user.tag} • Versiyon 2.0.0`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [botEmbed] });

        } catch (error) {
            logger.error('Bot stats hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ İstatistik Hatası')
                .setDescription('Bot istatistikleri alınırken bir hata oluştu!')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    // Yardımcı fonksiyonlar
    formatDuration(milliseconds) {
        if (!milliseconds || milliseconds < 0) return '0 saniye';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} gün ${hours % 24} saat`;
        } else if (hours > 0) {
            return `${hours} saat ${minutes % 60} dakika`;
        } else if (minutes > 0) {
            return `${minutes} dakika`;
        } else {
            return `${seconds} saniye`;
        }
    },

    getMusicSessionCount(client) {
        try {
            // Discord Player'dan aktif queue sayısını al
            const { useMainPlayer } = require('discord-player');
            const player = useMainPlayer();
            
            if (!player) return '0 aktif';
            
            const activeQueues = player.nodes.cache.size;
            const totalPlaying = player.nodes.cache.filter(queue => queue.isPlaying()).size;
            
            return `${totalPlaying}/${activeQueues} aktif`;
        } catch (error) {
            console.error('Music session count error:', error);
            return '0 aktif';
        }
    },

    async getDatabaseSize() {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // SQLite database dosya boyutunu al
            const dbPath = path.join(__dirname, '../database/bot_database.sqlite');
            
            try {
                const stats = await fs.stat(dbPath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                return `${sizeInMB} MB`;
            } catch (fileError) {
                // Dosya yoksa veya okunamazsa
                return 'Hesaplanamadı';
            }
        } catch (error) {
            console.error('Database size error:', error);
            return 'Hata';
        }
    }
};

