// ==========================================
// 🎁 NeuroViaBot - Daily Command
// ==========================================
// Günlük NRC ödülünü topla!

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');
const { logger } = require('../utils/logger');

const BASE_REWARD = 500;
const MAX_REWARD = 1500;
const STREAK_BONUS = 100; // Her streak için +100
const MAX_STREAK_BONUS = 1000; // Max streak bonus

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('🎁 Günlük NRC ödülünü topla!'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let user = await NRCUser.findOne({ odasi: userId, odaId: guildId });
        if (!user) {
            user = await NRCUser.create({ odasi: userId, odaId: guildId, username: interaction.user.username });
        }

        const now = new Date();
        const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;

        // 24 Saat Kontrolü
        if (lastDaily && (now - lastDaily) < 86400000) {
            const diff = 86400000 - (now - lastDaily);
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            const cooldownEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('⏰ Çok Erken!')
                .setDescription(`Günlük ödülünü zaten aldın!\n\n⏱️ **Kalan Süre:** ${hours}sa ${minutes}dk ${seconds}sn`)
                .setFooter({ text: 'Yarın tekrar gel!' })
                .setTimestamp();

            return interaction.reply({ embeds: [cooldownEmbed], flags: MessageFlags.Ephemeral });
        }

        // Streak hesapla
        let currentStreak = user.dailyStreak || 0;

        if (lastDaily) {
            const daysSinceLastDaily = Math.floor((now - lastDaily) / 86400000);

            if (daysSinceLastDaily === 1) {
                // Ardışık gün - streak devam
                currentStreak++;
            } else if (daysSinceLastDaily > 1) {
                // Streak kırıldı
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }

        // Ödül hesapla
        const baseReward = Math.floor(Math.random() * (MAX_REWARD - BASE_REWARD + 1)) + BASE_REWARD;
        const streakBonus = Math.min(currentStreak * STREAK_BONUS, MAX_STREAK_BONUS);
        const totalReward = baseReward + streakBonus;

        // Kullanıcıyı güncelle
        user.balance += totalReward;
        user.lastDaily = now;
        user.dailyStreak = currentStreak;
        user.stats.totalEarned = (user.stats.totalEarned || 0) + totalReward;
        await user.save();

        // Premium bonus göstergesi
        let premiumIndicator = '';
        if (user.premium?.active) {
            premiumIndicator = '\n👑 **Premium Bonus:** Aktif!';
        }

        // Streak emojisi
        let streakEmoji = '🔥';
        if (currentStreak >= 7) streakEmoji = '💎';
        else if (currentStreak >= 30) streakEmoji = '👑';
        else if (currentStreak >= 100) streakEmoji = '🏆';

        const embed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('🎁 Günlük Ödül Alındı!')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(`Günlük NeuroCoin ödülünü aldın!${premiumIndicator}`)
            .addFields(
                { name: '💰 Temel Ödül', value: `${baseReward.toLocaleString()} NRC`, inline: true },
                { name: `${streakEmoji} Streak Bonus`, value: `+${streakBonus.toLocaleString()} NRC (${currentStreak} gün)`, inline: true },
                { name: '🎉 Toplam', value: `**${totalReward.toLocaleString()} NRC**`, inline: true },
                { name: '💵 Yeni Bakiye', value: `${user.balance.toLocaleString()} NRC`, inline: true },
                { name: '📊 Streak', value: `${currentStreak} gün`, inline: true },
                { name: '🎯 Sonraki Bonus', value: `+${Math.min((currentStreak + 1) * STREAK_BONUS, MAX_STREAK_BONUS)} NRC`, inline: true }
            )
            .setFooter({ text: '24 saat sonra tekrar gel! • Streak\'ini koru!' })
            .setTimestamp();

        // Streak milestone mesajları
        if (currentStreak === 7) {
            embed.addFields({ name: '🎊 MİLESTONE!', value: '1 haftalık streak! Harika gidiyorsun!', inline: false });
        } else if (currentStreak === 30) {
            embed.addFields({ name: '👑 EFSANE!', value: '30 günlük streak! Sen bir efsanesin!', inline: false });
        } else if (currentStreak === 100) {
            embed.addFields({ name: '🏆 LEGENDARY!', value: '100 günlük streak! İnanılmaz!', inline: false });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
