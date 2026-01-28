const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('🎰 Rulet oyna ve NeuroCoin kazan!')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Bahis miktarı (NRC)')
                .setMinValue(10)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('bahis')
                .setDescription('Bahis türü')
                .addChoices(
                    { name: '🔴 Kırmızı (2x)', value: 'red' },
                    { name: '⚫ Siyah (2x)', value: 'black' },
                    { name: '1️⃣ Tek (2x)', value: 'odd' },
                    { name: '2️⃣ Çift (2x)', value: 'even' },
                    { name: '🔢 Sayı (35x)', value: 'number' }
                )
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('sayı')
                .setDescription('Sayı bahsi için (0-36)')
                .setMinValue(0)
                .setMaxValue(36)
                .setRequired(false)
        ),

    async execute(interaction) {
        const amount = interaction.options.getInteger('miktar');
        const betType = interaction.options.getString('bahis');
        const betNumber = interaction.options.getInteger('sayı');

        if (betType === 'number' && betNumber === null) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Hata')
                    .setDescription('Sayı bahsi için bir sayı belirtmelisiniz!')],
                ephemeral: true
            });
        }

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

        // Spin the wheel
        const result = Math.floor(Math.random() * 37); // 0-36
        const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(result);
        const isBlack = result !== 0 && !isRed;
        const isEven = result !== 0 && result % 2 === 0;
        const isOdd = result !== 0 && result % 2 === 1;

        // Check win
        let won = false;
        let multiplier = 0;

        if (betType === 'red' && isRed) {
            won = true;
            multiplier = 2;
        } else if (betType === 'black' && isBlack) {
            won = true;
            multiplier = 2;
        } else if (betType === 'odd' && isOdd) {
            won = true;
            multiplier = 2;
        } else if (betType === 'even' && isEven) {
            won = true;
            multiplier = 2;
        } else if (betType === 'number' && result === betNumber) {
            won = true;
            multiplier = 35;
        }

        const winAmount = won ? amount * multiplier : 0;
        const netChange = won ? winAmount - amount : -amount;

        // Update balance
        db.updateNeuroCoinBalance(interaction.user.id, netChange, 'wallet');
        db.recordTransaction('system', interaction.user.id, Math.abs(netChange), won ? 'game_win' : 'game_loss', {
            game: 'roulette',
            bet: betType,
            result
        });
        db.saveData();

        const newBalance = db.getNeuroCoinBalance(interaction.user.id);

        // Result color
        const resultColor = result === 0 ? '🟢' : (isRed ? '🔴' : '⚫');

        const embed = new EmbedBuilder()
            .setColor(won ? '#00ff00' : '#ff0000')
            .setTitle('🎰 Rulet Sonucu')
            .setDescription(`Çark döndü ve... **${resultColor} ${result}** çıktı!`)
            .addFields(
                { name: '🎲 Bahsiniz', value: betType === 'number' ? `Sayı: ${betNumber}` : betType, inline: true },
                { name: '💰 Bahis', value: `${amount.toLocaleString()} NRC`, inline: true },
                { name: won ? '🎉 Kazanç' : '💸 Kayıp', value: `${Math.abs(netChange).toLocaleString()} NRC`, inline: true },
                { name: '💵 Yeni Bakiye', value: `${newBalance.wallet.toLocaleString()} NRC`, inline: false }
            )
            .setFooter({ text: 'NeuroCoin Rulet' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};

