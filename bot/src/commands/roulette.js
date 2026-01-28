// ==========================================
// 🎱 NeuroViaBot - Roulette Command
// ==========================================
// Rulet masası - Sayıya veya renge oyna

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('🎱 Rulet: Sayı, renk veya aralık seç!')
        .addStringOption(option =>
            option.setName('bahis')
                .setDescription('Bahis miktarı (veya \'all\')')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('secim')
                .setDescription('kırmızı, siyah, yeşil, 1-36, tek, çift')
                .setRequired(true)),

    async execute(interaction) {
        const betInput = interaction.options.getString('bahis');
        const choice = interaction.options.getString('secim').toLowerCase();
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
            if (isNaN(amount) || amount < 10) {
                return interaction.reply({
                    content: '❌ Minimum 10 NRC.',
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

        // Rulet Dönüyor
        const resultNumber = Math.floor(Math.random() * 37); // 0-36
        let color = 'yeşil';
        if (RED_NUMBERS.includes(resultNumber)) color = 'kırmızı';
        else if (BLACK_NUMBERS.includes(resultNumber)) color = 'siyah';

        // Kazanma Kontrolü
        let won = false;
        let multiplier = 0;

        // Sayı seçimi
        if (!isNaN(parseInt(choice)) && parseInt(choice) === resultNumber) {
            won = true;
            multiplier = 36;
        }
        // Renk seçimi
        else if (choice === 'kırmızı' && color === 'kırmızı') { won = true; multiplier = 2; }
        else if ((choice === 'siyah' || choice === 'black') && color === 'siyah') { won = true; multiplier = 2; }
        else if ((choice === 'yeşil' || choice === 'green') && color === 'yeşil') { won = true; multiplier = 14; } // 0
        // Tek/Çift
        else if ((choice === 'tek' || choice === 'odd') && resultNumber !== 0 && resultNumber % 2 !== 0) { won = true; multiplier = 2; }
        else if ((choice === 'çift' || choice === 'cift' || choice === 'even') && resultNumber !== 0 && resultNumber % 2 === 0) { won = true; multiplier = 2; }
        // 1-18 / 19-36
        else if (choice === '1-18' && resultNumber >= 1 && resultNumber <= 18) { won = true; multiplier = 2; }
        else if (choice === '19-36' && resultNumber >= 19 && resultNumber <= 36) { won = true; multiplier = 2; }

        user.balance -= amount;
        user.stats.totalBets += 1;
        user.stats.gamesPlayed += 1;

        const embed = new EmbedBuilder();
        let colorHex = '#2ecc71'; // Yeşil (0)
        if (color === 'kırmızı') colorHex = '#e74c3c';
        else if (color === 'siyah') colorHex = '#2C2F33';

        if (won) {
            const winnings = Math.floor(amount * multiplier);
            user.balance += winnings;
            user.stats.totalWins += 1;
            user.stats.totalEarned += (winnings - amount);
            user.stats.winStreak += 1;
            if (user.stats.winStreak > user.stats.maxWinStreak) user.stats.maxWinStreak = user.stats.winStreak;
            if ((winnings - amount) > user.stats.biggestWin) user.stats.biggestWin = winnings - amount;

            embed.setTitle('🎉 KAZANDIN!');
            embed.setDescription(`Top **${resultNumber} (${color.toUpperCase()})** sayısında durdu!\n\n**${winnings.toLocaleString()} NRC** kazandın!`);
            embed.setColor(colorHex);
        } else {
            user.stats.totalLosses += 1;
            user.stats.winStreak = 0;

            embed.setTitle('💀 KAYBETTİN');
            embed.setDescription(`Top **${resultNumber} (${color.toUpperCase()})** sayısında durdu.\n\n**${amount.toLocaleString()} NRC** kaybettin.`);
            embed.setColor(colorHex);
        }

        await user.save();
        embed.setFooter({ text: `${interaction.user.username} • Seçim: ${choice}` });

        await interaction.reply({ embeds: [embed] });
    }
};
