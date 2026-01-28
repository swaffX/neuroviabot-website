const { EmbedBuilder } = require('discord.js');
const { Giveaway, GuildMember } = require('../models');
const { logger } = require('../utils/logger');

class GiveawayHandler {
    constructor(client) {
        this.client = client;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'giveaway_join') {
                await this.handleGiveawayJoin(interaction);
            }
        });
    }

    // Handler'ı yeniden başlat
    restart() {
        // GiveawayHandler için özel restart gerekmez
        // Event listener'lar zaten kurulu
    }

    async handleGiveawayJoin(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Çekilişi bul
            const giveaway = await Giveaway.findOne({
                where: {
                    messageId: interaction.message.id,
                    guildId: interaction.guild.id,
                    status: 'active'
                }
            });

            if (!giveaway) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Çekiliş Bulunamadı')
                    .setDescription('Bu çekiliş artık aktif değil!')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Çekiliş süresi dolmuş mu kontrol et
            if (new Date() > new Date(giveaway.endTime)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Çekiliş Sona Erdi')
                    .setDescription('Bu çekiliş sona ermiştir!')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const participants = giveaway.participants || [];
            const isParticipating = participants.includes(interaction.user.id);

            if (isParticipating) {
                // Çekilişten çık
                const newParticipants = participants.filter(id => id !== interaction.user.id);
                
                await giveaway.update({
                    participants: newParticipants,
                    participantCount: newParticipants.length
                });

                // Mesajı güncelle
                await this.updateGiveawayMessage(interaction.message, giveaway, newParticipants.length);

                const leftEmbed = new EmbedBuilder()
                    .setColor('#ffa500')
                    .setTitle('🚪 Çekilişten Ayrıldınız')
                    .setDescription(`**${giveaway.prize}** çekilişinden ayrıldınız!`)
                    .addFields({
                        name: '📊 Kalan Katılımcı',
                        value: newParticipants.length.toString(),
                        inline: true
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [leftEmbed] });

            } else {
                // Gereksinimler kontrolü (gelecekte eklenebilir)
                const requirements = giveaway.requirements || {};
                
                // Minimum seviye kontrolü
                if (requirements.minLevel) {
                    const guildMember = await GuildMember.findOne({
                        where: {
                            userId: interaction.user.id,
                            guildId: interaction.guild.id
                        }
                    });

                    if (!guildMember || (guildMember.level || 0) < requirements.minLevel) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Gereksinim Karşılanmıyor')
                            .setDescription(`Bu çekilişe katılmak için en az **${requirements.minLevel}** seviyesinde olmanız gerekiyor!`)
                            .addFields({
                                name: '📊 Mevcut Seviyeniz',
                                value: (guildMember?.level || 0).toString(),
                                inline: true
                            })
                            .setTimestamp();
                        
                        return interaction.editReply({ embeds: [errorEmbed] });
                    }
                }

                // Minimum mesaj kontrolü
                if (requirements.minMessages) {
                    const guildMember = await GuildMember.findOne({
                        where: {
                            userId: interaction.user.id,
                            guildId: interaction.guild.id
                        }
                    });

                    if (!guildMember || (guildMember.messageCount || 0) < requirements.minMessages) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Gereksinim Karşılanmıyor')
                            .setDescription(`Bu çekilişe katılmak için en az **${requirements.minMessages}** mesaj göndermiş olmanız gerekiyor!`)
                            .addFields({
                                name: '📊 Mevcut Mesaj Sayınız',
                                value: (guildMember?.messageCount || 0).toString(),
                                inline: true
                            })
                            .setTimestamp();
                        
                        return interaction.editReply({ embeds: [errorEmbed] });
                    }
                }

                // Gerekli roller kontrolü
                if (requirements.roles && requirements.roles.length > 0) {
                    const memberRoles = interaction.member.roles.cache;
                    const hasRequiredRole = requirements.roles.some(roleId => memberRoles.has(roleId));
                    
                    if (!hasRequiredRole) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Gerekli Rol Yok')
                            .setDescription('Bu çekilişe katılmak için gerekli role sahip değilsiniz!')
                            .setTimestamp();
                        
                        return interaction.editReply({ embeds: [errorEmbed] });
                    }
                }

                // Yasaklı roller kontrolü
                if (requirements.blacklistedRoles && requirements.blacklistedRoles.length > 0) {
                    const memberRoles = interaction.member.roles.cache;
                    const hasBlacklistedRole = requirements.blacklistedRoles.some(roleId => memberRoles.has(roleId));
                    
                    if (hasBlacklistedRole) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Katılım Yasağı')
                            .setDescription('Rolünüz nedeniyle bu çekilişe katılamazsınız!')
                            .setTimestamp();
                        
                        return interaction.editReply({ embeds: [errorEmbed] });
                    }
                }

                // Çekilişe katıl
                const newParticipants = [...participants, interaction.user.id];
                
                await giveaway.update({
                    participants: newParticipants,
                    participantCount: newParticipants.length
                });

                // Mesajı güncelle
                await this.updateGiveawayMessage(interaction.message, giveaway, newParticipants.length);

                const joinedEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎉 Çekilişe Katıldınız!')
                    .setDescription(`**${giveaway.prize}** çekilişine başarıyla katıldınız!`)
                    .addFields(
                        { name: '🏆 Ödül', value: giveaway.prize, inline: true },
                        { name: '👥 Kazanan Sayısı', value: giveaway.winnerCount.toString(), inline: true },
                        { name: '📊 Toplam Katılımcı', value: newParticipants.length.toString(), inline: true },
                        { name: '⏰ Kalan Süre', value: `<t:${Math.floor(new Date(giveaway.endTime).getTime() / 1000)}:R>`, inline: false }
                    )
                    .setFooter({
                        text: 'Tekrar butona tıklayarak çekilişten ayrılabilirsiniz',
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [joinedEmbed] });
            }

        } catch (error) {
            logger.error('Çekiliş katılım hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Katılım Hatası')
                .setDescription('Çekilişe katılırken bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }

    async updateGiveawayMessage(message, giveaway, participantCount) {
        try {
            const endTime = new Date(giveaway.endTime);
            
            const updatedEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🎉 ÇEKİLİŞ! 🎉')
                .setDescription(`**${giveaway.prize}**\n\n${giveaway.description}`)
                .addFields(
                    { name: '🏆 Ödül', value: giveaway.prize, inline: true },
                    { name: '👥 Kazanan Sayısı', value: giveaway.winnerCount.toString(), inline: true },
                    { name: '⏰ Bitiş', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true },
                    { name: '🎫 Katılımcı', value: `${participantCount} kişi`, inline: true },
                    { name: '🎭 Düzenleyen', value: `<@${giveaway.hosterId}>`, inline: true },
                    { name: '📅 Başlangıç', value: `<t:${Math.floor(new Date(giveaway.startTime).getTime() / 1000)}:F>`, inline: true }
                )
                .setFooter({
                    text: 'Katılmak için aşağıdaki butona tıklayın!',
                    iconURL: message.guild.iconURL()
                })
                .setTimestamp(endTime);

            await message.edit({ embeds: [updatedEmbed] });

        } catch (error) {
            logger.error('Çekiliş mesajı güncelleme hatası', error);
        }
    }
}

module.exports = GiveawayHandler;





