const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('🎒 Envanterinizi görüntüleyin')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Envanteri görüntülenecek kullanıcı (isteğe bağlı)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        try {
            await interaction.deferReply();

            // Kullanıcı bilgilerini al
            const guildMember = await GuildMember.findOne({
                where: {
                    userId: targetUser.id,
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
                    .setDescription(`${targetUser.username} ekonomi sistemine kayıtlı değil!`)
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Envanter verisini parse et (JSON string olarak saklanıyor)
            let inventory = {};
            try {
                inventory = guildMember.inventory ? JSON.parse(guildMember.inventory) : {};
            } catch (parseError) {
                logger.warn('Inventory parse hatası:', parseError);
                inventory = {};
            }

            // Aktif boostları parse et
            let activeBoosts = {};
            try {
                activeBoosts = guildMember.activeBoosts ? JSON.parse(guildMember.activeBoosts) : {};
            } catch (parseError) {
                logger.warn('ActiveBoosts parse hatası:', parseError);
                activeBoosts = {};
            }

            const currentBalance = parseInt(guildMember.balance) || 0;
            const isOwnInventory = targetUser.id === interaction.user.id;

            // Envanter embed'i oluştur
            const inventoryEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`🎒 ${targetUser.username} - Envanter`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            if (isOwnInventory) {
                inventoryEmbed.setDescription(`**Mevcut Bakiye:** ${currentBalance.toLocaleString()} coin`);
            }

            // Aktif boostları göster
            const now = Date.now();
            const activeBoostsList = [];
            
            Object.entries(activeBoosts).forEach(([boostType, boostData]) => {
                if (boostData.expiresAt > now) {
                    const timeLeft = boostData.expiresAt - now;
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    
                    let timeText = '';
                    if (hours > 0) {
                        timeText = `${hours}s ${minutes}dk`;
                    } else {
                        timeText = `${minutes}dk`;
                    }

                    const boostInfo = getBoostInfo(boostType);
                    activeBoostsList.push(`${boostInfo.emoji} **${boostInfo.name}** - ${timeText} kaldı`);
                }
            });

            if (activeBoostsList.length > 0) {
                inventoryEmbed.addFields({
                    name: '🚀 Aktif Boostlar',
                    value: activeBoostsList.join('\n'),
                    inline: false
                });
            }

            // Kalıcı ürünleri göster
            const permanentItems = [];
            Object.entries(inventory).forEach(([itemKey, quantity]) => {
                if (quantity > 0) {
                    const itemInfo = getPermanentItemInfo(itemKey);
                    if (itemInfo) {
                        permanentItems.push(`${itemInfo.emoji} **${itemInfo.name}** x${quantity}`);
                    }
                }
            });

            if (permanentItems.length > 0) {
                inventoryEmbed.addFields({
                    name: '👑 Kalıcı Ürünler',
                    value: permanentItems.join('\n'),
                    inline: false
                });
            }

            // Genel istatistikler
            const stats = [];
            const totalItems = Object.values(inventory).reduce((sum, quantity) => sum + quantity, 0);
            const activeBoostCount = Object.keys(activeBoosts).filter(key => activeBoosts[key].expiresAt > now).length;
            
            stats.push(`📦 Toplam Ürün: ${totalItems}`);
            stats.push(`⚡ Aktif Boost: ${activeBoostCount}`);
            stats.push(`💰 Toplam Değer: ~${calculateInventoryValue(inventory, activeBoosts).toLocaleString()} coin`);

            inventoryEmbed.addFields({
                name: '📊 Envanter İstatistikleri',
                value: stats.join('\n'),
                inline: true
            });

            // Eğer envanter boşsa
            if (activeBoostsList.length === 0 && permanentItems.length === 0) {
                inventoryEmbed.addFields({
                    name: '📭 Boş Envanter',
                    value: `${isOwnInventory ? 'Henüz hiç ürününüz yok!' : targetUser.username + ' henüz hiç ürün almamış!'}\n\n💡 `/shop` komutuyla mağazayı inceleyin!`,
                    inline: false
                });
            }

            // Kullanım menüsü (sadece kendi envanteri için)
            let components = [];
            if (isOwnInventory && (activeBoostsList.length > 0 || permanentItems.length > 0)) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('inventory_use')
                    .setPlaceholder('🔧 Kullanmak istediğiniz ürünü seçin...')
                    .setMinValues(1)
                    .setMaxValues(1);

                // Kullanılabilir ürünleri menüye ekle
                let hasUsableItems = false;
                
                Object.entries(inventory).forEach(([itemKey, quantity]) => {
                    if (quantity > 0) {
                        const itemInfo = getPermanentItemInfo(itemKey);
                        if (itemInfo && itemInfo.usable) {
                            selectMenu.addOptions({
                                label: itemInfo.name,
                                description: itemInfo.description,
                                value: itemKey,
                                emoji: itemInfo.emoji
                            });
                            hasUsableItems = true;
                        }
                    }
                });

                if (hasUsableItems) {
                    components.push(new ActionRowBuilder().addComponents(selectMenu));
                }
            }

            inventoryEmbed.setFooter({
                text: isOwnInventory ? 
                    'Mağazaya gitmek için /shop kullanın' : 
                    `${targetUser.username} kullanıcısının envanteri`,
                iconURL: targetUser.displayAvatarURL()
            });

            await interaction.editReply({ 
                embeds: [inventoryEmbed],
                components: components
            });

        } catch (error) {
            logger.error('Inventory komut hatası', error, {
                user: interaction.user.id,
                guild: interaction.guild.id,
                targetUser: targetUser.id
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Envanter görüntülenirken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};

// Yardımcı fonksiyonlar
function getBoostInfo(boostType) {
    const boostInfos = {
        'daily_boost': { emoji: '📅', name: 'Günlük Boost' },
        'xp_boost': { emoji: '⚡', name: 'XP Boost' },
        'lucky_charm': { emoji: '🍀', name: 'Şans Tılsımı' },
        'protection_shield': { emoji: '🛡️', name: 'Koruma Kalkanı' }
    };
    
    return boostInfos[boostType] || { emoji: '❓', name: 'Bilinmeyen Boost' };
}

function getPermanentItemInfo(itemKey) {
    const itemInfos = {
        'vip_badge': { 
            emoji: '👑', 
            name: 'VIP Rozeti', 
            description: 'Profilinizde VIP rozeti görüntüler',
            usable: false 
        },
        'custom_color': { 
            emoji: '🎨', 
            name: 'Özel Renk', 
            description: 'Profil embed rengini özelleştirir',
            usable: true 
        }
    };
    
    return itemInfos[itemKey];
}

function calculateInventoryValue(inventory, activeBoosts) {
    let totalValue = 0;
    
    // Kalıcı ürünler için değer hesaplama
    const itemValues = {
        'vip_badge': 5000,
        'custom_color': 3000
    };
    
    Object.entries(inventory).forEach(([itemKey, quantity]) => {
        if (itemValues[itemKey]) {
            totalValue += itemValues[itemKey] * quantity;
        }
    });
    
    // Aktif boostlar için kalan süreye göre değer hesaplama
    const now = Date.now();
    Object.entries(activeBoosts).forEach(([boostType, boostData]) => {
        if (boostData.expiresAt > now) {
            const timeLeft = boostData.expiresAt - now;
            const originalDuration = getOriginalBoostDuration(boostType);
            const remainingRatio = timeLeft / originalDuration;
            const originalPrice = getOriginalBoostPrice(boostType);
            totalValue += Math.floor(originalPrice * remainingRatio);
        }
    });
    
    return totalValue;
}

function getOriginalBoostDuration(boostType) {
    const durations = {
        'daily_boost': 3 * 24 * 60 * 60 * 1000, // 3 gün
        'xp_boost': 24 * 60 * 60 * 1000, // 24 saat
        'lucky_charm': 7 * 24 * 60 * 60 * 1000, // 7 gün
        'protection_shield': 3 * 24 * 60 * 60 * 1000 // 3 gün
    };
    
    return durations[boostType] || 24 * 60 * 60 * 1000;
}

function getOriginalBoostPrice(boostType) {
    const prices = {
        'daily_boost': 1000,
        'xp_boost': 500,
        'lucky_charm': 2000,
        'protection_shield': 1500
    };
    
    return prices[boostType] || 100;
}
