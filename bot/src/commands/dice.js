const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('🎲 Zar at (1-6) - Tahminin tutarsa x6 kazanırsın!')
        .addStringOption(option => option.setName('bahis').setDescription('Bahis miktarı veya "all"').setRequired(true))
        .addIntegerOption(option => option.setName('tahmin').setDescription('1-6 arası tahminin').setMinValue(1).setMaxValue(6).setRequired(true)),

    async execute(interaction) {
        const betInput = interaction.options.getString('bahis');
        const prediction = interaction.options.getInteger('tahmin');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let user = await NRCUser.findOne({ odasi: userId, odaId: guildId });
        if (!user) {
            user = await NRCUser.create({ odasi: userId, odaId: guildId, username: interaction.user.username });
        }

        let amount = 0;
        if (['all', 'hepsi'].includes(betInput.toLowerCase())) amount = user.balance;
        else amount = parseInt(betInput);

        if (isNaN(amount) || amount < 10) return interaction.reply({ content: '❌ Minimum bahis 10 NRC.', flags: MessageFlags.Ephemeral });
        if (user.balance < amount) return interaction.reply({ content: `❌ Yetersiz bakiye! Mevcut: **${user.balance.toLocaleString()}** NRC`, flags: MessageFlags.Ephemeral });

        user.balance -= amount;
        user.stats.totalBets += 1;
        user.stats.gamesPlayed += 1;

        const diceResult = Math.floor(Math.random() * 6) + 1;
        const won = diceResult === prediction;

        const embed = new EmbedBuilder().setTitle('🎲 Zar Atıldı');

        if (won) {
            const winnings = amount * 6;
            user.balance += winnings;
            user.stats.totalWins += 1;
            user.stats.totalEarned += (winnings - amount);

            embed.setColor('#2ecc71').setDescription(`Tahminin: **${prediction}**\nZar: **${diceResult}**\n\n🎉 **MÜKEMMEL!** Tam isabet! **${winnings.toLocaleString()} NRC** kazandın!`);
        } else {
            user.stats.totalLosses += 1;
            user.stats.winStreak = 0;
            embed.setColor('#e74c3c').setDescription(`Tahminin: **${prediction}**\nZar: **${diceResult}**\n\n💀 **KAYBETTİN!** **${amount.toLocaleString()} NRC** gitti.`);
        }

        await user.save();
        await interaction.reply({ embeds: [embed] });
    }
};
