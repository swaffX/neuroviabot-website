// ==========================================
// 🔫 NeuroViaBot - Russian Roulette Command
// ==========================================
// Ya hep ya hiç!

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('russian-roulette')
        .setDescription('🔫 Rus Ruleti: Ya hep ya hiç!')
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
            if (isNaN(amount) || amount < 50) {
                return interaction.reply({
                    content: '❌ Minimum 50 NRC.',
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

        // Olasılık: 1/6 mermi var. %83.3 kazanma şansı.
        // Ama çok riskli, kazanç az olmalı (x1.15 gibi) veya
        // Tam tersi: 5/6 dolu, 1/6 boş. Yaşarsan x5 alırsın.
        // Genelde Rus Ruleti: 1 mermi var. Tetiği çekersin.
        // Ölürsen her şeyi kaybedersin. Yaşarsan bahsinin bir kısmını kazanırsın.

        // Bizim versiyon: 6 yuva, 1 mermi.
        // Yaşarsan: Bahis * 1.2
        // Ölürsen: Bahis gider.

        user.balance -= amount;
        user.stats.totalBets += 1;
        user.stats.gamesPlayed += 1;
        await user.save();

        const bulletPosition = Math.floor(Math.random() * 6); // 0-5
        const currentPosition = Math.floor(Math.random() * 6); // 0-5

        const embed = new EmbedBuilder()
            .setTitle('🔫 Rus Ruleti');

        if (bulletPosition === currentPosition) {
            // Öldü
            user.stats.totalLosses += 1;
            user.stats.winStreak = 0;

            embed.setColor('#e74c3c');
            embed.setDescription(`Tetiği çektin... **BAM!** 💥\n\n**${amount.toLocaleString()} NRC** kaybettin.`);
        } else {
            // Yaşadı
            // Çarpan 1.2x (Risk düşük olduğu için)
            // Daha heyecanlı olması için: Tur tur gidebilir ama şimdilik tek tur.
            const multiplier = 1.2;
            const winnings = Math.floor(amount * multiplier);

            user.balance += winnings;
            user.stats.totalWins += 1;
            user.stats.totalEarned += (winnings - amount);
            user.stats.winStreak += 1;
            if (user.stats.winStreak > user.stats.maxWinStreak) user.stats.maxWinStreak = user.stats.winStreak;

            embed.setColor('#2ecc71');
            embed.setDescription(`Tetiği çektin... **TIK.** 😅\n\nŞanslısın! **${winnings.toLocaleString()} NRC** kazandın.`);
        }

        await user.save();
        await interaction.reply({ embeds: [embed] });
    }
};
