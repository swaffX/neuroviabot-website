const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('🎰 Slot makinesi oyna')
        .addIntegerOption(option =>
            option.setName('bahis')
                .setDescription('Bahis miktarı (minimum 10)')
                .setMinValue(10)
                .setMaxValue(10000)
                .setRequired(true)
        ),

    async execute(interaction) {
        const bet = interaction.options.getInteger('bahis');

        try {
            await interaction.deferReply();

            // Kullanıcı ve guild bilgilerini al
            const guild = await Guild.findOne({ where: { id: interaction.guild.id } });
            if (!guild) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Sunucu ekonomi sistemi bulunamadı!')
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const guildMember = await GuildMember.findOne({
                where: {
                    userId: interaction.user.id,
                    guildId: interaction.guild.id
                },
                include: [
                    {
                        model: User,
                        as: 'user'
                    }
                ]
            });

            if (!guildMember) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Ekonomi sistemine kayıtlı değilsin!')
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const currentBalance = parseInt(guildMember.balance) || 0;

            // Bakiye kontrolü
            if (currentBalance < bet) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetersiz Bakiye')
                    .setDescription(`Bu kadar para yok! Mevcut bakiye: **${currentBalance.toLocaleString()}** coin`)
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Slot sembolleri
            const symbols = ['🍎', '🍊', '🍇', '🍒', '🔔', '💎', '⭐', '🍀'];
            const slots = [
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)]
            ];

            // Kazanç hesaplama
            let winMultiplier = 0;
            let winType = '';

            // Jackpot (3 aynı özel sembol)
            if (slots[0] === slots[1] && slots[1] === slots[2]) {
                if (slots[0] === '💎') {
                    winMultiplier = 50; // 50x jackpot
                    winType = '💎 DIAMOND JACKPOT! 💎';
                } else if (slots[0] === '⭐') {
                    winMultiplier = 30; // 30x
                    winType = '⭐ STAR JACKPOT! ⭐';
                } else if (slots[0] === '🍀') {
                    winMultiplier = 20; // 20x
                    winType = '🍀 LUCKY JACKPOT! 🍀';
                } else if (slots[0] === '🔔') {
                    winMultiplier = 15; // 15x
                    winType = '🔔 BELL JACKPOT! 🔔';
                } else {
                    winMultiplier = 10; // 10x diğer üçlüler
                    winType = `${slots[0]} TRIPLE MATCH! ${slots[0]}`;
                }
            }
            // İkili (2 aynı)
            else if (slots[0] === slots[1] || slots[1] === slots[2] || slots[0] === slots[2]) {
                if (slots.includes('💎')) {
                    winMultiplier = 5;
                    winType = '💎 Diamond Pair!';
                } else if (slots.includes('⭐')) {
                    winMultiplier = 3;
                    winType = '⭐ Star Pair!';
                } else if (slots.includes('🍀')) {
                    winMultiplier = 2;
                    winType = '🍀 Lucky Pair!';
                } else {
                    winMultiplier = 1.5;
                    winType = 'Pair Match!';
                }
            }

            const won = winMultiplier > 0;
            let newBalance;
            let winAmount = 0;

            if (won) {
                winAmount = Math.floor(bet * winMultiplier);
                newBalance = currentBalance + winAmount - bet; // Kazanç - bahis
            } else {
                newBalance = currentBalance - bet; // Sadece bahis kaybı
            }

            // Bakiyeyi güncelle
            await guildMember.update({ balance: newBalance });

            // Sonuç mesajı
            const resultEmbed = new EmbedBuilder()
                .setColor(won ? (winMultiplier >= 20 ? '#ffff00' : winMultiplier >= 10 ? '#ff4500' : '#00ff00') : '#ff0000')
                .setTitle(won ? (winMultiplier >= 20 ? '🎰 MEGA WIN! 🎰' : '🎉 Kazandın!') : '😢 Şansını dene!')
                .setThumbnail(interaction.user.displayAvatarURL());

            // Slot gösterimi
            const slotDisplay = `
┌─────────────────┐
│  🎰  S L O T S  🎰  │
├─────────────────┤
│     ${slots[0]}  ${slots[1]}  ${slots[2]}     │
├─────────────────┤
│  💰 ${won ? winType : 'Tekrar Dene!'} 💰  │
└─────────────────┘`;

            resultEmbed.setDescription(`\`\`\`${slotDisplay}\`\`\``);

            resultEmbed.addFields(
                {
                    name: '💰 Bahis',
                    value: `${bet.toLocaleString()} coin`,
                    inline: true
                }
            );

            if (won) {
                resultEmbed.addFields(
                    {
                        name: '🎁 Kazanç',
                        value: `${winAmount.toLocaleString()} coin (${winMultiplier}x)`,
                        inline: true
                    },
                    {
                        name: '📈 Net Kazanç',
                        value: `+${(winAmount - bet).toLocaleString()} coin`,
                        inline: true
                    },
                    {
                        name: '💳 Yeni Bakiye',
                        value: `${newBalance.toLocaleString()} coin`,
                        inline: false
                    }
                );
            } else {
                resultEmbed.addFields(
                    {
                        name: '💸 Kayıp',
                        value: `-${bet.toLocaleString()} coin`,
                        inline: true
                    },
                    {
                        name: '💳 Yeni Bakiye',
                        value: `${newBalance.toLocaleString()} coin`,
                        inline: true
                    }
                );
            }

            resultEmbed.setTimestamp()
                .setFooter({ 
                    text: won ? (winMultiplier >= 20 ? 'LEGENDARY WIN! 🏆' : 'Lucky spin! 🍀') : 'Better luck next time! 🎰', 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            // Real-time güncelleme gönder
            if (global.realtimeUpdates) {
                global.realtimeUpdates.economyUpdate(interaction.guild.id, interaction.user.id, {
                    type: 'slots_result',
                    won: won,
                    bet: bet,
                    slots: slots,
                    winMultiplier: winMultiplier,
                    winAmount: winAmount,
                    newBalance: newBalance,
                    user: {
                        id: interaction.user.id,
                        username: interaction.user.username,
                        avatar: interaction.user.displayAvatarURL()
                    }
                });
            }

            await interaction.editReply({ embeds: [resultEmbed] });

            logger.info(`Slots oyunu: ${interaction.user.username} - Bahis: ${bet}, Sonuç: ${won ? `Kazandı (${winMultiplier}x)` : 'Kaybetti'}`, {
                user: interaction.user.id,
                guild: interaction.guild.id,
                bet: bet,
                won: won,
                slots: slots,
                winMultiplier: winMultiplier,
                winAmount: winAmount
            });

        } catch (error) {
            logger.error('Slots komut hatası', error, {
                user: interaction.user.id,
                guild: interaction.guild.id,
                bet: bet
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Slots oynarken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};
