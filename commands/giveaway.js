const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { Guild, Giveaway, GuildMember } = require('../models');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('🎉 Çekiliş sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('🎁 Yeni çekiliş oluştur')
                .addStringOption(option =>
                    option.setName('ödül')
                        .setDescription('Çekiliş ödülü')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('süre')
                        .setDescription('Çekiliş süresi (örn: 1h, 2d, 30m)')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('kazanan-sayısı')
                        .setDescription('Kazanan kişi sayısı')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false)
                )
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Çekilişin yapılacağı kanal (boş ise mevcut kanal)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('açıklama')
                        .setDescription('Çekiliş açıklaması')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('🏁 Çekilişi sonlandır')
                .addStringOption(option =>
                    option.setName('mesaj-id')
                        .setDescription('Çekiliş mesajının ID\'si')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reroll')
                .setDescription('🔄 Çekilişi yeniden çek')
                .addStringOption(option =>
                    option.setName('mesaj-id')
                        .setDescription('Çekiliş mesajının ID\'si')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('kazanan-sayısı')
                        .setDescription('Yeni kazanan sayısı (boş ise orijinal sayı)')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Aktif çekilişleri listele')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('participants')
                .setDescription('👥 Çekiliş katılımcılarını görüntüle')
                .addStringOption(option =>
                    option.setName('mesaj-id')
                        .setDescription('Çekiliş mesajının ID\'si')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('❌ Çekilişi iptal et')
                .addStringOption(option =>
                    option.setName('mesaj-id')
                        .setDescription('Çekiliş mesajının ID\'si')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Yetki kontrolü (create, end, reroll, cancel için)
        const adminCommands = ['create', 'end', 'reroll', 'cancel'];
        if (adminCommands.includes(subcommand) && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz Erişim')
                .setDescription('Bu komutu kullanabilmek için **Sunucuyu Yönet** yetkisine sahip olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'create':
                    await this.handleCreate(interaction);
                    break;
                case 'end':
                    await this.handleEnd(interaction);
                    break;
                case 'reroll':
                    await this.handleReroll(interaction);
                    break;
                case 'list':
                    await this.handleList(interaction);
                    break;
                case 'participants':
                    await this.handleParticipants(interaction);
                    break;
                case 'cancel':
                    await this.handleCancel(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Giveaway komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Çekiliş Hatası')
                .setDescription('Çekiliş işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleCreate(interaction) {
        const prize = interaction.options.getString('ödül');
        const duration = interaction.options.getString('süre');
        const winnerCount = interaction.options.getInteger('kazanan-sayısı') || 1;
        const channel = interaction.options.getChannel('kanal') || interaction.channel;
        const description = interaction.options.getString('açıklama') || '';

        // Süreyi parse et
        const durationMs = this.parseDuration(duration);
        if (!durationMs || durationMs < 60000 || durationMs > 2592000000) { // Min 1 dakika, Max 30 gün
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Süre')
                .setDescription('Çekiliş süresi 1 dakika ile 30 gün arasında olmalıdır!')
                .addFields({
                    name: '📝 Geçerli Formatlar',
                    value: '• `30m` - 30 dakika\n• `2h` - 2 saat\n• `1d` - 1 gün\n• `1w` - 1 hafta',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const endTime = new Date(Date.now() + durationMs);
            
            // Çekiliş embed'i oluştur
            const giveawayEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🎉 ÇEKİLİŞ! 🎉')
                .setDescription(`**${prize}**\n\n${description}`)
                .addFields(
                    { name: '🏆 Ödül', value: prize, inline: true },
                    { name: '👥 Kazanan Sayısı', value: winnerCount.toString(), inline: true },
                    { name: '⏰ Bitiş', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true },
                    { name: '🎫 Katılımcı', value: '0 kişi', inline: true },
                    { name: '🎭 Düzenleyen', value: interaction.user.username, inline: true },
                    { name: '📅 Başlangıç', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({
                    text: 'Katılmak için aşağıdaki butona tıklayın!',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp(endTime);

            // Katılım butonu
            const joinButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('giveaway_join')
                        .setLabel('🎉 Çekilişe Katıl')
                        .setStyle(ButtonStyle.Primary)
                );

            // Çekiliş mesajını gönder
            const giveawayMessage = await channel.send({
                content: '🎉 **YENİ ÇEKİLİŞ!** 🎉',
                embeds: [giveawayEmbed],
                components: [joinButton]
            });

            // Database'e kaydet
            const giveaway = await Giveaway.create({
                messageId: giveawayMessage.id,
                channelId: channel.id,
                guildId: interaction.guild.id,
                hosterId: interaction.user.id,
                title: 'Çekiliş',
                description: description,
                prize: prize,
                winnerCount: winnerCount,
                startTime: new Date(),
                endTime: endTime,
                duration: durationMs,
                status: 'active',
                participants: [],
                participantCount: 0,
                emoji: '🎉',
                color: '#ff6b6b'
            });

            // Başarı mesajı
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Çekiliş Oluşturuldu')
                .setDescription(`Çekiliş başarıyla oluşturuldu!`)
                .addFields(
                    { name: '🏆 Ödül', value: prize, inline: true },
                    { name: '👥 Kazanan Sayısı', value: winnerCount.toString(), inline: true },
                    { name: '📍 Kanal', value: `${channel}`, inline: true },
                    { name: '⏰ Süre', value: duration, inline: true },
                    { name: '🆔 Mesaj ID', value: giveawayMessage.id, inline: true },
                    { name: '📅 Bitiş', value: `<t:${Math.floor(endTime.getTime() / 1000)}:F>`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            // Otomatik sonlandırma için timer ayarla
            setTimeout(async () => {
                await this.endGiveaway(giveaway.id);
            }, durationMs);

        } catch (error) {
            logger.error('Çekiliş oluşturma hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Oluşturma Hatası')
                .setDescription('Çekiliş oluşturulurken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleEnd(interaction) {
        const messageId = interaction.options.getString('mesaj-id');

        const giveaway = await Giveaway.findOne({
            where: {
                messageId: messageId,
                guildId: interaction.guild.id,
                status: 'active'
            }
        });

        if (!giveaway) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Çekiliş Bulunamadı')
                .setDescription('Bu ID ile aktif bir çekiliş bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            await this.endGiveaway(giveaway.id);

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Çekiliş Sonlandırıldı')
                .setDescription(`**${giveaway.prize}** çekilişi başarıyla sonlandırıldı!`)
                .addFields({
                    name: '📊 Katılımcı Sayısı',
                    value: giveaway.participantCount.toString(),
                    inline: true
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            logger.error('Çekiliş sonlandırma hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sonlandırma Hatası')
                .setDescription('Çekiliş sonlandırılırken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleList(interaction) {
        const activeGiveaways = await Giveaway.findAll({
            where: {
                guildId: interaction.guild.id,
                status: 'active'
            },
            order: [['endTime', 'ASC']]
        });

        if (activeGiveaways.length === 0) {
            const noGiveawaysEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📋 Aktif Çekiliş Yok')
                .setDescription('Şu anda aktif bir çekiliş bulunmuyor!')
                .addFields({
                    name: '🎉 Yeni Çekiliş',
                    value: '`/giveaway create` komutu ile yeni çekiliş oluşturabilirsiniz!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [noGiveawaysEmbed] });
        }

        const listEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Aktif Çekilişler')
            .setDescription(`${activeGiveaways.length} aktif çekiliş bulunuyor:`)
            .setTimestamp();

        activeGiveaways.forEach((giveaway, index) => {
            const endTimestamp = Math.floor(new Date(giveaway.endTime).getTime() / 1000);
            listEmbed.addFields({
                name: `${index + 1}. ${giveaway.prize}`,
                value: `🎫 ${giveaway.participantCount} katılımcı\n👥 ${giveaway.winnerCount} kazanan\n⏰ <t:${endTimestamp}:R>\n🆔 \`${giveaway.messageId}\``,
                inline: true
            });
        });

        await interaction.reply({ embeds: [listEmbed] });
    },

    // Yardımcı metodlar
    parseDuration(duration) {
        const regex = /^(\d+)([smhdw])$/i;
        const match = duration.match(regex);
        
        if (!match) return null;
        
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000
        };
        
        return value * multipliers[unit];
    },

    async endGiveaway(giveawayId) {
        try {
            const giveaway = await Giveaway.findByPk(giveawayId);
            if (!giveaway || giveaway.status !== 'active') return;

            // Kazananları seç
            const participants = giveaway.participants || [];
            const winners = this.selectWinners(participants, giveaway.winnerCount);

            // Çekilişi güncelle
            await giveaway.update({
                status: 'ended',
                endedAt: new Date(),
                winners: winners,
                winnersPicked: true,
                winnersAnnounced: true
            });

            // Mesajı güncelle
            const guild = await interaction.client.guilds.fetch(giveaway.guildId);
            const channel = await guild.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(giveaway.messageId);

            const endedEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🎉 ÇEKİLİŞ BİTTİ! 🎉')
                .setDescription(`**${giveaway.prize}**\n\n${giveaway.description}`)
                .addFields(
                    { name: '🏆 Ödül', value: giveaway.prize, inline: true },
                    { name: '👥 Toplam Katılımcı', value: giveaway.participantCount.toString(), inline: true },
                    { name: '🎯 Kazanan Sayısı', value: winners.length.toString(), inline: true }
                )
                .setFooter({
                    text: 'Çekiliş sona erdi!',
                    iconURL: guild.iconURL()
                })
                .setTimestamp();

            if (winners.length > 0) {
                const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
                endedEmbed.addFields({
                    name: '🎊 Kazananlar',
                    value: winnerMentions,
                    inline: false
                });

                await message.edit({
                    content: `🎉 **ÇEKİLİŞ BİTTİ!** 🎉\n\nTebrikler ${winnerMentions}! **${giveaway.prize}** kazandınız!`,
                    embeds: [endedEmbed],
                    components: []
                });

                // Kazananlara DM gönder
                for (const winnerId of winners) {
                    try {
                        const winner = await interaction.client.users.fetch(winnerId);
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('🎉 Çekiliş Kazandınız!')
                            .setDescription(`**${guild.name}** sunucusundaki **${giveaway.prize}** çekilişini kazandınız!`)
                            .addFields({
                                name: '🎁 Ödülünüz',
                                value: giveaway.prize,
                                inline: false
                            })
                            .setTimestamp();

                        await winner.send({ embeds: [dmEmbed] });
                    } catch (error) {
                        logger.error('Çekiliş kazanan DM hatası', error);
                    }
                }
            } else {
                endedEmbed.addFields({
                    name: '😢 Kazanan Yok',
                    value: 'Çekilişe kimse katılmadığı için kazanan seçilemedi.',
                    inline: false
                });

                await message.edit({
                    content: '🎉 **ÇEKİLİŞ BİTTİ!** 🎉\n\nMaalesef kimse katılmadığı için kazanan yok.',
                    embeds: [endedEmbed],
                    components: []
                });
            }

        } catch (error) {
            logger.error('Çekiliş sonlandırma hatası', error);
        }
    },

    selectWinners(participants, winnerCount) {
        if (participants.length === 0) return [];
        
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(winnerCount, participants.length));
    }
};



