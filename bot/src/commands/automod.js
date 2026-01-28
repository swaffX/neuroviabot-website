const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('🛡️ Otomatik moderasyon sistemi ayarları')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Otomatik moderasyonu yapılandır')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('spam')
                .setDescription('Spam koruması ayarla')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Spam korumasını aktifleştir/kapat')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('max-messages')
                        .setDescription('5 saniyede maksimum mesaj sayısı')
                        .setMinValue(3)
                        .setMaxValue(20)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('links')
                .setDescription('Link filtresi ayarla')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Link filtresini aktifleştir/kapat')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('words')
                .setDescription('Kelime filtresi ayarla')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Kelime filtresini aktifleştir/kapat')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist-link')
                .setDescription('Link whitelist\'e ekle')
                .addStringOption(option =>
                    option.setName('domain')
                        .setDescription('İzin verilen domain (örn: youtube.com)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist-link')
                .setDescription('Link blacklist\'e ekle')
                .addStringOption(option =>
                    option.setName('domain')
                        .setDescription('Engellenen domain')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-word')
                .setDescription('Yasaklı kelime ekle')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Yasaklanacak kelime')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-word')
                .setDescription('Yasaklı kelime kaldır')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Kaldırılacak kelime')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('log-channel')
                .setDescription('Auto-mod log kanalı ayarla')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Log kanalı')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Auto-mod durumunu görüntüle')
        ),

    async execute(interaction) {
        const db = getDatabase();
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            if (subcommand === 'setup') {
                await this.handleSetup(interaction, db);
            } else if (subcommand === 'spam') {
                await this.handleSpam(interaction, db);
            } else if (subcommand === 'links') {
                await this.handleLinks(interaction, db);
            } else if (subcommand === 'words') {
                await this.handleWords(interaction, db);
            } else if (subcommand === 'whitelist-link') {
                await this.handleWhitelistLink(interaction, db);
            } else if (subcommand === 'blacklist-link') {
                await this.handleBlacklistLink(interaction, db);
            } else if (subcommand === 'add-word') {
                await this.handleAddWord(interaction, db);
            } else if (subcommand === 'remove-word') {
                await this.handleRemoveWord(interaction, db);
            } else if (subcommand === 'log-channel') {
                await this.handleLogChannel(interaction, db);
            } else if (subcommand === 'status') {
                await this.handleStatus(interaction, db);
            }
        } catch (error) {
            logger.error('[AutoMod Command] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ef4444')
                .setTitle('❌ Hata')
                .setDescription(`Bir hata oluştu: ${error.message}`)
                .setTimestamp();

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleSetup(interaction, db) {
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        
        if (!settings.automod_settings) {
            settings.automod_settings = {
                enabled: true,
                antiSpam: {
                    enabled: true,
                    maxMessages: 5,
                    timeframe: 5000,
                    checkDuplicates: true,
                    actions: { 3: 'warn', 5: 'mute', 10: 'kick' },
                    muteDuration: 600000 // 10 minutes
                },
                linkFilter: {
                    enabled: false,
                    whitelist: [],
                    blacklist: [],
                    actions: { 2: 'warn', 5: 'mute' }
                },
                wordFilter: {
                    enabled: false,
                    blockedWords: [],
                    actions: { 1: 'warn', 3: 'mute', 5: 'kick' }
                },
                logChannel: null
            };
            
            db.setGuildSettings(interaction.guild.id, settings);
        }

        const embed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Auto-Mod Kurulumu Tamamlandı')
            .setDescription('Otomatik moderasyon sistemi aktifleştirildi!')
            .addFields(
                { name: '🚫 Anti-Spam', value: 'Aktif (5 mesaj / 5 saniye)', inline: true },
                { name: '🔗 Link Filtresi', value: 'Pasif', inline: true },
                { name: '📝 Kelime Filtresi', value: 'Pasif', inline: true },
                { name: '⚙️ Ayarlar', value: 'Detaylı ayarlar için: `/automod spam`, `/automod links`, `/automod words`' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleSpam(interaction, db) {
        const enabled = interaction.options.getBoolean('enabled');
        const maxMessages = interaction.options.getInteger('max-messages');
        
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.automod_settings) {
            settings.automod_settings = {};
        }
        
        if (!settings.automod_settings.antiSpam) {
            settings.automod_settings.antiSpam = {};
        }
        
        settings.automod_settings.antiSpam.enabled = enabled;
        if (maxMessages) {
            settings.automod_settings.antiSpam.maxMessages = maxMessages;
        }
        
        db.setGuildSettings(interaction.guild.id, settings);

        const embed = new EmbedBuilder()
            .setColor(enabled ? '#10b981' : '#6b7280')
            .setTitle(enabled ? '✅ Spam Koruması Aktif' : '⏸️ Spam Koruması Kapatıldı')
            .setDescription(enabled ? 
                `**Ayarlar:**\n📊 Maksimum mesaj: ${maxMessages || 5} / 5 saniye\n🔄 Tekrar kontrolü: Aktif` :
                'Spam koruması devre dışı bırakıldı.'
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleLinks(interaction, db) {
        const enabled = interaction.options.getBoolean('enabled');
        
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.automod_settings) {
            settings.automod_settings = {};
        }
        
        if (!settings.automod_settings.linkFilter) {
            settings.automod_settings.linkFilter = {
                whitelist: [],
                blacklist: []
            };
        }
        
        settings.automod_settings.linkFilter.enabled = enabled;
        db.setGuildSettings(interaction.guild.id, settings);

        const embed = new EmbedBuilder()
            .setColor(enabled ? '#10b981' : '#6b7280')
            .setTitle(enabled ? '✅ Link Filtresi Aktif' : '⏸️ Link Filtresi Kapatıldı')
            .setDescription(enabled ? 
                'Link filtresi aktifleştirildi.\n\n`/automod whitelist-link` - İzin verilen domain ekle\n`/automod blacklist-link` - Engellenen domain ekle' :
                'Link filtresi devre dışı bırakıldı.'
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleWords(interaction, db) {
        const enabled = interaction.options.getBoolean('enabled');
        
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.automod_settings) {
            settings.automod_settings = {};
        }
        
        if (!settings.automod_settings.wordFilter) {
            settings.automod_settings.wordFilter = {
                blockedWords: []
            };
        }
        
        settings.automod_settings.wordFilter.enabled = enabled;
        db.setGuildSettings(interaction.guild.id, settings);

        const embed = new EmbedBuilder()
            .setColor(enabled ? '#10b981' : '#6b7280')
            .setTitle(enabled ? '✅ Kelime Filtresi Aktif' : '⏸️ Kelime Filtresi Kapatıldı')
            .setDescription(enabled ? 
                'Kelime filtresi aktifleştirildi.\n\n`/automod add-word` - Yasaklı kelime ekle\n`/automod remove-word` - Yasaklı kelime kaldır' :
                'Kelime filtresi devre dışı bırakıldı.'
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleWhitelistLink(interaction, db) {
        const domain = interaction.options.getString('domain').toLowerCase();
        
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.automod_settings?.linkFilter) {
            return interaction.reply({ content: '❌ Önce link filtresini aktifleştirin: `/automod links enabled:True`', ephemeral: true });
        }
        
        if (!settings.automod_settings.linkFilter.whitelist) {
            settings.automod_settings.linkFilter.whitelist = [];
        }
        
        if (settings.automod_settings.linkFilter.whitelist.includes(domain)) {
            return interaction.reply({ content: '⚠️ Bu domain zaten whitelist\'te!', ephemeral: true });
        }
        
        settings.automod_settings.linkFilter.whitelist.push(domain);
        db.setGuildSettings(interaction.guild.id, settings);

        const embed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Domain Whitelist\'e Eklendi')
            .setDescription(`\`${domain}\` artık izin verilen linkler arasında.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleBlacklistLink(interaction, db) {
        const domain = interaction.options.getString('domain').toLowerCase();
        
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.automod_settings?.linkFilter) {
            return interaction.reply({ content: '❌ Önce link filtresini aktifleştirin: `/automod links enabled:True`', ephemeral: true });
        }
        
        if (!settings.automod_settings.linkFilter.blacklist) {
            settings.automod_settings.linkFilter.blacklist = [];
        }
        
        if (settings.automod_settings.linkFilter.blacklist.includes(domain)) {
            return interaction.reply({ content: '⚠️ Bu domain zaten blacklist\'te!', ephemeral: true });
        }
        
        settings.automod_settings.linkFilter.blacklist.push(domain);
        db.setGuildSettings(interaction.guild.id, settings);

        const embed = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('🚫 Domain Blacklist\'e Eklendi')
            .setDescription(`\`${domain}\` artık engellenen linkler arasında.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleAddWord(interaction, db) {
        const word = interaction.options.getString('word').toLowerCase();
        
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.automod_settings?.wordFilter) {
            return interaction.reply({ content: '❌ Önce kelime filtresini aktifleştirin: `/automod words enabled:True`', ephemeral: true });
        }
        
        if (!settings.automod_settings.wordFilter.blockedWords) {
            settings.automod_settings.wordFilter.blockedWords = [];
        }
        
        if (settings.automod_settings.wordFilter.blockedWords.includes(word)) {
            return interaction.reply({ content: '⚠️ Bu kelime zaten yasaklı!', ephemeral: true });
        }
        
        settings.automod_settings.wordFilter.blockedWords.push(word);
        db.setGuildSettings(interaction.guild.id, settings);

        const embed = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('🚫 Yasaklı Kelime Eklendi')
            .setDescription(`\`${word}\` artık yasaklı kelimeler arasında.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleRemoveWord(interaction, db) {
        const word = interaction.options.getString('word').toLowerCase();
        
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.automod_settings?.wordFilter?.blockedWords) {
            return interaction.reply({ content: '❌ Yasaklı kelime listesi boş!', ephemeral: true });
        }
        
        const index = settings.automod_settings.wordFilter.blockedWords.indexOf(word);
        if (index === -1) {
            return interaction.reply({ content: '⚠️ Bu kelime yasaklı kelimeler arasında değil!', ephemeral: true });
        }
        
        settings.automod_settings.wordFilter.blockedWords.splice(index, 1);
        db.setGuildSettings(interaction.guild.id, settings);

        const embed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Yasaklı Kelime Kaldırıldı')
            .setDescription(`\`${word}\` yasaklı kelimeler listesinden çıkarıldı.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleLogChannel(interaction, db) {
        const channel = interaction.options.getChannel('channel');
        
        const settings = db.getGuildSettings(interaction.guild.id) || {};
        if (!settings.automod_settings) {
            settings.automod_settings = {};
        }
        
        settings.automod_settings.logChannel = channel.id;
        db.setGuildSettings(interaction.guild.id, settings);

        const embed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Log Kanalı Ayarlandı')
            .setDescription(`Auto-mod logları artık ${channel} kanalına gönderilecek.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleStatus(interaction, db) {
        const settings = db.getGuildSettings(interaction.guild.id);
        const automod = settings?.automod_settings;

        if (!automod || !automod.enabled) {
            return interaction.reply({ 
                content: '⏸️ Auto-mod sistemi kapalı. Açmak için: `/automod setup`', 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle('🛡️ Auto-Mod Durumu')
            .addFields(
                { 
                    name: '🚫 Anti-Spam', 
                    value: automod.antiSpam?.enabled ? 
                        `✅ Aktif\n📊 ${automod.antiSpam.maxMessages || 5} mesaj / 5 saniye` : 
                        '⏸️ Pasif', 
                    inline: true 
                },
                { 
                    name: '🔗 Link Filtresi', 
                    value: automod.linkFilter?.enabled ? 
                        `✅ Aktif\n✨ Whitelist: ${automod.linkFilter.whitelist?.length || 0}\n🚫 Blacklist: ${automod.linkFilter.blacklist?.length || 0}` : 
                        '⏸️ Pasif', 
                    inline: true 
                },
                { 
                    name: '📝 Kelime Filtresi', 
                    value: automod.wordFilter?.enabled ? 
                        `✅ Aktif\n🚫 Yasaklı: ${automod.wordFilter.blockedWords?.length || 0} kelime` : 
                        '⏸️ Pasif', 
                    inline: true 
                },
                { 
                    name: '📋 Log Kanalı', 
                    value: automod.logChannel ? `<#${automod.logChannel}>` : 'Ayarlanmamış', 
                    inline: false 
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

