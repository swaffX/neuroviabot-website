const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const { SHOP_ITEMS } = require('./shop.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('🛒 Mağazadan ürün satın al')
        .addStringOption(option => {
            const choices = Object.keys(SHOP_ITEMS).slice(0, 25).map(key => ({
                name: SHOP_ITEMS[key].name,
                value: key
            }));
            
            return option.setName('ürün')
                .setDescription('Satın alınacak ürün')
                .addChoices(...choices)
                .setRequired(true);
        })
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Satın alınacak miktar (varsayılan: 1)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        ),

    async execute(interaction) {
        const itemId = interaction.options.getString('ürün');
        const quantity = interaction.options.getInteger('miktar') || 1;

        try {
            await interaction.deferReply();

            // Ürün var mı kontrol et
            const item = SHOP_ITEMS[itemId];
            if (!item) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Ürün Bulunamadı')
                    .setDescription('Belirtilen ürün mağazada mevcut değil!')
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

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
            const totalCost = item.price * quantity;

            // Bakiye kontrolü
            if (currentBalance < totalCost) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetersiz Bakiye')
                    .setDescription(`Bu ürün için yeterli paran yok!\n\n**Gerekli:** ${totalCost.toLocaleString()} coin\n**Mevcut:** ${currentBalance.toLocaleString()} coin\n**Eksik:** ${(totalCost - currentBalance).toLocaleString()} coin`)
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Kalıcı ürün tekrar satın alma kontrolü (sadece 1 tane alınabilir)
            if (item.permanent && quantity > 1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4500')
                    .setTitle('⚠️ Uyarı')
                    .setDescription('Kalıcı ürünlerden sadece 1 tane satın alabilirsiniz!')
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Zaten sahip olduğu kalıcı ürünü tekrar alma kontrolü
            if (item.permanent) {
                let inventory = {};
                try {
                    inventory = guildMember.inventory ? JSON.parse(guildMember.inventory) : {};
                } catch (parseError) {
                    inventory = {};
                }

                if (inventory[itemId] && inventory[itemId] > 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4500')
                        .setTitle('⚠️ Zaten Sahipsiniz')
                        .setDescription(`Bu kalıcı ürüne zaten sahipsiniz: ${item.emoji} **${item.name}**`)
                        .setTimestamp();
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
            }

            // Satın alma onayı
            const confirmEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🛒 Satın Alma Onayı')
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    {
                        name: '🛍️ Ürün',
                        value: `${item.emoji} **${item.name}**`,
                        inline: true
                    },
                    {
                        name: '📦 Miktar',
                        value: quantity.toString(),
                        inline: true
                    },
                    {
                        name: '💰 Toplam Fiyat',
                        value: `${totalCost.toLocaleString()} coin`,
                        inline: true
                    },
                    {
                        name: '📝 Açıklama',
                        value: item.description,
                        inline: false
                    }
                );

            if (item.duration && !item.permanent) {
                const days = Math.floor(item.duration / (24 * 60 * 60 * 1000));
                confirmEmbed.addFields({
                    name: '⏰ Süre',
                    value: `${days} gün`,
                    inline: true
                });
            } else if (item.permanent) {
                confirmEmbed.addFields({
                    name: '♾️ Süre',
                    value: 'Kalıcı',
                    inline: true
                });
            }

            confirmEmbed.addFields(
                {
                    name: '💳 Mevcut Bakiye',
                    value: `${currentBalance.toLocaleString()} coin`,
                    inline: true
                },
                {
                    name: '💸 Kalan Bakiye',
                    value: `${(currentBalance - totalCost).toLocaleString()} coin`,
                    inline: true
                }
            );

            const confirmButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buy_confirm_${itemId}_${quantity}`)
                        .setLabel('✅ Satın Al')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('buy_cancel')
                        .setLabel('❌ İptal')
                        .setStyle(ButtonStyle.Danger)
                );

            confirmEmbed.setFooter({
                text: 'Bu işlemi onaylamak için butona tıklayın',
                iconURL: interaction.user.displayAvatarURL()
            });

            await interaction.editReply({ 
                embeds: [confirmEmbed], 
                components: [confirmButtons] 
            });

        } catch (error) {
            logger.error('Buy komut hatası', error, {
                user: interaction.user.id,
                guild: interaction.guild.id,
                itemId: itemId,
                quantity: quantity
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Ürün satın alınırken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};

// Satın alma işlemini tamamlayan fonksiyon (button interaction handler için)
async function completePurchase(interaction, itemId, quantity) {
    try {
        const item = SHOP_ITEMS[itemId];
        const totalCost = item.price * quantity;

        // Kullanıcı bilgilerini tekrar al
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

        const currentBalance = parseInt(guildMember.balance) || 0;

        // Son bakiye kontrolü
        if (currentBalance < totalCost) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetersiz Bakiye')
                .setDescription('Satın alma sırasında bakiye yetersiz hale geldi!')
                .setTimestamp();
            return interaction.update({ embeds: [errorEmbed], components: [] });
        }

        // Bakiyeyi düş
        const newBalance = currentBalance - totalCost;

        // Ürünü envantere ekle veya boost olarak aktifleştir
        let updateData = { balance: newBalance };

        if (item.permanent) {
            // Kalıcı ürün - envantere ekle
            let inventory = {};
            try {
                inventory = guildMember.inventory ? JSON.parse(guildMember.inventory) : {};
            } catch (parseError) {
                inventory = {};
            }

            inventory[itemId] = (inventory[itemId] || 0) + quantity;
            updateData.inventory = JSON.stringify(inventory);
        } else {
            // Geçici boost - aktif boostlara ekle
            let activeBoosts = {};
            try {
                activeBoosts = guildMember.activeBoosts ? JSON.parse(guildMember.activeBoosts) : {};
            } catch (parseError) {
                activeBoosts = {};
            }

            const now = Date.now();
            const expiresAt = now + (item.duration * quantity); // Birden fazla alınırsa süre uzar

            activeBoosts[itemId] = {
                expiresAt: expiresAt,
                purchasedAt: now,
                quantity: quantity
            };

            updateData.activeBoosts = JSON.stringify(activeBoosts);
        }

        // Veritabanını güncelle
        await guildMember.update(updateData);

        // Başarı mesajı
        const successEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Satın Alma Başarılı!')
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                {
                    name: '🎉 Satın Aldığınız Ürün',
                    value: `${item.emoji} **${item.name}** x${quantity}`,
                    inline: false
                },
                {
                    name: '💸 Ödenen Tutar',
                    value: `${totalCost.toLocaleString()} coin`,
                    inline: true
                },
                {
                    name: '💳 Yeni Bakiye',
                    value: `${newBalance.toLocaleString()} coin`,
                    inline: true
                }
            );

        if (item.permanent) {
            successEmbed.addFields({
                name: '♾️ Durum',
                value: 'Kalıcı ürün envanterinize eklendi!\n`/inventory` ile görüntüleyebilirsiniz.',
                inline: false
            });
        } else {
            const days = Math.floor(item.duration / (24 * 60 * 60 * 1000));
            successEmbed.addFields({
                name: '⏰ Aktif Süre',
                value: `${days * quantity} gün boyunca aktif!\n`/inventory` ile takip edebilirsiniz.`,
                inline: false
            });
        }

        // Real-time güncelleme gönder
        if (global.realtimeUpdates) {
            global.realtimeUpdates.economyUpdate(interaction.guild.id, interaction.user.id, {
                type: 'item_purchase',
                itemId: itemId,
                itemName: item.name,
                quantity: quantity,
                cost: totalCost,
                newBalance: newBalance,
                user: {
                    id: interaction.user.id,
                    username: interaction.user.username,
                    avatar: interaction.user.displayAvatarURL()
                }
            });
        }

        successEmbed.setTimestamp()
            .setFooter({
                text: 'Alışverişiniz için teşekkürler! 🛍️',
                iconURL: interaction.user.displayAvatarURL()
            });

        await interaction.update({ embeds: [successEmbed], components: [] });

        logger.info(`Item satın alma: ${interaction.user.username} - ${item.name} x${quantity}`, {
            user: interaction.user.id,
            guild: interaction.guild.id,
            itemId: itemId,
            quantity: quantity,
            cost: totalCost,
            newBalance: newBalance
        });

    } catch (error) {
        logger.error('Purchase completion hatası', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Satın Alma Hatası')
            .setDescription('Satın alma tamamlanırken bir hata oluştu!')
            .setTimestamp();

        await interaction.update({ embeds: [errorEmbed], components: [] });
    }
}

// Export for button handlers
module.exports.completePurchase = completePurchase;
