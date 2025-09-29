const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('🎲 Zar at ve bahis yap')
        .addIntegerOption(option =>
            option.setName('bahis')
                .setDescription('Bahis miktarı (minimum 10)')
                .setMinValue(10)
                .setMaxValue(10000)
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('tahmin')
                .setDescription('Hangi sayının geleceğini tahmin et (1-6)')
                .setMinValue(1)
                .setMaxValue(6)
                .setRequired(true)
        ),

    async execute(interaction) {
        const bet = interaction.options.getInteger('bahis');
        const guess = interaction.options.getInteger('tahmin');

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

            // Zar atma
            const diceResult = Math.floor(Math.random() * 6) + 1;
            const won = diceResult === guess;
            
            let newBalance;
            let winAmount = 0;
            
            if (won) {
                winAmount = bet * 5; // Tam bilirse 6x kazanır (5x net kazanç)
                newBalance = currentBalance + winAmount;
            } else {
                newBalance = currentBalance - bet; // Bahis kaybedilir
            }

            // Bakiyeyi güncelle
            await guildMember.update({ balance: newBalance });

            // Zar emojileri
            const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

            // Sonuç mesajı
            const resultEmbed = new EmbedBuilder()
                .setColor(won ? '#00ff00' : '#ff0000')
                .setTitle(won ? '🎉 Muhteşem! Tam bildin!' : '😢 Bu sefer tutmadı!')
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    {
                        name: '🎲 Zar Sonucu',
                        value: `${diceEmojis[diceResult]} **${diceResult}**`,
                        inline: true
                    },
                    {
                        name: '🎯 Tahmininiz',
                        value: `${diceEmojis[guess]} **${guess}**`,
                        inline: true
                    },
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
                        value: `+${winAmount.toLocaleString()} coin (6x)`,
                        inline: true
                    },
                    {
                        name: '💳 Yeni Bakiye',
                        value: `${newBalance.toLocaleString()} coin`,
                        inline: true
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
                    text: won ? 'Incredible luck! 🍀' : 'Şans bir sonraki atışta! 🎲', 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            // Real-time güncelleme gönder
            if (global.realtimeUpdates) {
                global.realtimeUpdates.economyUpdate(interaction.guild.id, interaction.user.id, {
                    type: 'dice_result',
                    won: won,
                    bet: bet,
                    result: diceResult,
                    guess: guess,
                    newBalance: newBalance,
                    user: {
                        id: interaction.user.id,
                        username: interaction.user.username,
                        avatar: interaction.user.displayAvatarURL()
                    }
                });
            }

            await interaction.editReply({ embeds: [resultEmbed] });

            logger.info(`Dice oyunu: ${interaction.user.username} - Bahis: ${bet}, Sonuç: ${won ? 'Kazandı' : 'Kaybetti'}`, {
                user: interaction.user.id,
                guild: interaction.guild.id,
                bet: bet,
                won: won,
                result: diceResult,
                guess: guess
            });

        } catch (error) {
            logger.error('Dice komut hatası', error, {
                user: interaction.user.id,
                guild: interaction.guild.id,
                bet: bet
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Zar atarken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};
