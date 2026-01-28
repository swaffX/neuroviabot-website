const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const NRCUser = require('../models/NRCUser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('👤 Profilinizi ve istatistiklerinizi görüntüleyin')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Profili görüntülenecek kullanıcı')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({ content: '🤖 Botların profili olamaz.', ephemeral: true });
        }

        let user = await NRCUser.findOne({ odasi: targetUser.id, odaId: interaction.guild.id });
        if (!user) {
            user = await NRCUser.create({
                odasi: targetUser.id,
                odaId: interaction.guild.id,
                username: targetUser.username
            });
        }

        // Level Hesaplama (Örn: Her 1000 XP 1 Level olsun)
        const xpPerLevel = 1000;
        const currentLevel = Math.floor(user.xp / xpPerLevel) + 1;
        const currentLevelXp = user.xp % xpPerLevel;
        const nextLevelXp = xpPerLevel;

        // Progress Bar (10 parçalı)
        const progress = Math.floor((currentLevelXp / nextLevelXp) * 10);
        const progressBar = '🟩'.repeat(progress) + '⬜'.repeat(10 - progress);

        // Stats default objesini kontrol et
        const stats = user.stats || { gamesPlayed: 0, totalWins: 0, totalLosses: 0, totalBets: 0, totalEarned: 0, maxWinStreak: 0, biggestWin: 0 };

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`👤 ${targetUser.username} Profili`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '💰 Ekonomi', value: `Cüzdan: **${user.balance.toLocaleString()} NRC**\nBanka: **${user.bank.toLocaleString()} NRC**\nToplam: **${(user.balance + user.bank).toLocaleString()} NRC**`, inline: false },
                { name: `📊 Seviye ${currentLevel}`, value: `${progressBar} (${currentLevelXp}/${nextLevelXp} XP)`, inline: false },
                { name: '🎲 Oyun İstatistikleri', value: `Oynanan: **${stats.gamesPlayed}** | Kazanılan: **${stats.totalWins}** | Kaybedilen: **${stats.totalLosses}**\nToplam Bahis: **${stats.totalBets}**\nNet Kazanç: **${stats.totalEarned.toLocaleString()} NRC**`, inline: false },
                { name: '🔥 Rekorlar', value: `En Uzun Seri: **${stats.maxWinStreak}**\nEn Büyük Kazanç: **${stats.biggestWin.toLocaleString()} NRC**`, inline: false }
            )
            .setFooter({ text: `NeuroViaBot • ${interaction.guild.name}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
