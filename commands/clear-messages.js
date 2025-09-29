const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-messages')
        .setDescription('🗑️ Mesajları sil (moderasyon)')
        .addIntegerOption(option =>
            option.setName('sayı')
                .setDescription('Silinecek mesaj sayısı (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Sadece belirli kullanıcının mesajlarını sil')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('bot-mesajları')
                .setDescription('Bot mesajlarını da sil (varsayılan: false)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            // Permission kontrolü
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetkisiz Erişim')
                    .setDescription('Bu komutu kullanmak için **Mesajları Yönet** iznine sahip olmalısın!')
                    .setTimestamp();

                return interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }

            const amount = interaction.options.getInteger('sayı');
            const targetUser = interaction.options.getUser('kullanıcı');
            const includeBots = interaction.options.getBoolean('bot-mesajları') || false;

            await interaction.deferReply({ ephemeral: true });

            try {
                // Mesajları fetch et
                const messages = await interaction.channel.messages.fetch({ 
                    limit: Math.min(amount + 10, 100) // Biraz fazla fetch et filtering için
                });

                let messagesToDelete = messages.filter(msg => {
                    // 14 günden eski mesajları filtrele (Discord API limiti)
                    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
                    if (msg.createdTimestamp < twoWeeksAgo) return false;

                    // Kullanıcı filtresi
                    if (targetUser && msg.author.id !== targetUser.id) return false;

                    // Bot mesajları filtresi
                    if (!includeBots && msg.author.bot) return false;

                    return true;
                });

                // İstenen sayıya sınırla
                messagesToDelete = messagesToDelete.first(amount);

                if (messagesToDelete.size === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ffa500')
                        .setTitle('⚠️ Uyarı')
                        .setDescription('Silinecek uygun mesaj bulunamadı!\n\n**Not:** 14 günden eski mesajlar silinemez.')
                        .setTimestamp();

                    return interaction.editReply({ embeds: [errorEmbed] });
                }

                // Mesajları sil
                const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

                // Kullanıcı istatistikleri
                const userStats = {};
                deletedMessages.forEach(msg => {
                    const userId = msg.author.id;
                    const username = msg.author.username;
                    if (!userStats[userId]) {
                        userStats[userId] = { username, count: 0 };
                    }
                    userStats[userId].count++;
                });

                const statsText = Object.values(userStats)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map(stat => `• **${stat.username}**: ${stat.count} mesaj`)
                    .join('\n') || 'Hiçbir mesaj silinmedi';

                const successEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Mesajlar Silindi')
                    .setDescription(`**${deletedMessages.size}** mesaj başarıyla silindi!`)
                    .addFields(
                        { 
                            name: '📊 İstatistikler', 
                            value: statsText, 
                            inline: false 
                        },
                        { 
                            name: '👤 Moderatör', 
                            value: interaction.user.toString(), 
                            inline: true 
                        },
                        { 
                            name: '📍 Kanal', 
                            value: interaction.channel.toString(), 
                            inline: true 
                        }
                    )
                    .setFooter({ 
                        text: `Toplam ${deletedMessages.size} mesaj silindi`, 
                        iconURL: interaction.user.displayAvatarURL() 
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [successEmbed] });

                // Mod log kanalına bildirim gönder
                try {
                    const { Guild } = require('../models');
                    const guildData = await Guild.findOne({ where: { id: interaction.guild.id } });
                    
                    if (guildData?.modLogChannelId) {
                        const modLogChannel = interaction.guild.channels.cache.get(guildData.modLogChannelId);
                        if (modLogChannel && modLogChannel.id !== interaction.channel.id) {
                            const logEmbed = new EmbedBuilder()
                                .setColor('#ff9900')
                                .setTitle('🗑️ Mesaj Silme İşlemi')
                                .addFields(
                                    { name: '👤 Moderatör', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                                    { name: '📍 Kanal', value: `${interaction.channel} (${interaction.channel.name})`, inline: true },
                                    { name: '📊 Silinen Mesaj', value: `${deletedMessages.size} mesaj`, inline: true },
                                    { name: '🎯 Hedef Kullanıcı', value: targetUser ? `${targetUser} (${targetUser.tag})` : 'Tümü', inline: true },
                                    { name: '🤖 Bot Mesajları', value: includeBots ? 'Dahil' : 'Hariç', inline: true },
                                    { name: '⏰ Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                                )
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setTimestamp();

                            await modLogChannel.send({ embeds: [logEmbed] });
                        }
                    }
                } catch (logError) {
                    console.error('Mod log gönderme hatası:', logError);
                }

            } catch (deleteError) {
                console.error('Mesaj silme hatası:', deleteError);

                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Silme Hatası')
                    .setDescription('Mesajlar silinirken bir hata oluştu!\n\n**Olası Sebepler:**\n• 14 günden eski mesajlar\n• Yetersiz bot izinleri\n• Discord API hatası')
                    .addFields({
                        name: '🔧 Çözüm Önerileri',
                        value: '• Daha az mesaj silmeyi deneyin\n• Bot izinlerini kontrol edin\n• Birkaç dakika sonra tekrar deneyin',
                        inline: false
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            console.error('Clear messages komutu hatası:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Komut çalıştırılırken bir hata oluştu!')
                .setFooter({ text: 'Hata devam ederse yöneticiye başvurun' })
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    },
};
