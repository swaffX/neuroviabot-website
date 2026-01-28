const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');

const HORSES = [
    { name: 'Rüzgarın Oğlu', emoji: '🐎', id: 1 },
    { name: 'Şimşek', emoji: '🦄', id: 2 },
    { name: 'Kara İnci', emoji: '🦓', id: 3 },
    { name: 'Fırtına', emoji: '🐴', id: 4 },
    { name: 'Gölge', emoji: '🏇', id: 5 }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('racing')
        .setDescription('🏇 At yarışı bahsi yap')
        .addStringOption(option => option.setName('bahis').setDescription('Bahis miktarı veya "all"').setRequired(true))
        .addIntegerOption(option => option.setName('at').setDescription('Hangi at kazansın? (1-5)').addChoices(...HORSES.map(h => ({ name: `${h.emoji} ${h.name}`, value: h.id }))).setRequired(true)),

    async execute(interaction) {
        const betInput = interaction.options.getString('bahis');
        const horseId = interaction.options.getInteger('at');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let user = await NRCUser.findOne({ odasi: userId, odaId: guildId });
        if (!user) user = await NRCUser.create({ odasi: userId, odaId: guildId, username: interaction.user.username });

        let amount = 0;
        if (['all', 'hepsi'].includes(betInput.toLowerCase())) amount = user.balance;
        else amount = parseInt(betInput);

        if (isNaN(amount) || amount < 50) return interaction.reply({ content: '❌ Minimum bahis 50 NRC.', flags: MessageFlags.Ephemeral });
        if (user.balance < amount) return interaction.reply({ content: `❌ Yetersiz bakiye! Mevcut: **${user.balance.toLocaleString()}** NRC`, flags: MessageFlags.Ephemeral });

        user.balance -= amount;
        await user.save();

        const selectedHorse = HORSES.find(h => h.id === horseId);

        await interaction.reply({ content: `🏇 **${selectedHorse.name}** için **${amount.toLocaleString()} NRC** yatırıldı! Yarış başlıyor...` });

        // Basit simülasyon (3 saniye sonra sonuç)
        setTimeout(async () => {
            const winner = HORSES[Math.floor(Math.random() * HORSES.length)];
            const won = winner.id === horseId;

            const embed = new EmbedBuilder()
                .setTitle('🏁 Yarış Bitti!')
                .setDescription(`Yarışı kazanan: **${winner.emoji} ${winner.name}**\nSizin seçtiğiniz: **${selectedHorse.emoji} ${selectedHorse.name}**`)
                .setTimestamp();

            if (won) {
                const winnings = amount * 4; // 1'e 4 kazanç
                user.balance += winnings;
                user.stats.totalWins += 1;
                user.stats.totalEarned += (winnings - amount);
                embed.setColor('#2ecc71').addFields({ name: 'Sonuç', value: `🎉 **TEBRİKLER!** **${winnings.toLocaleString()} NRC** kazandın!` });
            } else {
                user.stats.totalLosses += 1;
                embed.setColor('#e74c3c').addFields({ name: 'Sonuç', value: `💀 **KAYBETTİN!** **${amount.toLocaleString()} NRC** kaybettin.` });
            }

            await user.save();
            await interaction.editReply({ content: '', embeds: [embed] });
        }, 3000);
    }
};
