// ==========================================
// 💼 NeuroViaBot - Work Command
// ==========================================
// Çalış ve NRC kazan!

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');
const { logger } = require('../utils/logger');

const JOBS = [
    { name: 'Yazılımcı', text: 'kod yazarak', min: 150, max: 400, emoji: '💻' },
    { name: 'Discord Modu', text: 'sunucuyu moder ederek', min: 100, max: 250, emoji: '🛡️' },
    { name: 'Yayıncı', text: 'yayın açarak', min: 200, max: 500, emoji: '🎥' },
    { name: 'Tasarımcı', text: 'logo tasarlayarak', min: 180, max: 450, emoji: '🎨' },
    { name: 'Madenci', text: 'kripto kazarak', min: 250, max: 600, emoji: '⛏️' },
    { name: 'Barmen', text: 'içki servis ederek', min: 100, max: 300, emoji: '🍺' },
    { name: 'DJ', text: 'parti organize ederek', min: 150, max: 400, emoji: '🎧' },
    { name: 'Youtuber', text: 'video çekerek', min: 200, max: 550, emoji: '📹' },
    { name: 'Bot Geliştirici', text: 'Discord botu kodlayarak', min: 300, max: 700, emoji: '🤖' },
    { name: 'Hacker', text: 'bir bankayı soyarak', min: 1000, max: 3000, chance: 0.03 }
];

// Eşya drop sistemi
const DROP_ITEMS = [
    { id: 'crypto_box', name: 'Kripto Kutus', emoji: '📦', chance: 0.002 },
    { id: 'golden_box', name: 'Altın Kutu', emoji: '🎁', chance: 0.008 },
    { id: 'metal_box', name: 'Metal Kutu', emoji: '📫', chance: 0.05 },
    { id: 'wooden_box', name: 'Tahta Kutu', emoji: '📪', chance: 0.10 },
    { id: 'mystery_key', name: 'Gizemli Anahtar', emoji: '🔑', chance: 0.03 }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('💼 Çalış ve NRC kazan!'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let user = await NRCUser.findOne({ odasi: userId, odaId: guildId });
        if (!user) {
            user = await NRCUser.create({ odasi: userId, odaId: guildId, username: interaction.user.username });
        }

        // Cooldown Check (5 Dakika = 300000ms)
        const now = Date.now();
        const cooldownTime = 5 * 60 * 1000;

        if (user.lastWork && now - new Date(user.lastWork).getTime() < cooldownTime) {
            const remaining = cooldownTime - (now - new Date(user.lastWork).getTime());
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            const cooldownEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('⏳ Çok Yorgunsun!')
                .setDescription(`Biraz dinlenmen gerekiyor.\n\n⏱️ **Kalan Süre:** ${minutes}dk ${seconds}sn`)
                .setFooter({ text: 'Dinlenip tekrar gel!' })
                .setTimestamp();

            return interaction.reply({ embeds: [cooldownEmbed], flags: MessageFlags.Ephemeral });
        }

        // Job Logic
        let job = JOBS[Math.floor(Math.random() * JOBS.length)];

        // Hacker job has special chance
        if (job.name === 'Hacker' && Math.random() > job.chance) {
            job = JOBS[Math.floor(Math.random() * (JOBS.length - 1))];
        }

        const earnings = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        // Update user
        user.balance += earnings;
        user.lastWork = new Date();
        user.stats.totalWork = (user.stats.totalWork || 0) + 1;
        user.stats.totalEarned = (user.stats.totalEarned || 0) + earnings;

        // DROP SISTEMI
        let droppedItem = null;
        const roll = Math.random();
        let cumulative = 0;

        for (const item of DROP_ITEMS) {
            cumulative += item.chance;
            if (roll < cumulative) {
                droppedItem = item;
                break;
            }
        }

        if (droppedItem) {
            if (!user.inventory) user.inventory = [];
            const existing = user.inventory.find(i => i.itemId === droppedItem.id);
            if (existing) {
                existing.amount++;
            } else {
                user.inventory.push({ itemId: droppedItem.id, amount: 1 });
            }
        }

        await user.save();

        // Build description
        let description = `${job.emoji} **${job.name}** olarak çalışarak **${earnings.toLocaleString()} NRC** kazandın!\n\n💰 **Cüzdan:** ${user.balance.toLocaleString()} NRC`;

        if (droppedItem) {
            description += `\n\n🎁 **Şanslı Günün!** Çalışırken bir **${droppedItem.emoji} ${droppedItem.name}** buldun!\nÇantanı kontrol et: \`/envanter\``;
        }

        const embed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setAuthor({
                name: `${interaction.user.username} işe gitti`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(description)
            .addFields(
                { name: '📊 Toplam Çalışma', value: `${user.stats.totalWork || 1} kez`, inline: true },
                { name: '💵 Toplam Kazanç', value: `${(user.stats.totalEarned || earnings).toLocaleString()} NRC`, inline: true }
            )
            .setFooter({ text: 'Tekrar çalışmak için 5 dakika bekle.' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
