const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { Guild, GuildMember } = require('../models');
const { logger } = require('../utils/logger');

class VerificationHandler {
    constructor(client) {
        this.client = client;
        this.captchaCodes = new Map(); // userId -> captcha code
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Button interactions
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'verify_button') {
                await this.handleButtonVerification(interaction);
            } else if (interaction.customId === 'verify_captcha') {
                await this.handleCaptchaStart(interaction);
            }
        });

        // Modal submissions
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isModalSubmit()) return;

            if (interaction.customId === 'captcha_modal') {
                await this.handleCaptchaSubmission(interaction);
            }
        });

        // Reaction handling
        this.client.on('messageReactionAdd', async (reaction, user) => {
            await this.handleReactionVerification(reaction, user);
        });

        // Auto-assign unverified role to new members
        this.client.on('guildMemberAdd', async (member) => {
            await this.handleNewMember(member);
        });
    }

    // Handler'ı yeniden başlat
    restart() {
        // VerificationHandler için özel restart gerekmez
        // Event listener'lar zaten kurulu
    }

    async handleButtonVerification(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const result = await this.verifyUser(interaction.member, interaction.guild);

            if (result.success) {
                const successEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Doğrulama Başarılı!')
                    .setDescription(`Tebrikler! **${interaction.guild.name}** sunucusunda başarıyla doğrulandınız!`)
                    .addFields(
                        { name: '🎉 Hoş Geldiniz', value: 'Artık sunucunun tüm özelliklerine erişebilirsiniz.', inline: false },
                        { name: '📋 Kurallar', value: 'Lütfen sunucu kurallarını okumayı unutmayın.', inline: false },
                        { name: '💬 Sohbet', value: 'Diğer üyelerle sohbet etmeye başlayabilirsiniz!', inline: false }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                await interaction.editReply({ embeds: [successEmbed] });

                // Welcome mesajı gönder (opsiyonel)
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle(`✅ ${interaction.guild.name} - Doğrulama Tamamlandı`)
                        .setDescription(`Tebrikler! **${interaction.guild.name}** sunucusunda başarıyla doğrulandınız!`)
                        .addFields({
                            name: '🎯 Sonraki Adımlar',
                            value: '• Sunucu kurallarını okuyun\n• Kendinizi tanıtın\n• Sohbete katılın ve eğlenin!',
                            inline: false
                        })
                        .setThumbnail(interaction.guild.iconURL())
                        .setTimestamp();

                    await interaction.user.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    logger.debug('Verification DM gönderilemedi', { user: interaction.user.tag, error: dmError.message });
                }

            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Doğrulama Hatası')
                    .setDescription(`Doğrulama işlemi başarısız oldu: ${result.error}`)
                    .addFields({
                        name: '🔄 Tekrar Deneyin',
                        value: 'Bir süre bekleyip tekrar deneyebilirsiniz.',
                        inline: false
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            logger.error('Button verification hatası', error);
        }
    }

    async handleCaptchaStart(interaction) {
        try {
            // Captcha kodu oluştur
            const captchaCode = this.generateCaptchaCode();
            this.captchaCodes.set(interaction.user.id, captchaCode);

            // Captcha modal oluştur
            const modal = new ModalBuilder()
                .setCustomId('captcha_modal')
                .setTitle('🎯 Captcha Doğrulama');

            const captchaInput = new TextInputBuilder()
                .setCustomId('captcha_code')
                .setLabel(`Bu kodu yazın: ${captchaCode}`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Captcha kodunu buraya yazın...')
                .setRequired(true)
                .setMaxLength(6)
                .setMinLength(6);

            const actionRow = new ActionRowBuilder().addComponents(captchaInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);

            // 5 dakika sonra captcha kodunu sil
            setTimeout(() => {
                this.captchaCodes.delete(interaction.user.id);
            }, 300000); // 5 dakika

        } catch (error) {
            logger.error('Captcha start hatası', error);
        }
    }

    async handleCaptchaSubmission(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const submittedCode = interaction.fields.getTextInputValue('captcha_code');
            const correctCode = this.captchaCodes.get(interaction.user.id);

            if (!correctCode) {
                const expiredEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Captcha Süresi Doldu')
                    .setDescription('Captcha kodunuzun süresi doldu. Lütfen tekrar deneyin.')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [expiredEmbed] });
            }

            if (submittedCode.toLowerCase() !== correctCode.toLowerCase()) {
                const wrongEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yanlış Captcha')
                    .setDescription('Captcha kodu yanlış! Lütfen tekrar deneyin.')
                    .addFields({
                        name: '🔄 Tekrar Denemek İçin',
                        value: 'Doğrulama mesajındaki "Captcha Başlat" butonuna tekrar tıklayın.',
                        inline: false
                    })
                    .setTimestamp();

                this.captchaCodes.delete(interaction.user.id);
                return await interaction.editReply({ embeds: [wrongEmbed] });
            }

            // Captcha doğru - kullanıcıyı doğrula
            this.captchaCodes.delete(interaction.user.id);
            const result = await this.verifyUser(interaction.member, interaction.guild);

            if (result.success) {
                const successEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎯 Captcha Başarılı!')
                    .setDescription(`Tebrikler! Captcha testini geçtiniz ve **${interaction.guild.name}** sunucusunda doğrulandınız!`)
                    .addFields({
                        name: '✅ Doğrulama Tamamlandı',
                        value: 'Artık sunucunun tüm özelliklerine erişebilirsiniz.',
                        inline: false
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Doğrulama Hatası')
                    .setDescription(`Captcha doğru ancak doğrulama işlemi başarısız: ${result.error}`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            logger.error('Captcha submission hatası', error);
        }
    }

    async handleReactionVerification(reaction, user) {
        try {
            // Bot kontrolü
            if (user.bot) return;

            // Partial reaction kontrolü
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    logger.error('Reaction fetch hatası', error);
                    return;
                }
            }

            // ✅ emoji kontrolü
            if (reaction.emoji.name !== '✅') return;

            // Guild ayarlarını kontrol et
            const guild = await Guild.findOne({ where: { id: reaction.message.guild.id } });
            if (!guild || !guild.verificationEnabled || guild.verificationType !== 'reaction') {
                return;
            }

            // Doğrulama kanalında mı?
            if (reaction.message.channel.id !== guild.verificationChannelId) {
                return;
            }

            // Guild member al
            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (!member) return;

            // Kullanıcı zaten doğrulanmış mı?
            const guildMember = await GuildMember.findOne({
                where: {
                    userId: user.id,
                    guildId: reaction.message.guild.id
                }
            });

            if (guildMember && guildMember.verified) {
                // Reaction'ı geri al
                try {
                    await reaction.users.remove(user.id);
                } catch (removeError) {
                    logger.debug('Reaction remove hatası', removeError);
                }
                return;
            }

            // Kullanıcıyı doğrula
            const result = await this.verifyUser(member, reaction.message.guild);

            if (result.success) {
                logger.info(`Reaction verification successful: ${user.tag} in ${reaction.message.guild.name}`);

                // DM ile bilgilendirme
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('⚡ Reaction Doğrulama Başarılı!')
                        .setDescription(`**${reaction.message.guild.name}** sunucusunda başarıyla doğrulandınız!`)
                        .addFields({
                            name: '✅ Doğrulama Tamamlandı',
                            value: 'Artık sunucunun tüm özelliklerine erişebilirsiniz.',
                            inline: false
                        })
                        .setThumbnail(reaction.message.guild.iconURL())
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    logger.debug('Verification DM gönderilemedi', { user: user.tag, error: dmError.message });
                }
            } else {
                logger.error('Reaction verification failed', { user: user.tag, error: result.error });
                
                // Reaction'ı geri al
                try {
                    await reaction.users.remove(user.id);
                } catch (removeError) {
                    logger.debug('Reaction remove hatası', removeError);
                }
            }

        } catch (error) {
            logger.error('Reaction verification handler hatası', error);
        }
    }

    async handleNewMember(member) {
        try {
            // Bot kontrolü
            if (member.user.bot) return;

            // Guild ayarlarını al
            const guild = await Guild.findOne({ where: { id: member.guild.id } });
            if (!guild || !guild.verificationEnabled) return;

            // Doğrulanmamış rolü ver
            if (guild.unverifiedRoleId) {
                const unverifiedRole = await member.guild.roles.fetch(guild.unverifiedRoleId).catch(() => null);
                if (unverifiedRole) {
                    await member.roles.add(unverifiedRole, 'Auto-assign unverified role');
                    logger.debug(`Unverified role assigned: ${member.user.tag} in ${member.guild.name}`);
                }
            }

            // Database kaydı oluştur
            await GuildMember.findOrCreate({
                where: {
                    userId: member.user.id,
                    guildId: member.guild.id
                },
                defaults: {
                    verified: false,
                    joinedAt: member.joinedAt
                }
            });

        } catch (error) {
            logger.error('New member verification setup hatası', error);
        }
    }

    async verifyUser(member, guild) {
        try {
            const guildSettings = await Guild.findOne({ where: { id: guild.id } });
            
            if (!guildSettings || !guildSettings.verificationEnabled) {
                return { success: false, error: 'Doğrulama sistemi aktif değil' };
            }

            // Doğrulanmamış rolü çıkar
            if (guildSettings.unverifiedRoleId) {
                const unverifiedRole = await guild.roles.fetch(guildSettings.unverifiedRoleId).catch(() => null);
                if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
                    await member.roles.remove(unverifiedRole, 'User verified');
                }
            }

            // Doğrulanmış rolü ver (eğer belirtilmişse)
            if (guildSettings.memberRoleId) {
                const verifiedRole = await guild.roles.fetch(guildSettings.memberRoleId).catch(() => null);
                if (verifiedRole && !member.roles.cache.has(verifiedRole.id)) {
                    await member.roles.add(verifiedRole, 'User verified');
                }
            }

            // Database'i güncelle
            await GuildMember.upsert({
                userId: member.user.id,
                guildId: guild.id,
                verified: true,
                verifiedAt: new Date(),
                joinedAt: member.joinedAt
            });

            logger.info(`User verified: ${member.user.tag} in ${guild.name}`);
            return { success: true };

        } catch (error) {
            logger.error('User verification hatası', error);
            return { success: false, error: error.message };
        }
    }

    generateCaptchaCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Cleanup eski captcha kodları
    cleanupCaptchaCodes() {
        // Bu fonksiyon gerektiğinde çağrılabilir
        // Şu anda setTimeout ile otomatik temizleniyor
    }
}

module.exports = VerificationHandler;





