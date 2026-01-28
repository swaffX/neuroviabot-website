// ==========================================
// 🚀 NeuroViaBot - Crash Game (Aviator)
// ==========================================
// Grafik yükselirken paranı çek!

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crash')
        .setDescription('🚀 Crash (Aviator) oyunu: Grafik yükselirken paranı çek!')
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
            if (isNaN(amount) || amount < 50) {
                return interaction.reply({
                    content: '❌ Minimum bahis 50 NRC.',
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

        // Bakiye düş
        user.balance -= amount;
        user.stats.totalBets += 1;
        user.stats.gamesPlayed += 1;
        await user.save();

        // OYUN BAŞLIYOR
        let multiplier = 1.0;
        const crashPoint = Math.max(1.00, (100 / (Math.floor(Math.random() * 100) + 1)) * 0.99);

        let crashed = false;
        let cashedOut = false;
        let msg = null;

        // Görsel Setup
        const generateEmbed = (currentMult, status) => {
            let color = '#3498db';
            let title = `🚀 CRASH: ${currentMult.toFixed(2)}x`;
            let desc = 'Yükseliyor... Paranızı çekmek için butona basın!';

            if (status === 'crashed') {
                color = '#e74c3c';
                title = `💥 CRASHED @ ${currentMult.toFixed(2)}x`;
                desc = `Uçak düştü! **${amount.toLocaleString()} NRC** kaybettin.`;
            } else if (status === 'cashed') {
                const winAmount = Math.floor(amount * currentMult);
                color = '#2ecc71';
                title = `💰 ÇEKİLDİ @ ${currentMult.toFixed(2)}x`;
                desc = `Tebrikler! **${winAmount.toLocaleString()} NRC** kazandın!`;
            }

            const height = Math.min(10, Math.floor(currentMult));
            const graph = '📈 ' + '▓'.repeat(height) + '🚀';

            return new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(`${desc}\n\n\`\`\`\n${graph}\n\`\`\``)
                .addFields(
                    { name: '💰 Bahis', value: `${amount.toLocaleString()} NRC`, inline: true },
                    { name: '📊 Çarpan', value: `${currentMult.toFixed(2)}x`, inline: true },
                    { name: '💵 Potansiyel', value: `${Math.floor(amount * currentMult).toLocaleString()} NRC`, inline: true }
                )
                .setFooter({ text: `Crash Point: ??? | ${interaction.user.username}` });
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('crash_cashout')
                .setLabel('💰 Nakit Çek')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ embeds: [generateEmbed(1.0, 'running')], components: [row] });
        msg = await interaction.fetchReply();

        // Oyun Loop'u
        const intervalTime = 1500;
        let interval = setInterval(async () => {
            if (crashed || cashedOut) {
                clearInterval(interval);
                return;
            }

            // Çarpanı artır
            if (multiplier < 2.0) multiplier += 0.15;
            else if (multiplier < 5.0) multiplier += 0.35;
            else multiplier += 0.8;

            if (multiplier >= crashPoint) {
                crashed = true;
                multiplier = crashPoint;
                clearInterval(interval);

                // Kayıp istatistik güncelle
                user.stats.totalLosses += 1;
                user.stats.winStreak = 0;
                await user.save();

                try {
                    await msg.edit({ embeds: [generateEmbed(multiplier, 'crashed')], components: [] });
                } catch (e) { }
                return;
            }

            try {
                await msg.edit({ embeds: [generateEmbed(multiplier, 'running')] });
            } catch (e) { clearInterval(interval); }

        }, intervalTime);

        // Buton Dinleyici
        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== userId) {
                return i.reply({ content: '❌ Bu senin oyunun değil!', flags: MessageFlags.Ephemeral });
            }

            if (!crashed && !cashedOut) {
                cashedOut = true;
                clearInterval(interval);

                const winAmount = Math.floor(amount * multiplier);

                // Parayı ver ve istatistik güncelle
                user.balance += winAmount;
                user.stats.totalWins += 1;
                user.stats.totalEarned += (winAmount - amount);
                user.stats.winStreak += 1;
                if (user.stats.winStreak > user.stats.maxWinStreak) {
                    user.stats.maxWinStreak = user.stats.winStreak;
                }
                if ((winAmount - amount) > user.stats.biggestWin) {
                    user.stats.biggestWin = winAmount - amount;
                }
                await user.save();

                await i.update({ embeds: [generateEmbed(multiplier, 'cashed')], components: [] });
                collector.stop();
            }
        });

        collector.on('end', () => {
            clearInterval(interval);
        });
    }
};
