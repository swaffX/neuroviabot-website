const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

const RACERS = [
  { name: '🏎️ Kırmızı Şimşek', speed: 0.8, luck: 1.2 },
  { name: '🚗 Mavi Yıldırım', speed: 1.0, luck: 1.0 },
  { name: '🏁 Yeşil Fırtına', speed: 1.1, luck: 0.9 },
  { name: '⚡ Sarı Roket', speed: 1.3, luck: 0.7 },
  { name: '🚙 Mor Gölge', speed: 0.9, luck: 1.1 },
  { name: '🏎️ Turuncu Ateş', speed: 1.2, luck: 0.8 },
  { name: '🚗 Siyah Panter', speed: 1.0, luck: 1.0 },
  { name: '🏁 Beyaz Şahin', speed: 0.7, luck: 1.3 }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('racing')
        .setDescription('🏁 Yarış simülasyonu - Yarışçıya bahis yap!')
        .addIntegerOption(option =>
            option.setName('yarışçı')
                .setDescription('Bahis yapılacak yarışçı (1-8)')
                .setMinValue(1)
                .setMaxValue(8)
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Bahis miktarı (NRC)')
                .setMinValue(10)
                .setRequired(true)
        ),

    async execute(interaction) {
        const racerNum = interaction.options.getInteger('yarışçı');
        const amount = interaction.options.getInteger('miktar');

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.wallet < amount) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Yetersiz Bakiye')
                    .setDescription(`Cüzdanınızda yeterli NRC yok!\n\n**Bakiye:** ${balance.wallet.toLocaleString()} NRC`)],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        // Simulate race
        const positions = RACERS.map((racer, index) => ({
            ...racer,
            index: index + 1,
            progress: 0
        }));

        // Race simulation (10 steps)
        for (let step = 0; step < 10; step++) {
            positions.forEach(racer => {
                const randomFactor = Math.random() * 0.5 + 0.75; // 0.75-1.25
                const speedBonus = racer.speed * randomFactor;
                const luckBonus = Math.random() < (racer.luck / 10) ? 0.3 : 0;
                racer.progress += speedBonus + luckBonus;
            });
        }

        // Sort by progress
        positions.sort((a, b) => b.progress - a.progress);

        // Check if user won
        const winner = positions[0];
        const userWon = winner.index === racerNum;
        const userRacerPosition = positions.findIndex(p => p.index === racerNum) + 1;

        // Calculate payout
        let payout = 0;
        if (userWon) {
            payout = amount * 5; // 5x for 1st place
        } else if (userRacerPosition === 2) {
            payout = amount * 2; // 2x for 2nd place
        } else if (userRacerPosition === 3) {
            payout = Math.floor(amount * 1.5); // 1.5x for 3rd place
        }

        const netChange = payout - amount;

        // Update balance
        db.updateNeuroCoinBalance(interaction.user.id, netChange, 'wallet');
        db.recordTransaction('system', interaction.user.id, Math.abs(netChange), netChange > 0 ? 'game_win' : 'game_loss', {
            game: 'racing',
            racer: racerNum,
            position: userRacerPosition
        });
        db.saveData();

        const newBalance = db.getNeuroCoinBalance(interaction.user.id);

        // Build result
        let resultText = '🏁 **Yarış Sonuçları:**\n\n';
        positions.slice(0, 3).forEach((racer, i) => {
            const medal = ['🥇', '🥈', '🥉'][i];
            const highlight = racer.index === racerNum ? '**→ ' : '';
            const highlightEnd = racer.index === racerNum ? ' ←**' : '';
            resultText += `${medal} ${highlight}${racer.name}${highlightEnd}\n`;
        });

        const embed = new EmbedBuilder()
            .setColor(netChange > 0 ? '#00ff00' : '#ff0000')
            .setTitle('🏁 Yarış Tamamlandı!')
            .setDescription(resultText)
            .addFields(
                { name: '🎲 Bahsiniz', value: `${RACERS[racerNum - 1].name}`, inline: true },
                { name: '📍 Sıralama', value: `${userRacerPosition}. sıra`, inline: true },
                { name: '💰 Bahis', value: `${amount.toLocaleString()} NRC`, inline: true }
            );

        if (netChange > 0) {
            embed.addFields({ name: '🎉 Kazanç', value: `+${netChange.toLocaleString()} NRC`, inline: true });
        } else {
            embed.addFields({ name: '💸 Kayıp', value: `${netChange.toLocaleString()} NRC`, inline: true });
        }

        embed.addFields({ name: '💵 Yeni Bakiye', value: `${newBalance.wallet.toLocaleString()} NRC`, inline: true });
        embed.setFooter({ text: 'NeuroCoin Racing' });
        embed.setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};

