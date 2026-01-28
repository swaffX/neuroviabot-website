const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

const TICKET_PRICE = 100;
const STARTING_JACKPOT = 10000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('🎟️ Loto oyna ve büyük ikramiye kazan!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('🎫 Bilet satın al')
                .addIntegerOption(option =>
                    option.setName('sayı1')
                        .setDescription('1. sayı (1-49)')
                        .setMinValue(1)
                        .setMaxValue(49)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('sayı2')
                        .setDescription('2. sayı (1-49)')
                        .setMinValue(1)
                        .setMaxValue(49)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('sayı3')
                        .setDescription('3. sayı (1-49)')
                        .setMinValue(1)
                        .setMaxValue(49)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('sayı4')
                        .setDescription('4. sayı (1-49)')
                        .setMinValue(1)
                        .setMaxValue(49)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('sayı5')
                        .setDescription('5. sayı (1-49)')
                        .setMinValue(1)
                        .setMaxValue(49)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('sayı6')
                        .setDescription('6. sayı (1-49)')
                        .setMinValue(1)
                        .setMaxValue(49)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('draw')
                .setDescription('🎲 Çekiliş yap (Admin)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('ℹ️ Loto bilgisi')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'buy':
                await this.handleBuy(interaction);
                break;
            case 'draw':
                await this.handleDraw(interaction);
                break;
            case 'info':
                await this.handleInfo(interaction);
                break;
        }
    },

    async handleBuy(interaction) {
        const numbers = [
            interaction.options.getInteger('sayı1'),
            interaction.options.getInteger('sayı2'),
            interaction.options.getInteger('sayı3'),
            interaction.options.getInteger('sayı4'),
            interaction.options.getInteger('sayı5'),
            interaction.options.getInteger('sayı6')
        ].sort((a, b) => a - b);

        // Check for duplicates
        if (new Set(numbers).size !== 6) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Hata')
                    .setDescription('Tüm sayılar farklı olmalıdır!')],
                ephemeral: true
            });
        }

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.wallet < TICKET_PRICE) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Yetersiz Bakiye')
                    .setDescription(`Bilet almak için yeterli NRC yok!\n\n**Gerekli:** ${TICKET_PRICE} NRC\n**Bakiye:** ${balance.wallet.toLocaleString()} NRC`)],
                ephemeral: true
            });
        }

        // Deduct ticket price
        db.updateNeuroCoinBalance(interaction.user.id, -TICKET_PRICE, 'wallet');

        // Store ticket
        if (!db.data.lotteryTickets) db.data.lotteryTickets = new Map();
        const tickets = db.data.lotteryTickets.get(interaction.user.id) || [];
        tickets.push({
            numbers,
            purchasedAt: new Date().toISOString()
        });
        db.data.lotteryTickets.set(interaction.user.id, tickets);

        // Add to jackpot
        if (!db.data.lotteryJackpot) db.data.lotteryJackpot = STARTING_JACKPOT;
        db.data.lotteryJackpot += TICKET_PRICE;

        db.saveData();

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🎫 Bilet Satın Alındı!')
            .setDescription(`Sayılarınız: **${numbers.join(', ')}**`)
            .addFields(
                { name: '💰 Ödenen', value: `${TICKET_PRICE} NRC`, inline: true },
                { name: '🎰 İkramiye', value: `${db.data.lotteryJackpot.toLocaleString()} NRC`, inline: true },
                { name: '🎟️ Biletleriniz', value: `${tickets.length}`, inline: true }
            )
            .setFooter({ text: 'Çekiliş için /lottery draw komutunu bekleyin!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleDraw(interaction) {
        // Admin check
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Yetki Hatası')
                    .setDescription('Bu komutu kullanmak için yönetici olmalısınız!')],
                ephemeral: true
            });
        }

        const db = getDatabase();
        if (!db.data.lotteryTickets || db.data.lotteryTickets.size === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Bilet Yok')
                    .setDescription('Henüz hiç bilet satın alınmadı!')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        // Draw winning numbers
        const winningNumbers = [];
        while (winningNumbers.length < 6) {
            const num = Math.floor(Math.random() * 49) + 1;
            if (!winningNumbers.includes(num)) {
                winningNumbers.push(num);
            }
        }
        winningNumbers.sort((a, b) => a - b);

        // Check winners
        const winners = [];
        for (const [userId, tickets] of db.data.lotteryTickets) {
            for (const ticket of tickets) {
                const matches = ticket.numbers.filter(n => winningNumbers.includes(n)).length;
                if (matches >= 3) {
                    winners.push({ userId, matches, numbers: ticket.numbers });
                }
            }
        }

        const jackpot = db.data.lotteryJackpot || STARTING_JACKPOT;
        let resultText = '';

        if (winners.length === 0) {
            resultText = '😢 Bu çekilişte kazanan olmadı! İkramiye bir sonraki çekilişe devredildi.';
        } else {
            // Sort by matches
            winners.sort((a, b) => b.matches - a.matches);
            
            // Distribute jackpot
            const topMatches = winners[0].matches;
            const topWinners = winners.filter(w => w.matches === topMatches);
            const prizePerWinner = Math.floor(jackpot / topWinners.length);

            for (const winner of topWinners) {
                db.updateNeuroCoinBalance(winner.userId, prizePerWinner, 'wallet');
                db.recordTransaction('system', winner.userId, prizePerWinner, 'lottery_win', {
                    matches: winner.matches,
                    numbers: winner.numbers
                });
            }

            resultText = `🎉 **${topWinners.length} kazanan!**\n\n`;
            for (const winner of topWinners) {
                const user = await interaction.client.users.fetch(winner.userId);
                resultText += `👤 ${user.username} - ${winner.matches}/6 eşleşme - **${prizePerWinner.toLocaleString()} NRC**\n`;
            }

            // Reset jackpot
            db.data.lotteryJackpot = STARTING_JACKPOT;
        }

        // Clear tickets
        db.data.lotteryTickets.clear();
        db.saveData();

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎲 Loto Çekilişi!')
            .setDescription(`**Kazanan Sayılar:** ${winningNumbers.join(', ')}\n\n${resultText}`)
            .addFields(
                { name: '🎰 İkramiye', value: `${jackpot.toLocaleString()} NRC`, inline: true },
                { name: '🎫 Toplam Bilet', value: `${Array.from(db.data.lotteryTickets.values()).reduce((sum, t) => sum + t.length, 0)}`, inline: true }
            )
            .setFooter({ text: 'Bir sonraki çekiliş için bilet alın!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleInfo(interaction) {
        const db = getDatabase();
        const jackpot = db.data.lotteryJackpot || STARTING_JACKPOT;
        const totalTickets = db.data.lotteryTickets ? Array.from(db.data.lotteryTickets.values()).reduce((sum, t) => sum + t.length, 0) : 0;
        const userTickets = db.data.lotteryTickets?.get(interaction.user.id)?.length || 0;

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🎟️ NeuroCoin Loto')
            .setDescription('6 sayı seçin (1-49) ve büyük ikramiyeyi kazanın!')
            .addFields(
                { name: '💰 Bilet Fiyatı', value: `${TICKET_PRICE} NRC`, inline: true },
                { name: '🎰 Mevcut İkramiye', value: `${jackpot.toLocaleString()} NRC`, inline: true },
                { name: '🎫 Toplam Bilet', value: `${totalTickets}`, inline: true },
                { name: '📊 Sizin Biletleriniz', value: `${userTickets}`, inline: true },
                { name: '🎯 Kazanma Şansı', value: '3+ eşleşme', inline: true },
                { name: '🏆 Ödüller', value: '6/6: İkramiye\n5/6: %20\n4/6: %10\n3/6: %5', inline: false }
            )
            .setFooter({ text: 'Bilet almak için /lottery buy kullanın!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

