const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-config')
        .setDescription('🛒 Pazar yeri ayarları (Yönetici)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('✅ Sunucu pazar yerini aç/kapat')
                .addBooleanOption(option =>
                    option.setName('durum')
                        .setDescription('Açık/Kapalı')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tax')
                .setDescription('💸 İşlem vergisi ayarla')
                .addIntegerOption(option =>
                    option.setName('oran')
                        .setDescription('Vergi oranı (0-20%)')
                        .setMinValue(0)
                        .setMaxValue(20)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('allow-global')
                .setDescription('🌍 Global pazar yerine erişimi aç/kapat')
                .addBooleanOption(option =>
                    option.setName('durum')
                        .setDescription('Açık/Kapalı')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('min-price')
                .setDescription('💰 Minimum ilan fiyatı ayarla')
                .addIntegerOption(option =>
                    option.setName('fiyat')
                        .setDescription('Minimum fiyat (NRC)')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('max-price')
                .setDescription('💎 Maximum ilan fiyatı ayarla')
                .addIntegerOption(option =>
                    option.setName('fiyat')
                        .setDescription('Maximum fiyat (NRC)')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist')
                .setDescription('🚫 Belirli eşya türlerini yasakla')
                .addStringOption(option =>
                    option.setName('tür')
                        .setDescription('Yasaklanacak eşya türü')
                        .addChoices(
                            { name: '👑 Rol', value: 'role' },
                            { name: '🏅 Rozet', value: 'badge' },
                            { name: '⚡ Boost', value: 'boost' },
                            { name: '✨ Özel', value: 'custom' },
                            { name: '🎨 NFT', value: 'nft' }
                        )
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('yasakla')
                        .setDescription('Yasakla/İzin ver')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('👁️ Mevcut ayarları görüntüle')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('🔄 Ayarları sıfırla')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Admin check
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Yetki Hatası')
                    .setDescription('Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!')],
                ephemeral: true
            });
        }

        try {
            switch (subcommand) {
                case 'enable':
                    await this.handleEnable(interaction);
                    break;
                case 'tax':
                    await this.handleTax(interaction);
                    break;
                case 'allow-global':
                    await this.handleAllowGlobal(interaction);
                    break;
                case 'min-price':
                    await this.handleMinPrice(interaction);
                    break;
                case 'max-price':
                    await this.handleMaxPrice(interaction);
                    break;
                case 'blacklist':
                    await this.handleBlacklist(interaction);
                    break;
                case 'view':
                    await this.handleView(interaction);
                    break;
                case 'reset':
                    await this.handleReset(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Market-config komutunda hata', error, { subcommand, guild: interaction.guild.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Ayar Hatası')
                .setDescription('Ayar işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleEnable(interaction) {
        const enabled = interaction.options.getBoolean('durum');
        const db = getDatabase();
        const guildId = interaction.guild.id;

        const config = db.getServerMarketConfig(guildId);
        config.enabled = enabled;
        db.updateServerMarketConfig(guildId, config);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('✅ Pazar Yeri Ayarı Güncellendi')
            .setDescription(`Sunucu pazar yeri **${enabled ? 'açıldı' : 'kapatıldı'}**.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleTax(interaction) {
        const taxRate = interaction.options.getInteger('oran');
        const db = getDatabase();
        const guildId = interaction.guild.id;

        const config = db.getServerMarketConfig(guildId);
        config.taxRate = taxRate;
        db.updateServerMarketConfig(guildId, config);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('💸 Vergi Oranı Güncellendi')
            .setDescription(`İşlem vergisi **%${taxRate}** olarak ayarlandı.`)
            .addFields({
                name: '📝 Örnek',
                value: `1000 NRC\'lik bir satışta ${taxRate * 10} NRC vergi alınacak.`,
                inline: false
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleAllowGlobal(interaction) {
        const allowed = interaction.options.getBoolean('durum');
        const db = getDatabase();
        const guildId = interaction.guild.id;

        const config = db.getServerMarketConfig(guildId);
        config.allowGlobal = allowed;
        db.updateServerMarketConfig(guildId, config);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🌍 Global Pazar Erişimi Güncellendi')
            .setDescription(`Üyeler global pazar yerine **${allowed ? 'erişebilir' : 'erişemez'}**.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleMinPrice(interaction) {
        const minPrice = interaction.options.getInteger('fiyat');
        const db = getDatabase();
        const guildId = interaction.guild.id;

        const config = db.getServerMarketConfig(guildId);
        config.minPrice = minPrice;
        db.updateServerMarketConfig(guildId, config);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('💰 Minimum Fiyat Güncellendi')
            .setDescription(`İlanlar minimum **${minPrice.toLocaleString()} NRC** fiyatla oluşturulabilir.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleMaxPrice(interaction) {
        const maxPrice = interaction.options.getInteger('fiyat');
        const db = getDatabase();
        const guildId = interaction.guild.id;

        const config = db.getServerMarketConfig(guildId);
        config.maxPrice = maxPrice;
        db.updateServerMarketConfig(guildId, config);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('💎 Maximum Fiyat Güncellendi')
            .setDescription(`İlanlar maximum **${maxPrice.toLocaleString()} NRC** fiyatla oluşturulabilir.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleBlacklist(interaction) {
        const type = interaction.options.getString('tür');
        const blacklist = interaction.options.getBoolean('yasakla');
        const db = getDatabase();
        const guildId = interaction.guild.id;

        const config = db.getServerMarketConfig(guildId);
        if (!config.blacklistedTypes) config.blacklistedTypes = [];

        if (blacklist) {
            if (!config.blacklistedTypes.includes(type)) {
                config.blacklistedTypes.push(type);
            }
        } else {
            config.blacklistedTypes = config.blacklistedTypes.filter(t => t !== type);
        }

        db.updateServerMarketConfig(guildId, config);

        const typeNames = {
            role: '👑 Rol',
            badge: '🏅 Rozet',
            boost: '⚡ Boost',
            custom: '✨ Özel',
            nft: '🎨 NFT'
        };

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🚫 Kara Liste Güncellendi')
            .setDescription(`${typeNames[type]} türü **${blacklist ? 'yasaklandı' : 'izin verildi'}**.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleView(interaction) {
        const db = getDatabase();
        const guildId = interaction.guild.id;
        const config = db.getServerMarketConfig(guildId);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🛒 Pazar Yeri Ayarları')
            .setDescription(`**${interaction.guild.name}** sunucusunun pazar yeri ayarları`)
            .addFields(
                { name: '✅ Durum', value: config.enabled ? 'Açık' : 'Kapalı', inline: true },
                { name: '💸 Vergi Oranı', value: `%${config.taxRate || 0}`, inline: true },
                { name: '🌍 Global Erişim', value: config.allowGlobal ? 'Açık' : 'Kapalı', inline: true },
                { name: '💰 Min Fiyat', value: `${(config.minPrice || 1).toLocaleString()} NRC`, inline: true },
                { name: '💎 Max Fiyat', value: config.maxPrice ? `${config.maxPrice.toLocaleString()} NRC` : 'Sınırsız', inline: true },
                { name: '🚫 Yasaklı Türler', value: config.blacklistedTypes?.length > 0 ? config.blacklistedTypes.join(', ') : 'Yok', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleReset(interaction) {
        const db = getDatabase();
        const guildId = interaction.guild.id;

        const defaultConfig = {
            enabled: true,
            taxRate: 0,
            allowGlobal: true,
            minPrice: 1,
            maxPrice: null,
            blacklistedTypes: []
        };

        db.updateServerMarketConfig(guildId, defaultConfig);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🔄 Ayarlar Sıfırlandı')
            .setDescription('Pazar yeri ayarları varsayılan değerlere sıfırlandı.')
            .addFields(
                { name: '✅ Durum', value: 'Açık', inline: true },
                { name: '💸 Vergi', value: '%0', inline: true },
                { name: '🌍 Global', value: 'Açık', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

