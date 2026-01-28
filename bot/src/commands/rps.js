const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('✂️ Taş Kağıt Makas oyna!')
        .addStringOption(option => option.setName('bahis').setDescription('Bahis miktarı veya "all"').setRequired(true))
        .addStringOption(option => option.setName('secim').setDescription('Seçimin nedir?')
            .addChoices(
                { name: '🪨 Taş', value: 'rock' },
                { name: '📄 Kağıt', value: 'paper' },
                { name: '✂️ Makas', value: 'scissors' }
            ).setRequired(true)),

    async execute(interaction) {
        const betInput = interaction.options.getString('bahis');
        const choice = interaction.options.getString('secim');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let user = await NRCUser.findOne({ odasi: userId, odaId: guildId });
        if (!user) user = await NRCUser.create({ odasi: userId, odaId: guildId, username: interaction.user.username });

        let amount = 0;
        if (['all', 'hepsi'].includes(betInput.toLowerCase())) amount = user.balance;
        else amount = parseInt(betInput);

        if (isNaN(amount) || amount < 10) return interaction.reply({ content: '❌ Minimum bahis 10 NRC.', flags: MessageFlags.Ephemeral });
        if (user.balance < amount) return interaction.reply({ content: `❌ Yetersiz bakiye! Mevcut: **${user.balance.toLocaleString()}** NRC`, flags: MessageFlags.Ephemeral });

        user.balance -= amount;
        await user.save();

        const options = ['rock', 'paper', 'scissors'];
        const botChoice = options[Math.floor(Math.random() * options.length)];
        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

        let result = '';
        if (choice === botChoice) result = 'DRAW';
        else if (
            (choice === 'rock' && botChoice === 'scissors') ||
            (choice === 'paper' && botChoice === 'rock') ||
            (choice === 'scissors' && botChoice === 'paper')
        ) result = 'WIN';
        else result = 'LOSE';

        const embed = new EmbedBuilder().setTitle('✂️ Taş Kağıt Makas');

        if (result === 'WIN') {
            const winnings = amount * 2;
            user.balance += winnings;
            user.stats.totalWins += 1;
            user.stats.totalEarned += (winnings - amount);
            embed.setColor('#2ecc71').setDescription(`Sen: ${emojis[choice]}\nBot: ${emojis[botChoice]}\n\n🎉 **KAZANDIN!** **${winnings.toLocaleString()} NRC** kazandın!`);
        } else if (result === 'DRAW') {
            user.balance += amount; // İade
            embed.setColor('#f1c40f').setDescription(`Sen: ${emojis[choice]}\nBot: ${emojis[botChoice]}\n\n🤝 **BERABERE!** Bahsin iade edildi.`);
        } else {
            user.stats.totalLosses += 1;
            embed.setColor('#e74c3c').setDescription(`Sen: ${emojis[choice]}\nBot: ${emojis[botChoice]}\n\n💀 **KAYBETTİN!** **${amount.toLocaleString()} NRC** gitti.`);
        }

        await user.save();
        await interaction.reply({ embeds: [embed] });
    }
};
