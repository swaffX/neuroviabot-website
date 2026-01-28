// ==========================================
// 📊 NeuroViaBot - High-Low Game
// ==========================================
// Sıradaki kart Büyük mü Küçük mü?

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');
const { logger } = require('../utils/logger');

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = [
    { name: '2', value: 2 }, { name: '3', value: 3 }, { name: '4', value: 4 },
    { name: '5', value: 5 }, { name: '6', value: 6 }, { name: '7', value: 7 },
    { name: '8', value: 8 }, { name: '9', value: 9 }, { name: '10', value: 10 },
    { name: 'J', value: 11 }, { name: 'Q', value: 12 }, { name: 'K', value: 13 }, { name: 'A', value: 14 }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('highlow')
        .setDescription('📊 High-Low: Sıradaki kart Büyük mü Küçük mü?')
        .addStringOption(option =>
            option.setName('bahis')
                .setDescription('Bahis miktarı (veya \'all\')')
                .setRequired(true)),

    async execute(interaction) {
        const betInput = interaction.options.getString('bahis');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // User Check
        let user = await NRCUser.findOne({ odasi: userId, odaId: guildId });
        if (!user) {
            user = await NRCUser.create({ odasi: userId, odaId: guildId, username: interaction.user.username });
        }

        let amount = 0;
        if (['all', 'hepsi', 'tümü'].includes(betInput.toLowerCase())) {
            amount = user.balance;
        } else {
            amount = parseInt(betInput);
            if (isNaN(amount)) {
                return interaction.reply({ content: '❌ Geçersiz miktar.', flags: MessageFlags.Ephemeral });
            }
        }

        if (amount <= 0) {
            return interaction.reply({ content: '❌ Yetersiz bakiye!', flags: MessageFlags.Ephemeral });
        }
        if (amount < 20) {
            return interaction.reply({ content: '❌ Minimum 20 NRC bahis yapmalısın.', flags: MessageFlags.Ephemeral });
        }

        if (user.balance < amount) {
            return interaction.reply({
                content: `❌ Yetersiz bakiye! Mevcut: **${user.balance.toLocaleString()}** NRC`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Bakiye Düş
        user.balance -= amount;
        user.stats.totalBets += 1;
        user.stats.gamesPlayed += 1;
        await user.save();

        // OYUN
        let currentMultiplier = 1.0;
        let round = 1;

        // Deste oluştur
        const deck = [];
        SUITS.forEach(s => RANKS.forEach(r => deck.push({ ...r, suit: s })));

        // Karıştır
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        let currentCard = deck.pop();

        const generateEmbed = (status = 'playing', nextCard = null) => {
            const embed = new EmbedBuilder()
                .setTitle(`🃏 HIGH-LOW (Tur: ${round})`)
                .setDescription(`**Bahis:** ${amount.toLocaleString()} NRC | **Çarpan:** ${currentMultiplier.toFixed(2)}x\n\n` +
                    `Mevcut Kart: **${currentCard.suit} ${currentCard.name}** (${currentCard.value})\n` +
                    `\nSıradaki kart bundan **Daha Yüksek (⬆️)** mi yoksa **Daha Düşük (⬇️)** mü?`);

            if (status === 'playing') {
                embed.setColor('#3498db');
            } else if (status === 'win') {
                embed.setTitle('🎉 DOĞRU BİLDİN!');
                embed.setDescription(`Mevcut Kart: **${currentCard.suit} ${currentCard.name}** (${currentCard.value})\nYeni Kart: **${nextCard.suit} ${nextCard.name}** (${nextCard.value})\n\nDevam etmek ister misin?`);
                embed.setColor('#2ecc71');
            } else if (status === 'lose') {
                embed.setTitle('💀 YANLIŞ CEVAP!');
                embed.setDescription(`Mevcut Kart: **${currentCard.suit} ${currentCard.name}** (${currentCard.value})\nYeni Kart: **${nextCard.suit} ${nextCard.name}** (${nextCard.value})\n\n**${amount.toLocaleString()} NRC** kaybettin.`);
                embed.setColor('#e74c3c');
            } else if (status === 'cashout') {
                const winAmt = Math.floor(amount * currentMultiplier);
                embed.setTitle('💰 PARA ÇEKİLDİ');
                embed.setDescription(`Son Kart: **${currentCard.suit} ${currentCard.name}**\n\nKazanılan: **${winAmt.toLocaleString()} NRC**`);
                embed.setColor('#f1c40f');
            }

            embed.setFooter({ text: `${interaction.user.username} • Potansiyel: ${Math.floor(amount * currentMultiplier).toLocaleString()} NRC` });
            return embed;
        };

        const getButtons = (canCashout = false) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hl_lower').setLabel('⬇️ Düşük').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('hl_higher').setLabel('⬆️ Yüksek').setStyle(ButtonStyle.Primary)
            );

            if (canCashout) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('hl_cashout')
                        .setLabel(`💰 Çek: ${Math.floor(amount * currentMultiplier).toLocaleString()} NRC`)
                        .setStyle(ButtonStyle.Success)
                );
            }
            return row;
        };

        await interaction.reply({ embeds: [generateEmbed()], components: [getButtons(round > 1)] });
        const msg = await interaction.fetchReply();

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 120000
        });

        collector.on('collect', async i => {
            if (i.customId === 'hl_cashout') {
                const winAmount = Math.floor(amount * currentMultiplier);

                user.balance += winAmount;
                user.stats.totalWins += 1;
                user.stats.totalEarned += (winAmount - amount);
                user.stats.winStreak += 1;
                if (user.stats.winStreak > user.stats.maxWinStreak) {
                    user.stats.maxWinStreak = user.stats.winStreak;
                }
                await user.save();

                await i.update({ embeds: [generateEmbed('cashout')], components: [] });
                collector.stop();
                return;
            }

            const nextCard = deck.pop();
            const guess = i.customId === 'hl_higher' ? 'high' : 'low';

            let won = false;

            // Eşitlik kontrolü
            if (nextCard.value === currentCard.value) {
                currentCard = nextCard;
                await i.update({
                    content: '⚠️ Kartlar eşitti! (Push - Devam)',
                    embeds: [generateEmbed()],
                    components: [getButtons(round > 1)]
                });
                return;
            }

            if (guess === 'high' && nextCard.value > currentCard.value) won = true;
            else if (guess === 'low' && nextCard.value < currentCard.value) won = true;

            if (won) {
                currentMultiplier *= 1.4;
                round++;
                currentCard = nextCard;

                await i.update({ embeds: [generateEmbed('win', nextCard)], components: [getButtons(true)] });

                // UI update
                setTimeout(async () => {
                    try {
                        await msg.edit({ embeds: [generateEmbed('playing')], components: [getButtons(true)] });
                    } catch (e) { }
                }, 2000);

            } else {
                // Lose
                user.stats.totalLosses += 1;
                user.stats.winStreak = 0;
                await user.save();

                await i.update({ embeds: [generateEmbed('lose', nextCard)], components: [] });
                collector.stop();
            }
        });
    }
};
