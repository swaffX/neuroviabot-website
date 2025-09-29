const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const config = require('../config.json');

// Mağaza ürünleri
const SHOP_ITEMS = {
    'daily_boost': {
        name: '📅 Günlük Boost',
        description: 'Günlük ödülünüzü 2x yapar (3 gün)',
        price: 1000,
        category: 'boost',
        emoji: '📅',
        duration: 3 * 24 * 60 * 60 * 1000 // 3 gün (ms)
    },
    'xp_boost': {
        name: '⚡ XP Boost',
        description: 'XP kazancınızı 1.5x yapar (24 saat)',
        price: 500,
        category: 'boost',
        emoji: '⚡',
        duration: 24 * 60 * 60 * 1000 // 24 saat (ms)
    },
    'lucky_charm': {
        name: '🍀 Şans Tılsımı',
        description: 'Gambling oyunlarında %20 daha fazla kazanç (1 hafta)',
        price: 2000,
        category: 'boost',
        emoji: '🍀',
        duration: 7 * 24 * 60 * 60 * 1000 // 7 gün (ms)
    },
    'vip_badge': {
        name: '👑 VIP Rozeti',
        description: 'Profilinizde VIP rozeti görünsün (kalıcı)',
        price: 5000,
        category: 'cosmetic',
        emoji: '👑',
        permanent: true
    },
    'custom_color': {
        name: '🎨 Özel Renk',
        description: 'Profil embed rengini özelleştir (kalıcı)',
        price: 3000,
        category: 'cosmetic',
        emoji: '🎨',
        permanent: true
    },
    'protection_shield': {
        name: '🛡️ Koruma Kalkanı',
        description: 'Moderasyon işlemlerinden korunma (3 gün)',
        price: 1500,
        category: 'utility',
        emoji: '🛡️',
        duration: 3 * 24 * 60 * 60 * 1000 // 3 gün (ms)
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('🏪 Mağazayı görüntüle ve ürün satın al')
        .addStringOption(option =>
            option.setName('kategori')
                .setDescription('Görüntülenecek kategori')
                .addChoices(
                    { name: '🚀 Boostlar', value: 'boost' },
                    { name: '🎨 Kozmetik', value: 'cosmetic' },
                    { name: '🔧 Araçlar', value: 'utility' },
                    { name: '📦 Tümü', value: 'all' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        const category = interaction.options.getString('kategori') || 'all';

        try {
            await interaction.deferReply();

            // Kullanıcı bilgilerini al
            const guildMember = await GuildMember.findOne({
                where: {
                    userId: interaction.user.id,
                    guildId: interaction.guild.id
                },
                include: [
                    {
                        model: User,
                        as: 'user'
                    }
                ]
            });

            if (!guildMember) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Ekonomi sistemine kayıtlı değilsin!')
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const currentBalance = parseInt(guildMember.balance) || 0;

            // Kategori bazında ürünleri filtrele
            let filteredItems = Object.entries(SHOP_ITEMS);
            if (category !== 'all') {
                filteredItems = filteredItems.filter(([key, item]) => item.category === category);
            }

            // Mağaza embed'i oluştur
            const shopEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🏪 Bot Mağazası')
                .setDescription(`**Mevcut Bakiye:** ${currentBalance.toLocaleString()} coin\n\n**Kategoriler:** Boost, Kozmetik, Araçlar`)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setTimestamp();

            // Kategoriye göre başlık güncelle
            const categoryNames = {
                'boost': '🚀 Boost Ürünleri',
                'cosmetic': '🎨 Kozmetik Ürünler',
                'utility': '🔧 Araç Ürünleri',
                'all': '📦 Tüm Ürünler'
            };

            if (categoryNames[category]) {
                shopEmbed.setTitle(`🏪 Bot Mağazası - ${categoryNames[category]}`);
            }

            // Ürünleri grup halinde göster
            const itemsPerField = 3;
            const itemChunks = [];
            
            for (let i = 0; i < filteredItems.length; i += itemsPerField) {
                itemChunks.push(filteredItems.slice(i, i + itemsPerField));
            }

            itemChunks.forEach((chunk, chunkIndex) => {
                const itemTexts = chunk.map(([key, item]) => {
                    const affordability = currentBalance >= item.price ? '✅' : '❌';
                    const durationText = item.permanent ? '(Kalıcı)' : item.duration ? `(${Math.floor(item.duration / (24 * 60 * 60 * 1000))} gün)` : '';
                    
                    return `${affordability} ${item.emoji} **${item.name}** - ${item.price.toLocaleString()} coin ${durationText}\n${item.description}`;
                });

                shopEmbed.addFields({
                    name: chunkIndex === 0 ? '🛒 Ürünler' : '\u200B',
                    value: itemTexts.join('\n\n'),
                    inline: false
                });
            });

            // Satın alma menüsü oluştur
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('shop_purchase')
                .setPlaceholder('🛒 Satın almak istediğiniz ürünü seçin...')
                .setMinValues(1)
                .setMaxValues(1);

            filteredItems.forEach(([key, item]) => {
                const affordable = currentBalance >= item.price;
                selectMenu.addOptions({
                    label: item.name,
                    description: `${item.price.toLocaleString()} coin - ${item.description.substring(0, 50)}...`,
                    value: key,
                    emoji: item.emoji,
                    default: false
                });
            });

            const actionRow = new ActionRowBuilder().addComponents(selectMenu);

            shopEmbed.addFields({
                name: '💡 Nasıl Satın Alınır?',
                value: '1️⃣ Aşağıdaki menüden ürünü seçin\n2️⃣ Onay verin\n3️⃣ Ürününüz aktifleşir!\n\n**Not:** Aktif boostlarınızı `/inventory` ile görüntüleyebilirsiniz.',
                inline: false
            });

            shopEmbed.setFooter({
                text: `${filteredItems.length} ürün görüntüleniyor • Para kazanmak için /work veya /daily kullanın`,
                iconURL: interaction.user.displayAvatarURL()
            });

            await interaction.editReply({ 
                embeds: [shopEmbed], 
                components: [actionRow] 
            });

        } catch (error) {
            logger.error('Shop komut hatası', error, {
                user: interaction.user.id,
                guild: interaction.guild.id
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Mağaza görüntülenirken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};

// Export shop items for use in other files
module.exports.SHOP_ITEMS = SHOP_ITEMS;
