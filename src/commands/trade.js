const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('💱 Başka kullanıcılarla NRC trade yap')
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('💸 Trade teklifi gönder')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Trade yapılacak kullanıcı')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Trade edilecek NRC miktarı')
                        .setMinValue(100)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('süre')
                        .setDescription('Trade teklifinin geçerlilik süresi')
                        .addChoices(
                            { name: '5 dakika', value: '5' },
                            { name: '15 dakika', value: '15' },
                            { name: '1 saat', value: '60' },
                            { name: '24 saat', value: '1440' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('📜 Trade geçmişini görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Geçmişi görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reputation')
                .setDescription('⭐ Trade reputasyonunu görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Reputasyonu görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'send':
                    await this.handleSend(interaction);
                    break;
                case 'history':
                    await this.handleHistory(interaction);
                    break;
                case 'reputation':
                    await this.handleReputation(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Trade komut hatası', error, { 
                subcommand, 
                user: interaction.user.id 
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Trade Hatası')
                .setDescription('Trade işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleSend(interaction) {
        const recipient = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');
        const duration = parseInt(interaction.options.getString('süre') || '15');

        // Validations
        if (recipient.bot) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Geçersiz Kullanıcı')
                    .setDescription('Bot kullanıcılarıyla trade yapamazsınız!')
                ],
                ephemeral: true
            });
        }

        if (recipient.id === interaction.user.id) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Geçersiz Trade')
                    .setDescription('Kendinizle trade yapamazsınız!')
                ],
                ephemeral: true
            });
        }

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.wallet < amount) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Yetersiz Bakiye')
                    .setDescription(`Cüzdanınızda yeterli NRC yok!\n\n**Cüzdan:** ${balance.wallet.toLocaleString()} NRC\n**Gerekli:** ${amount.toLocaleString()} NRC`)
                ],
                ephemeral: true
            });
        }

        // Get trading handler
        const tradingHandler = interaction.client.tradingHandler;
        if (!tradingHandler) {
            return interaction.reply({
                content: '❌ Trade sistemi şu anda kullanılamıyor!',
                ephemeral: true
            });
        }

        // Create trade
        const expiresIn = duration * 60 * 1000; // Convert minutes to ms
        const result = await tradingHandler.createTrade(
            interaction.user.id,
            recipient.id,
            amount,
            interaction.guild.id,
            expiresIn
        );

        if (!result.success) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Trade Oluşturulamadı')
                    .setDescription(result.error || 'Bilinmeyen hata')
                ],
                ephemeral: true
            });
        }

        // Send trade offer to recipient
        try {
            const tradeMessage = tradingHandler.createTradeEmbed(
                result.trade,
                interaction.user,
                recipient
            );

            await recipient.send(tradeMessage);

            // Confirm to sender
            const confirmEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('✅ Trade Teklifi Gönderildi')
                .setDescription(`Trade teklifi **${recipient.username}** kullanıcısına gönderildi!`)
                .addFields(
                    { name: '💰 Miktar', value: `${amount.toLocaleString()} NRC`, inline: true },
                    { name: '⏱️ Geçerlilik', value: `${duration} dakika`, inline: true },
                    { name: '📝 Trade ID', value: `\`${result.trade.id}\``, inline: false }
                )
                .setFooter({ text: 'Trade • NeuroCoin' })
                .setTimestamp();

            await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

        } catch (error) {
            // Recipient DMs closed
            await tradingHandler.cancelTrade(result.trade.id);
            
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ DM Gönderilemedi')
                    .setDescription(`${recipient.username} DM'lerini kapatmış. Trade iptal edildi.`)
                ],
                ephemeral: true
            });
        }
    },

    async handleHistory(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Bot kullanıcılarının trade geçmişi yoktur!',
                ephemeral: true
            });
        }

        const tradingHandler = interaction.client.tradingHandler;
        if (!tradingHandler) {
            return interaction.reply({
                content: '❌ Trade sistemi şu anda kullanılamıyor!',
                ephemeral: true
            });
        }

        const history = tradingHandler.getTradeHistory(targetUser.id, 10);

        if (history.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('📜 Trade Geçmişi')
                    .setDescription(`**${targetUser.username}** henüz trade yapmamış!`)
                ],
                ephemeral: true
            });
        }

        let historyText = '';
        for (const trade of history) {
            const date = new Date(trade.createdAt);
            const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            const isSender = trade.senderId === targetUser.id;
            const otherUserId = isSender ? trade.receiverId : trade.senderId;
            const otherUser = await interaction.client.users.fetch(otherUserId).catch(() => null);
            const otherUsername = otherUser ? otherUser.username : 'Bilinmeyen';
            
            const arrow = isSender ? '→' : '←';
            const statusEmoji = {
                'completed': '✅',
                'declined': '❌',
                'cancelled': '🚫',
                'expired': '⏰'
            }[trade.status] || '❓';

            historyText += `${dateStr} ${statusEmoji} ${arrow} **${otherUsername}** - ${trade.amount.toLocaleString()} NRC\n`;
        }

        const historyEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`📜 ${targetUser.username} - Trade Geçmişi`)
            .setDescription(historyText)
            .setFooter({ text: `Son ${history.length} trade • NeuroCoin` })
            .setTimestamp();

        await interaction.reply({ embeds: [historyEmbed] });
    },

    async handleReputation(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Bot kullanıcılarının reputasyonu yoktur!',
                ephemeral: true
            });
        }

        const tradingHandler = interaction.client.tradingHandler;
        if (!tradingHandler) {
            return interaction.reply({
                content: '❌ Trade sistemi şu anda kullanılamıyor!',
                ephemeral: true
            });
        }

        const reputation = tradingHandler.getReputation(targetUser.id);

        const trustLevel = reputation.score >= 50 ? '🟢 Yüksek' :
                          reputation.score >= 20 ? '🟡 Orta' : 
                          reputation.score >= 0 ? '🔴 Düşük' : '⚫ Negatif';

        const reputationEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`⭐ ${targetUser.username} - Trade Reputasyonu`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '📊 Skor', value: `**${reputation.score}**`, inline: true },
                { name: '✅ Tamamlanan', value: `**${reputation.completed}**`, inline: true },
                { name: '🔒 Güven Seviyesi', value: trustLevel, inline: true }
            )
            .setFooter({ text: 'Trade Reputasyonu • NeuroCoin' })
            .setTimestamp();

        await interaction.reply({ embeds: [reputationEmbed] });
    }
};

