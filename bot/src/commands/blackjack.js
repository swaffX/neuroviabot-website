// ==========================================
// 🃏 NeuroViaBot - Blackjack Command
// ==========================================
// Krupiyeyi yen, 21'e ulaş!

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');
const { logger } = require('../utils/logger');

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('🃏 Blackjack (21) Oyna')
        .addStringOption(option =>
            option.setName('bahis')
                .setDescription('Bahis miktarı (veya \'all\')')
                .setRequired(true)),

    async execute(interaction) {
        const betInput = interaction.options.getString('bahis');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let user = await NRCUser.findOne({ odasi: userId, odaId: guildId });
        if (!user) {
            user = await NRCUser.create({ odasi: userId, odaId: guildId, username: interaction.user.username });
        }

        let amount = 0;
        if (['all', 'hepsi', 'tümü'].includes(betInput.toLowerCase())) {
            amount = user.balance;
        } else {
            amount = parseInt(betInput);
            if (isNaN(amount) || amount < 20) {
                return interaction.reply({
                    content: '❌ Minimum 20 NRC.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        if (amount <= 0 || user.balance < amount) {
            return interaction.reply({
                content: `❌ Yetersiz bakiye! Mevcut: **${user.balance.toLocaleString()}** NRC`,
                flags: MessageFlags.Ephemeral
            });
        }

        user.balance -= amount;
        user.stats.totalBets += 1;
        user.stats.gamesPlayed += 1;
        await user.save();

        // OYUN FONKSİYONLARI
        const createDeck = () => {
            const deck = [];
            for (const suit of SUITS) {
                for (const value of VALUES) {
                    deck.push({ suit, value });
                }
            }
            return deck;
        };

        const calculateScore = (hand) => {
            let score = 0;
            let aces = 0;

            for (const card of hand) {
                if (['J', 'Q', 'K'].includes(card.value)) {
                    score += 10;
                } else if (card.value === 'A') {
                    aces += 1;
                    score += 11;
                } else {
                    score += parseInt(card.value);
                }
            }

            while (score > 21 && aces > 0) {
                score -= 10;
                aces -= 1;
            }
            return score;
        };

        const deck = createDeck();
        // Basit karıştırma (shuffle)
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        let gameEnded = false;

        const generateEmbed = (revealDealer = false, result = null) => {
            const playerScore = calculateScore(playerHand);
            const dealerScore = calculateScore(dealerHand);

            // Dealer kartlarını gösterimi
            const dealerCards = revealDealer
                ? dealerHand.map(c => `[${c.suit} ${c.value}]`).join(' ')
                : `[${dealerHand[0].suit} ${dealerHand[0].value}] [?]`;

            const dealerScoreDisplay = revealDealer ? dealerScore : '?';

            const playerCards = playerHand.map(c => `[${c.suit} ${c.value}]`).join(' ');

            const embed = new EmbedBuilder()
                .setTitle('🃏 Blackjack')
                .addFields(
                    { name: `Senin Elin (${playerScore})`, value: `\`\`\`${playerCards}\`\`\``, inline: true },
                    { name: `Krupiye (${dealerScoreDisplay})`, value: `\`\`\`${dealerCards}\`\`\``, inline: true }
                )
                .setFooter({ text: `Bahis: ${amount.toLocaleString()} NRC • ${interaction.user.username}` });

            if (result === 'WIN') {
                embed.setColor('#2ecc71').setDescription(`🎉 **KAZANDIN!**\n**${(amount * 2).toLocaleString()} NRC** kazandın.`);
            } else if (result === 'LOSE') {
                embed.setColor('#e74c3c').setDescription(`💀 **KAYBETTİN!**\n**${amount.toLocaleString()} NRC** kaybettin.`);
            } else if (result === 'PUSH') {
                embed.setColor('#f1c40f').setDescription(`🤝 **BERABERE!**\nBahsin iade edildi.`);
            } else if (result === 'BLACKJACK') {
                embed.setColor('#9b59b6').setDescription(`👑 **BLACKJACK!**\n**${Math.floor(amount * 2.5).toLocaleString()} NRC** kazandın!`);
            } else {
                embed.setColor('#3498db').setDescription('Ne yapmak istersin?');
            }

            return embed;
        };

        // Kontrol butonları
        const getButtons = (disabled = false) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit (Kart Çek)').setStyle(ButtonStyle.Primary).setDisabled(disabled),
                new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand (Dur)').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
                new ButtonBuilder().setCustomId('bj_double').setLabel('Double (İkiye Katla)').setStyle(ButtonStyle.Success).setDisabled(disabled || playerHand.length > 2 || user.balance < amount)
            );
        };

        // Otomatik Blackjack kontrolü
        const pScore = calculateScore(playerHand);
        if (pScore === 21) {
            const dScore = calculateScore(dealerHand);
            if (dScore === 21) {
                // Berabere
                user.balance += amount;
                await user.save();
                return interaction.reply({ embeds: [generateEmbed(true, 'PUSH')] });
            } else {
                // Blackjack
                const winAmount = Math.floor(amount * 2.5);
                user.balance += winAmount;
                user.stats.totalWins += 1;
                user.stats.totalEarned += (winAmount - amount);
                await user.save();
                return interaction.reply({ embeds: [generateEmbed(true, 'BLACKJACK')] });
            }
        }

        await interaction.reply({ embeds: [generateEmbed()], components: [getButtons()] });
        const msg = await interaction.fetchReply();

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 60000
        });

        collector.on('collect', async i => {
            if (gameEnded) return;

            const action = i.customId;

            if (action === 'bj_hit') {
                playerHand.push(deck.pop());
                const score = calculateScore(playerHand);

                if (score > 21) {
                    gameEnded = true;
                    user.stats.totalLosses += 1;
                    user.stats.winStreak = 0;
                    await user.save();
                    await i.update({ embeds: [generateEmbed(true, 'LOSE')], components: [] });
                    collector.stop();
                } else {
                    await i.update({ embeds: [generateEmbed()], components: [getButtons()] });
                }

            } else if (action === 'bj_stand') {
                gameEnded = true;
                let dScore = calculateScore(dealerHand);

                // Dealer 17'ye kadar çeker
                while (dScore < 17) {
                    dealerHand.push(deck.pop());
                    dScore = calculateScore(dealerHand);
                }

                const finalPScore = calculateScore(playerHand);
                let result = '';
                let winAmount = 0;

                if (dScore > 21 || finalPScore > dScore) {
                    result = 'WIN';
                    winAmount = amount * 2;
                } else if (dScore > finalPScore) {
                    result = 'LOSE';
                } else {
                    result = 'PUSH';
                    winAmount = amount;
                }

                if (result === 'WIN') {
                    user.balance += winAmount;
                    user.stats.totalWins += 1;
                    user.stats.totalEarned += (winAmount - amount);
                    user.stats.winStreak += 1;
                    if (user.stats.winStreak > user.stats.maxWinStreak) user.stats.maxWinStreak = user.stats.winStreak;
                } else if (result === 'PUSH') {
                    user.balance += amount;
                } else {
                    user.stats.totalLosses += 1;
                    user.stats.winStreak = 0;
                }
                await user.save();

                await i.update({ embeds: [generateEmbed(true, result)], components: [] });
                collector.stop();

            } else if (action === 'bj_double') {
                // Double Logic
                if (user.balance < amount) return i.reply({ content: 'Yetersiz bakiye!', flags: MessageFlags.Ephemeral });

                user.balance -= amount; // Ekstra bahis
                amount *= 2;
                await user.save();

                playerHand.push(deck.pop());

                gameEnded = true;
                // Tek karttan sonra otomatik stand
                let dScore = calculateScore(dealerHand);
                while (dScore < 17) {
                    dealerHand.push(deck.pop());
                    dScore = calculateScore(dealerHand);
                }

                const finalPScore = calculateScore(playerHand);
                let result = '';
                let winAmount = 0;

                if (finalPScore > 21) {
                    result = 'LOSE';
                } else if (dScore > 21 || finalPScore > dScore) {
                    result = 'WIN';
                    winAmount = amount * 2;
                } else if (dScore > finalPScore) {
                    result = 'LOSE';
                } else {
                    result = 'PUSH';
                    winAmount = amount;
                }

                if (result === 'WIN') {
                    user.balance += winAmount;
                    user.stats.totalWins += 1;
                    user.stats.totalEarned += (winAmount - amount);
                } else if (result === 'PUSH') {
                    user.balance += amount;
                }
                await user.save();

                await i.update({ embeds: [generateEmbed(true, result)], components: [] });
                collector.stop();
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time' && !gameEnded) {
                // Zaman aşımı - Lose kabul et
                await msg.edit({ content: '⏱️ Süre doldu!', components: [] });
            }
        });
    }
};
