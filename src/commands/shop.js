const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

// 🏪 NRC Shop Items - Phase 3 Complete
const SHOP_ITEMS = {
    // === Profile Customization (50-500 NRC) ===
    'verified_badge': {
        name: '✅ Verified Badge',
        description: 'Profilinizde doğrulanmış rozeti (kalıcı)',
        price: 500,
        category: 'cosmetic',
        emoji: '✅',
        permanent: true,
        type: 'badge'
    },
    'og_badge': {
        name: '🔥 OG Badge',
        description: 'Eski kullanıcı rozeti (kalıcı)',
        price: 1000,
        category: 'cosmetic',
        emoji: '🔥',
        permanent: true,
        type: 'badge'
    },
    'whale_badge': {
        name: '🐋 Whale Badge',
        description: 'Zengin kullanıcı rozeti (kalıcı)',
        price: 5000,
        category: 'cosmetic',
        emoji: '🐋',
        permanent: true,
        type: 'badge'
    },
    'trader_badge': {
        name: '💱 Trader Badge',
        description: 'Aktif trader rozeti (kalıcı)',
        price: 2000,
        category: 'cosmetic',
        emoji: '💱',
        permanent: true,
        type: 'badge'
    },
    'rainbow_name': {
        name: '🌈 Rainbow Name',
        description: 'İsim rengi gökkuşağı efekti (kalıcı)',
        price: 3000,
        category: 'cosmetic',
        emoji: '🌈',
        permanent: true,
        type: 'name_effect'
    },
    'glow_name': {
        name: '✨ Glow Name',
        description: 'İsim parlama efekti (kalıcı)',
        price: 2500,
        category: 'cosmetic',
        emoji: '✨',
        permanent: true,
        type: 'name_effect'
    },
    'profile_banner_space': {
        name: '🌌 Space Banner',
        description: 'Uzay temalı profil banner (kalıcı)',
        price: 4000,
        category: 'cosmetic',
        emoji: '🌌',
        permanent: true,
        type: 'banner'
    },
    'profile_banner_neon': {
        name: '💜 Neon Banner',
        description: 'Neon temalı profil banner (kalıcı)',
        price: 4000,
        category: 'cosmetic',
        emoji: '💜',
        permanent: true,
        type: 'banner'
    },

    // === Server Boosts (1000-5000 NRC) ===
    'xp_boost_24h': {
        name: '⚡ XP Boost 24h',
        description: 'Sunucu XP kazancını 1.5x yapar (24 saat)',
        price: 1000,
        category: 'boost',
        emoji: '⚡',
        duration: 24 * 60 * 60 * 1000,
        type: 'xp_multiplier',
        multiplier: 1.5
    },
    'xp_boost_7d': {
        name: '⚡ XP Boost 7d',
        description: 'Sunucu XP kazancını 2x yapar (7 gün)',
        price: 5000,
        category: 'boost',
        emoji: '⚡',
        duration: 7 * 24 * 60 * 60 * 1000,
        type: 'xp_multiplier',
        multiplier: 2
    },
    'nrc_boost_12h': {
        name: '💰 NRC Boost 12h',
        description: 'Sunucu NRC kazancını 2x yapar (12 saat)',
        price: 2000,
        category: 'boost',
        emoji: '💰',
        duration: 12 * 60 * 60 * 1000,
        type: 'nrc_multiplier',
        multiplier: 2
    },
    'nrc_boost_48h': {
        name: '💰 NRC Boost 48h',
        description: 'Sunucu NRC kazancını 2x yapar (48 saat)',
        price: 7000,
        category: 'boost',
        emoji: '💰',
        duration: 48 * 60 * 60 * 1000,
        type: 'nrc_multiplier',
        multiplier: 2
    },
    'emoji_slots': {
        name: '😊 +10 Emoji Slots',
        description: 'Sunucuya 10 ekstra emoji slotu (7 gün)',
        price: 3000,
        category: 'boost',
        emoji: '😊',
        duration: 7 * 24 * 60 * 60 * 1000,
        type: 'feature_unlock'
    },

    // === Exclusive Features (500-10000 NRC) ===
    'custom_command_slots': {
        name: '⚙️ +5 Custom Commands',
        description: 'Ekstra 5 özel komut slotu (kalıcı)',
        price: 5000,
        category: 'feature',
        emoji: '⚙️',
        permanent: true,
        type: 'feature_unlock'
    },
    'quest_slots': {
        name: '📋 +3 Quest Slots',
        description: 'Aynı anda 3 ekstra quest (kalıcı)',
        price: 3000,
        category: 'feature',
        emoji: '📋',
        permanent: true,
        type: 'feature_unlock'
    },
    'inventory_expansion': {
        name: '🎒 +25 Inventory Slots',
        description: 'Envanter kapasitesi +25 slot (kalıcı)',
        price: 2500,
        category: 'feature',
        emoji: '🎒',
        permanent: true,
        type: 'feature_unlock'
    },
    'private_marketplace': {
        name: '🔒 Private Marketplace',
        description: 'Özel marketplace erişimi (30 gün)',
        price: 10000,
        category: 'feature',
        emoji: '🔒',
        duration: 30 * 24 * 60 * 60 * 1000,
        type: 'feature_unlock'
    },
    'cooldown_reduction': {
        name: '⏱️ Cooldown -50%',
        description: 'Komut bekleme süreleri %50 azalır (7 gün)',
        price: 4000,
        category: 'feature',
        emoji: '⏱️',
        duration: 7 * 24 * 60 * 60 * 1000,
        type: 'feature_unlock'
    },

    // === Collectibles & Limited Items ===
    'lucky_charm': {
        name: '🍀 Lucky Charm',
        description: 'Gambling kazancı %20 artar (7 gün)',
        price: 2000,
        category: 'collectible',
        emoji: '🍀',
        duration: 7 * 24 * 60 * 60 * 1000,
        type: 'gambling_boost'
    },
    'golden_ticket': {
        name: '🎫 Golden Ticket',
        description: 'Özel event\'lere erişim (tek kullanımlık)',
        price: 15000,
        category: 'collectible',
        emoji: '🎫',
        permanent: false,
        type: 'event_access'
    },
    'legendary_card': {
        name: '🃏 Legendary Card',
        description: 'Efsanevi koleksiyon kartı (kalıcı)',
        price: 25000,
        category: 'collectible',
        emoji: '🃏',
        permanent: true,
        type: 'collectible',
        rarity: 'legendary'
    },

    // === Utility Items ===
    'name_change': {
        name: '📝 Name Change Token',
        description: 'Bir kez isim değiştirme hakkı',
        price: 1500,
        category: 'utility',
        emoji: '📝',
        type: 'consumable'
    },
    'protection_shield': {
        name: '🛡️ Protection Shield',
        description: 'Moderasyon işlemlerinden korunma (3 gün)',
        price: 5000,
        category: 'utility',
        emoji: '🛡️',
        duration: 3 * 24 * 60 * 60 * 1000,
        type: 'protection'
    },
    'double_daily': {
        name: '🎁 Double Daily',
        description: 'Günlük ödül 2x (1 kullanım)',
        price: 800,
        category: 'utility',
        emoji: '🎁',
        type: 'consumable'
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
                    { name: '⚙️ Özellikler', value: 'feature' },
                    { name: '🃏 Koleksiyon', value: 'collectible' },
                    { name: '🔧 Araçlar', value: 'utility' },
                    { name: '📦 Tümü', value: 'all' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        const category = interaction.options.getString('kategori') || 'all';

        try {
            await interaction.deferReply();

            // NRC bakiyesini al
            const db = getDatabase();
            const balance = db.getNeuroCoinBalance(interaction.user.id);
            const currentBalance = balance.wallet;

            // Kategori bazında ürünleri filtrele
            let filteredItems = Object.entries(SHOP_ITEMS);
            if (category !== 'all') {
                filteredItems = filteredItems.filter(([key, item]) => item.category === category);
            }

            // Mağaza embed'i oluştur
            const shopEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('🏪 NRC Shop - The Neural Currency Store')
                .setDescription(`**💳 Cüzdan Bakiyesi:** ${currentBalance.toLocaleString()} NRC\n**🏦 Banka Bakiyesi:** ${balance.bank.toLocaleString()} NRC\n\n**Kategoriler:** Boost, Kozmetik, Özellikler, Koleksiyon, Araçlar`)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setTimestamp();

            // Kategoriye göre başlık güncelle
            const categoryNames = {
                'boost': '🚀 Boost Ürünleri',
                'cosmetic': '🎨 Kozmetik Ürünler',
                'feature': '⚙️ Özel Özellikler',
                'collectible': '🃏 Koleksiyon Ürünleri',
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
                    const rarityText = item.rarity ? ` | ${item.rarity.toUpperCase()}` : '';
                    
                    return `${affordability} ${item.emoji} **${item.name}** - ${item.price.toLocaleString()} NRC ${durationText}${rarityText}\n${item.description}`;
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
                    description: `${item.price.toLocaleString()} NRC - ${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}`,
                    value: key,
                    emoji: item.emoji,
                    default: false
                });
            });

            const actionRow = new ActionRowBuilder().addComponents(selectMenu);

            shopEmbed.addFields({
                name: '💡 Nasıl Satın Alınır?',
                value: '1️⃣ Aşağıdaki menüden ürünü seçin\n2️⃣ Onay verin\n3️⃣ Ürününüz aktifleşir!\n\n**📋 Envanteriniz:** `/inventory`\n**💰 NRC Kazanın:** `/economy daily` veya `/economy work`',
                inline: false
            });

            shopEmbed.setFooter({
                text: `${filteredItems.length} ürün • The Neural Currency of Discord`,
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
                .setColor('#8B5CF6')
                .setTitle('❌ Hata')
                .setDescription('Mağaza görüntülenirken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Handle shop purchase (called from interaction collector)
    async handlePurchase(interaction, itemKey) {
        const item = SHOP_ITEMS[itemKey];
        if (!item) {
            return interaction.reply({
                content: '❌ Ürün bulunamadı!',
                ephemeral: true
            });
        }

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.wallet < item.price) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Yetersiz Bakiye')
                    .setDescription(`Bu ürünü satın almak için yeterli NRC yok!\n\n**Fiyat:** ${item.price.toLocaleString()} NRC\n**Bakiye:** ${balance.wallet.toLocaleString()} NRC`)
                ],
                ephemeral: true
            });
        }

        // Deduct NRC
        db.updateNeuroCoinBalance(interaction.user.id, -item.price, 'wallet');

        // Add item to inventory
        const inventory = db.data.userInventory.get(interaction.user.id) || [];
        const purchaseDate = new Date().toISOString();
        
        inventory.push({
            itemKey,
            ...item,
            purchasedAt: purchaseDate,
            expiresAt: item.duration ? new Date(Date.now() + item.duration).toISOString() : null,
            active: true
        });
        
        db.data.userInventory.set(interaction.user.id, inventory);

        // Record transaction
        db.recordTransaction(interaction.user.id, 'shop', item.price, 'shop_purchase', {
            itemKey,
            itemName: item.name
        });

        db.saveData();

        const newBalance = db.getNeuroCoinBalance(interaction.user.id);

        const purchaseEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Satın Alma Başarılı!')
            .setDescription(`**${item.name}** satın aldınız!`)
            .addFields(
                { name: '💰 Ödenen', value: `${item.price.toLocaleString()} NRC`, inline: true },
                { name: '💵 Kalan Bakiye', value: `${newBalance.wallet.toLocaleString()} NRC`, inline: true },
                { name: '📦 Ürün', value: item.description, inline: false }
            )
            .setFooter({ text: 'NRC Shop • The Neural Currency of Discord' })
            .setTimestamp();

        if (item.duration && !item.permanent) {
            const expiresAt = new Date(Date.now() + item.duration);
            purchaseEmbed.addFields({
                name: '⏱️ Geçerlilik',
                value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R> sona erecek`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [purchaseEmbed], ephemeral: true });
    }
};

// Export shop items for use in other files
module.exports.SHOP_ITEMS = SHOP_ITEMS;
