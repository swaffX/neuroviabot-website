// ==========================================
// 💣 NeuroViaBot - Mines Game
// ==========================================
// Mayın Tarlası: Elmasları bul, bombadan kaç!

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mines')
        .setDescription('💣 Mayın Tarlası: Elmasları bul, bombadan kaç!')
        .addStringOption(option =>
            option.setName('bahis')
                .setDescription('Bahis miktarı')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('bombalar')
                .setDescription('Kaç adet bomba olsun? (1-15)')
                .setMinValue(1)
                .setMaxValue(15)
                .setRequired(true)),

    async execute(interaction) {
        const betInput = interaction.options.getString('bahis');
        let bombCount = interaction.options.getInteger('bombalar');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Validasyon
        if (!bombCount || isNaN(bombCount) || bombCount < 1 || bombCount > 15) {
            return interaction.reply({
                content: '❌ Bomba sayısı 1 ile 15 arasında olmalıdır.',
                flags: MessageFlags.Ephemeral
            });
        }

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
                return interaction.reply({ content: '❌ Minimum 50 NRC.', flags: MessageFlags.Ephemeral });
            }
        }

        if (amount <= 0 || user.balance < amount) {
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

        // OYUN MANTIĞI
        const gridSize = 20; // 5x4 grid
        const maxClicks = gridSize - bombCount;
        let grid = Array(gridSize).fill('safe');

        // Bombaları yerleştir
        let placedBombs = 0;
        while (placedBombs < bombCount) {
            const r = Math.floor(Math.random() * gridSize);
            if (grid[r] === 'safe') {
                grid[r] = 'bomb';
                placedBombs++;
            }
        }

        let revealedCount = 0;
        let gameOver = false;
        let currentMultiplier = 1.0;

        const calculateNextMultiplier = (step) => {
            let probability = 1;
            for (let i = 0; i <= step; i++) {
                probability *= (gridSize - bombCount - i) / (gridSize - i);
            }
            return (0.95 / probability);
        };

        // Butonları Oluştur
        const generateComponents = (revealMask = [], revealAll = false) => {
            const rows = [];

            for (let i = 0; i < 4; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 5; j++) {
                    const index = i * 5 + j;
                    const btn = new ButtonBuilder().setCustomId(`mine_${index}`);

                    if (revealAll) {
                        btn.setDisabled(true);
                        if (grid[index] === 'bomb') {
                            btn.setStyle(ButtonStyle.Danger).setEmoji('💣');
                        } else if (revealMask.includes(index)) {
                            btn.setStyle(ButtonStyle.Success).setEmoji('💎');
                        } else {
                            btn.setStyle(ButtonStyle.Secondary).setEmoji('🟦');
                        }
                    } else if (revealMask.includes(index)) {
                        btn.setStyle(ButtonStyle.Success).setEmoji('💎').setDisabled(true);
                    } else {
                        btn.setStyle(ButtonStyle.Secondary).setEmoji('🟦');
                    }
                    row.addComponents(btn);
                }
                rows.push(row);
            }

            // Kontrol satırı
            const controlRow = new ActionRowBuilder();
            const nextMult = revealedCount > 0 ? calculateNextMultiplier(revealedCount - 1) : 1;
            const potentialWin = Math.floor(amount * nextMult);

            controlRow.addComponents(
                new ButtonBuilder()
                    .setCustomId('mines_cashout')
                    .setLabel(gameOver ? '🎮 Oyun Bitti' : `💰 Nakit Çek: ${potentialWin.toLocaleString()} NRC`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(revealedCount === 0 || gameOver || revealAll)
            );

            rows.push(controlRow);
            return rows;
        };

        let revealedIndices = [];

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`💣 MINES [${bombCount} Bomba]`)
            .setDescription(`**Bahis:** ${amount.toLocaleString()} NRC\n**Çarpan:** 1.00x\n\nKutulara tıkla, elmasları bul!`)
            .setFooter({ text: `House Edge: %5 | ${interaction.user.username}` });

        await interaction.reply({
            embeds: [embed],
            components: generateComponents(revealedIndices, false)
        });

        const msg = await interaction.fetchReply();

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 180000
        });

        collector.on('collect', async i => {
            if (i.customId === 'mines_cashout') {
                gameOver = true;
                const finalMult = calculateNextMultiplier(revealedCount - 1);
                const winAmt = Math.floor(amount * finalMult);

                // Para ver
                user.balance += winAmt;
                user.stats.totalWins += 1;
                user.stats.totalEarned += (winAmt - amount);
                user.stats.winStreak += 1;
                if (user.stats.winStreak > user.stats.maxWinStreak) {
                    user.stats.maxWinStreak = user.stats.winStreak;
                }
                if ((winAmt - amount) > user.stats.biggestWin) {
                    user.stats.biggestWin = winAmt - amount;
                }
                await user.save();

                embed.setTitle('💰 NAKİT ÇEKİLDİ!');
                embed.setDescription(`**Kazanılan:** ${winAmt.toLocaleString()} NRC\n**Çarpan:** ${finalMult.toFixed(2)}x`);
                embed.setColor('#f1c40f');

                await i.update({ embeds: [embed], components: generateComponents(revealedIndices, true) });
                collector.stop();
                return;
            }

            // Kutu Tıklama
            const index = parseInt(i.customId.split('_')[1]);

            if (grid[index] === 'bomb') {
                gameOver = true;

                // Kayıp
                user.stats.totalLosses += 1;
                user.stats.winStreak = 0;
                await user.save();

                embed.setTitle('💥 PATLADI!');
                embed.setDescription(`Malesef bombaya bastın ve **${amount.toLocaleString()} NRC** kaybettin.`);
                embed.setColor('#e74c3c');

                await i.update({ embeds: [embed], components: generateComponents(revealedIndices, true) });
                collector.stop();
            } else {
                revealedIndices.push(index);
                revealedCount++;
                currentMultiplier = calculateNextMultiplier(revealedCount - 1);

                embed.setDescription(`**Bahis:** ${amount.toLocaleString()} NRC\n**Çarpan:** ${currentMultiplier.toFixed(2)}x\n**Potansiyel:** ${Math.floor(amount * currentMultiplier).toLocaleString()} NRC`);

                // Auto Win if clear
                if (revealedCount === (gridSize - bombCount)) {
                    gameOver = true;
                    const winAmt = Math.floor(amount * currentMultiplier);

                    user.balance += winAmt;
                    user.stats.totalWins += 1;
                    user.stats.totalEarned += (winAmt - amount);
                    user.stats.winStreak += 1;
                    if (user.stats.winStreak > user.stats.maxWinStreak) {
                        user.stats.maxWinStreak = user.stats.winStreak;
                    }
                    await user.save();

                    embed.setTitle('🏆 MÜKEMMEL!');
                    embed.setDescription(`Tüm elmasları buldun!\n**Kazanılan:** ${winAmt.toLocaleString()} NRC`);
                    embed.setColor('#f1c40f');

                    await i.update({ embeds: [embed], components: generateComponents(revealedIndices, true) });
                    collector.stop();
                } else {
                    await i.update({ embeds: [embed], components: generateComponents(revealedIndices, false) });
                }
            }
        });
    }
};
