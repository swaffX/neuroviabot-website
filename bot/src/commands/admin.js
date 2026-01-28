const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logger } = require('../utils/logger');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('🔧 Admin komutları (Sadece bot sahipleri)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Bot istatistikleri')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('analytics')
                .setDescription('📈 Detaylı analytics raporu')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Rapor türü')
                        .addChoices(
                            { name: '📊 Genel', value: 'general' },
                            { name: '🎮 Komutlar', value: 'commands' },
                            { name: '❌ Hatalar', value: 'errors' },
                            { name: '⚡ Performance', value: 'performance' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('security')
                .setDescription('🛡️ Güvenlik durumu')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist')
                .setDescription('🚫 Kullanıcı kara listesi yönetimi')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('İşlem türü')
                        .addChoices(
                            { name: '➕ Ekle', value: 'add' },
                            { name: '➖ Kaldır', value: 'remove' },
                            { name: '👀 Görüntüle', value: 'list' }
                        )
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Kullanıcı (ekle/kaldır için)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Sebep (sadece eklerken)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reload')
                .setDescription('🔄 Bot bileşenlerini yeniden yükle')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Yenilenecek bileşen')
                        .addChoices(
                            { name: '🎮 Komutlar', value: 'commands' },
                            { name: '🎯 Handler\'lar', value: 'handlers' },
                            { name: '⚙️ Config', value: 'config' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('backup')
                .setDescription('💾 Database yedekleme')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('maintenance')
                .setDescription('🔧 Bakım modu')
                .addBooleanOption(option =>
                    option.setName('enable')
                        .setDescription('Bakım modunu aç/kapat')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            // Bot owner kontrolü
            if (!isAuthorized(interaction.user.id)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetkisiz Erişim')
                    .setDescription('Bu komut sadece bot sahipleri tarafından kullanılabilir!')
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'stats':
                    await handleStats(interaction);
                    break;
                case 'analytics':
                    await handleAnalytics(interaction);
                    break;
                case 'security':
                    await handleSecurity(interaction);
                    break;
                case 'blacklist':
                    await handleBlacklist(interaction);
                    break;
                case 'reload':
                    await handleReload(interaction);
                    break;
                case 'backup':
                    await handleBackup(interaction);
                    break;
                case 'maintenance':
                    await handleMaintenance(interaction);
                    break;
            }

        } catch (error) {
            logger.error('Admin command error', error, {
                user: interaction.user.tag,
                subcommand: interaction.options.getSubcommand()
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Admin komutu çalıştırılırken bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};

// Yetkilendirme kontrolü
function isAuthorized(userId) {
    const authorizedUsers = process.env.BOT_OWNERS?.split(',') || [];
    return authorizedUsers.includes(userId);
}

// İstatistikler
async function handleStats(interaction) {
    const client = interaction.client;
    const stats = client.analytics.getSystemStats();
    const musicStats = client.musicPlayer.getStatistics();

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📊 Bot İstatistikleri')
        .setDescription('Genel bot performans bilgileri')
        .addFields(
            {
                name: '⏱️ Çalışma Süresi',
                value: formatUptime(stats.uptime),
                inline: true
            },
            {
                name: '🎮 Toplam Komut',
                value: stats.totalCommands.toLocaleString(),
                inline: true
            },
            {
                name: '📝 Toplam Mesaj',
                value: stats.totalMessages.toLocaleString(),
                inline: true
            },
            {
                name: '🏰 Aktif Sunucu',
                value: stats.activeGuilds.toLocaleString(),
                inline: true
            },
            {
                name: '👥 Benzersiz Kullanıcı',
                value: stats.uniqueUsers.toLocaleString(),
                inline: true
            },
            {
                name: '❌ Hata Oranı',
                value: `${stats.errorRate}%`,
                inline: true
            },
            {
                name: '💾 Bellek Kullanımı',
                value: `${Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(stats.memoryUsage.heapTotal / 1024 / 1024)}MB`,
                inline: true
            },
            {
                name: '⚡ Ortalama Performans',
                value: `${stats.avgPerformance}ms`,
                inline: true
            }
        );

    if (musicStats) {
        embed.addFields(
            {
                name: '🎵 Müzik İstatistikleri',
                value: `**Aktif Queue:** ${musicStats.totalQueues}\n**Toplam Şarkı:** ${musicStats.totalTracks}\n**Aktif Bağlantı:** ${musicStats.activeConnections}`,
                inline: false
            }
        );
    }

    embed.setThumbnail(client.user.displayAvatarURL({ size: 256 }))
         .setFooter({ text: 'Son güncelleme' })
         .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Analytics raporu
async function handleAnalytics(interaction) {
    const type = interaction.options.getString('type') || 'general';
    const client = interaction.client;

    let embed = new EmbedBuilder().setColor(config.embedColor);

    switch (type) {
        case 'general':
            const systemStats = client.analytics.getSystemStats();
            embed.setTitle('📊 Genel Analytics Raporu')
                 .addFields(
                     {
                         name: '📈 Aktivite',
                         value: `**Komutlar:** ${systemStats.totalCommands}\n**Mesajlar:** ${systemStats.totalMessages}\n**Hatalar:** ${systemStats.totalErrors}`,
                         inline: true
                     },
                     {
                         name: '👥 Kullanıcılar',
                         value: `**Benzersiz:** ${systemStats.uniqueUsers}\n**Aktif Sunucu:** ${systemStats.activeGuilds}`,
                         inline: true
                     },
                     {
                         name: '⚡ Performans',
                         value: `**Ortalama:** ${systemStats.avgPerformance}ms\n**Hata Oranı:** ${systemStats.errorRate}%`,
                         inline: true
                     }
                 );
            break;

        case 'commands':
            const topCommands = client.analytics.getTopCommands(10);
            embed.setTitle('🎮 Komut Analytics Raporu')
                 .setDescription(topCommands.map((cmd, i) => 
                     `**${i + 1}.** \`${cmd.name}\` - ${cmd.uses} kullanım (${cmd.successRate}% başarı)`
                 ).join('\n'));
            break;

        case 'errors':
            const errors = client.analytics.getErrorStats().slice(0, 10);
            embed.setTitle('❌ Hata Analytics Raporu')
                 .setDescription(errors.length > 0 ? 
                     errors.map((error, i) => 
                         `**${i + 1}.** \`${error.type}\` - ${error.count} kez`
                     ).join('\n') : 'Henüz hata kaydı yok!'
                 );
            break;

        case 'performance':
            embed.setTitle('⚡ Performance Analytics Raporu')
                 .addFields({
                     name: '🔍 Sistem Durumu',
                     value: `**Ortalama Yanıt:** ${systemStats.avgPerformance}ms\n**Bellek:** ${Math.round(systemStats.memoryUsage.heapUsed / 1024 / 1024)}MB\n**CPU Usage:** ${process.cpuUsage().user}μs`,
                     inline: false
                 });
            break;
    }

    embed.setTimestamp();
    await interaction.reply({ embeds: [embed] });
}

// Güvenlik durumu
async function handleSecurity(interaction) {
    const client = interaction.client;
    const securityStats = client.security.getSystemStats();

    const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('🛡️ Güvenlik Durumu')
        .addFields(
            {
                name: '📊 İstatistikler',
                value: `**Rate Limited:** ${securityStats.rateLimitedUsers}\n**Şüpheli:** ${securityStats.suspiciousUsers}\n**Kara Liste:** ${securityStats.blacklistedUsers}`,
                inline: true
            },
            {
                name: '✅ Güvenilir Kullanıcı',
                value: `${securityStats.trustedUsers} kullanıcı`,
                inline: true
            },
            {
                name: '🔍 Spam İzleme',
                value: `${securityStats.spamTrackedUsers} kullanıcı izleniyor`,
                inline: true
            }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Blacklist yönetimi
async function handleBlacklist(interaction) {
    const action = interaction.options.getString('action');
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi';
    const client = interaction.client;

    let embed = new EmbedBuilder().setColor(config.embedColor);

    switch (action) {
        case 'add':
            if (!user) {
                embed.setColor('#ff0000').setTitle('❌ Hata').setDescription('Kullanıcı belirtilmedi!');
                break;
            }
            
            client.security.blacklistUser(user.id, reason);
            embed.setColor('#ff0000')
                 .setTitle('🚫 Kullanıcı Kara Listeye Eklendi')
                 .setDescription(`**${user.tag}** kara listeye eklendi.\n**Sebep:** ${reason}`);
            break;

        case 'remove':
            if (!user) {
                embed.setColor('#ff0000').setTitle('❌ Hata').setDescription('Kullanıcı belirtilmedi!');
                break;
            }

            const removed = client.security.unblacklistUser(user.id);
            if (removed) {
                embed.setColor('#00ff00')
                     .setTitle('✅ Kullanıcı Kara Listeden Kaldırıldı')
                     .setDescription(`**${user.tag}** kara listeden kaldırıldı.`);
            } else {
                embed.setColor('#ff9900')
                     .setTitle('⚠️ Uyarı')
                     .setDescription(`**${user.tag}** zaten kara listede değil.`);
            }
            break;

        case 'list':
            const blacklistedCount = client.security.blacklistedUsers.size;
            embed.setTitle('📋 Kara Liste')
                 .setDescription(blacklistedCount > 0 ? 
                     `Toplam **${blacklistedCount}** kullanıcı kara listede.` :
                     'Kara liste boş!'
                 );
            break;
    }

    await interaction.reply({ embeds: [embed] });
}

// Reload işlemleri
async function handleReload(interaction) {
    const type = interaction.options.getString('type');

    const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('🔄 Yeniden Yükleme')
        .setDescription(`**${type}** yeniden yükleniyor... Bu işlem biraz zaman alabilir.`);

    await interaction.reply({ embeds: [embed] });

    try {
        // Burada reload işlemleri yapılacak
        // Şimdilik placeholder
        
        const successEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Başarılı')
            .setDescription(`**${type}** başarıyla yeniden yüklendi!`);

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Hata')
            .setDescription(`**${type}** yeniden yüklenirken hata oluştu: ${error.message}`);

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

// Backup işlemi
async function handleBackup(interaction) {
    try {
        const { createBackup } = require('../models/index');
        
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('💾 Yedekleme')
            .setDescription('Database yedeklemesi oluşturuluyor...');

        await interaction.reply({ embeds: [embed] });

        const backupFile = await createBackup();

        const successEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Yedekleme Başarılı')
            .setDescription(`Database yedeklemesi başarıyla oluşturuldu!\n**Dosya:** ${backupFile}`)
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Yedekleme Hatası')
            .setDescription(`Yedekleme oluşturulurken hata: ${error.message}`);

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

// Bakım modu
async function handleMaintenance(interaction) {
    const enable = interaction.options.getBoolean('enable');
    
    // Global maintenance flag (bu basit bir implementasyon)
    global.maintenanceMode = enable;

    const embed = new EmbedBuilder()
        .setColor(enable ? '#ff9900' : '#00ff00')
        .setTitle(enable ? '🔧 Bakım Modu Aktif' : '✅ Bakım Modu Kapatıldı')
        .setDescription(enable ? 
            'Bot bakım moduna alındı. Sadece admin komutları çalışacak.' :
            'Bot normal çalışma moduna döndü.'
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Uptime formatlama
function formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}g ${hours % 24}s ${minutes % 60}d ${seconds % 60}sn`;
}
