// ==========================================
// 🎰 NeuroViaBot - Slots Command
// ==========================================
// Slot makinesini çevir, büyük kazan!

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔', '🍀', '👑'];
const PAYOUTS = {
    '🍒': 2,
    '🍋': 2,
    '🍇': 3,
    '🔔': 5,
    '🍀': 8,
    '💎': 15,
    '7️⃣': 25,
    '👑': 50
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('🎰 Slot makinesini çevir ve kazan!')
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

        user.balance -= amount;
        user.stats.totalBets += 1;
        user.stats.gamesPlayed += 1;
        await user.save();

        // Slot Çevirme
        const slot1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const slot2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const slot3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

        let winnings = 0;
        let result = 'LOSE';

        // Kazanma Kontrolü
        if (slot1 === slot2 && slot2 === slot3) {
            // Jackpot (3'lü eşleşme)
            result = 'JACKPOT';
            winnings = Math.floor(amount * PAYOUTS[slot1]);
        } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
            // 2'li eşleşme (Küçük kazanç)
            result = 'WIN';
            const symbol = (slot1 === slot2) ? slot1 : ((slot2 === slot3) ? slot2 : slot1);
            winnings = Math.floor(amount * (PAYOUTS[symbol] / 2));
            if (winnings < amount) winnings = Math.floor(amount * 1.5); // Min kazanç
        }

        if (winnings > 0) {
            user.balance += winnings;
            user.stats.totalWins += 1;
            user.stats.totalEarned += (winnings - amount);
            user.stats.winStreak += 1;
            if (user.stats.winStreak > user.stats.maxWinStreak) user.stats.maxWinStreak = user.stats.winStreak;
            if ((winnings - amount) > user.stats.biggestWin) user.stats.biggestWin = winnings - amount;
        } else {
            user.stats.totalLosses += 1;
            user.stats.winStreak = 0;
        }
        await user.save();

        // Embed oluştur
        const embed = new EmbedBuilder()
            .setTitle('🎰 SLOT MAKİNESİ')
            .setDescription(`
**------------------**
**| ${slot1} | ${slot2} | ${slot3} |**
**------------------**
            `)
            .setFooter({ text: `Bahis: ${amount.toLocaleString()} NRC • ${interaction.user.username}` });

        if (result === 'JACKPOT') {
            embed.setColor('#f1c40f')
            embed.addFields({ name: '🎉 JACKPOT!', value: `**${winnings.toLocaleString()} NRC** KAZANDIN!` });
        } else if (result === 'WIN') {
            embed.setColor('#2ecc71')
            embed.addFields({ name: '🎊 KAZANDIN!', value: `**${winnings.toLocaleString()} NRC** KAZANDIN!` });
        } else {
            embed.setColor('#e74c3c')
            embed.addFields({ name: '💀 KAYBETTİN', value: `Şansını tekrar dene!` });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
