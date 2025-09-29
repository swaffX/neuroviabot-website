const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('🪙 Yazı tura oyna ve bahis yap')
        .addIntegerOption(option =>
            option.setName('bahis')
                .setDescription('Bahis miktarı (minimum 10)')
                .setMinValue(10)
                .setMaxValue(10000)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('seçim')
                .setDescription('Yazı mı Tura mı?')
                .setRequired(true)
                .addChoices(
                    { name: '📝 Yazı', value: 'heads' },
                    { name: '👑 Tura', value: 'tails' }
                )
        ),

    async execute(interaction) {
        const bet = interaction.options.getInteger('bahis');
        const choice = interaction.options.getString('seçim');

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

            // Coinflip oyunu
            const outcomes = ['heads', 'tails'];
            const result = outcomes[Math.floor(Math.random() * outcomes.length)];
            const won = result === choice;
            
            let newBalance;
            let winAmount = 0;
            
            if (won) {
                winAmount = bet * 2; // Kazanırsa 2x kazanır
                newBalance = currentBalance + bet; // Bahis geri verilir + kazanç
            } else {
                newBalance = currentBalance - bet; // Bahis kaybedilir
            }

            // Bakiyeyi güncelle
            await guildMember.update({ balance: newBalance });

            // Sonuç mesajı
            const resultEmbed = new EmbedBuilder()
                .setColor(won ? '#00ff00' : '#ff0000')
                .setTitle(won ? '🎉 Kazandın!' : '😢 Kaybettin!')
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    {
                        name: '🪙 Sonuç',
                        value: result === 'heads' ? '📝 Yazı' : '👑 Tura',
                        inline: true
                    },
                    {
                        name: '🎯 Seçiminiz',
                        value: choice === 'heads' ? '📝 Yazı' : '👑 Tura',
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
                        value: `+${bet.toLocaleString()} coin`,
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
                    text: won ? 'Şansın açık! 🍀' : 'Bir dahaki sefere! 🎲', 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            // Real-time güncelleme gönder
            if (global.realtimeUpdates) {
                global.realtimeUpdates.economyUpdate(interaction.guild.id, interaction.user.id, {
                    type: 'coinflip_result',
                    won: won,
                    bet: bet,
                    result: result,
                    choice: choice,
                    newBalance: newBalance,
                    user: {
                        id: interaction.user.id,
                        username: interaction.user.username,
                        avatar: interaction.user.displayAvatarURL()
                    }
                });
            }

            await interaction.editReply({ embeds: [resultEmbed] });

            logger.info(`Coinflip oyunu: ${interaction.user.username} - Bahis: ${bet}, Sonuç: ${won ? 'Kazandı' : 'Kaybetti'}`, {
                user: interaction.user.id,
                guild: interaction.guild.id,
                bet: bet,
                won: won,
                result: result,
                choice: choice
            });

        } catch (error) {
            logger.error('Coinflip komut hatası', error, {
                user: interaction.user.id,
                guild: interaction.guild.id,
                bet: bet
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Coinflip oynarken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};
