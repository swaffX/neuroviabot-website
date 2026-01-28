const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { Guild, GuildMember } = require('../models');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('✅ Doğrulama sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('⚙️ Doğrulama sistemini kur')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Doğrulama mesajının gönderileceği kanal')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('doğrulanmamış-rol')
                        .setDescription('Doğrulanmamış üyelere verilecek rol')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('doğrulanmış-rol')
                        .setDescription('Doğrulanmış üyelere verilecek rol')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('tür')
                        .setDescription('Doğrulama türü')
                        .addChoices(
                            { name: '🔘 Button', value: 'button' },
                            { name: '🎯 Captcha', value: 'captcha' },
                            { name: '⚡ Reaction', value: 'reaction' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('force')
                .setDescription('🔄 Kullanıcıyı manuel doğrula')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Doğrulanacak kullanıcı')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unverify')
                .setDescription('❌ Kullanıcının doğrulamasını kaldır')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Doğrulaması kaldırılacak kullanıcı')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Doğrulama istatistikleri')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('⚙️ Doğrulama ayarları')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Yetki kontrolü (admin komutları için)
        const adminCommands = ['setup', 'force', 'unverify'];
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
                case 'setup':
                    await this.handleSetup(interaction);
                    break;
                case 'force':
                    await this.handleForce(interaction);
                    break;
                case 'unverify':
                    await this.handleUnverify(interaction);
                    break;
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                case 'settings':
                    await this.handleSettings(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Verify komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Doğrulama Hatası')
                .setDescription('Doğrulama işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleSetup(interaction) {
        const channel = interaction.options.getChannel('kanal');
        const unverifiedRole = interaction.options.getRole('doğrulanmamış-rol');
        const verifiedRole = interaction.options.getRole('doğrulanmış-rol');
        const verificationType = interaction.options.getString('tür') || 'button';

        await interaction.deferReply();

        try {
            // Guild ayarlarını güncelle
            await Guild.update({
                verificationEnabled: true,
                verificationChannelId: channel.id,
                unverifiedRoleId: unverifiedRole.id,
                memberRoleId: verifiedRole?.id || null,
                verificationType: verificationType
            }, {
                where: { id: interaction.guild.id }
            });

            // Doğrulama mesajını oluştur
            let verifyEmbed, components;

            switch (verificationType) {
                case 'button':
                    verifyEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Sunucu Doğrulama')
                        .setDescription(`**${interaction.guild.name}** sunucusuna hoş geldiniz!\n\nSunucuya erişim sağlamak için aşağıdaki butona tıklayarak doğrulama işlemini tamamlayın.`)
                        .addFields(
                            { name: '📋 Kurallar', value: 'Doğrulamadan önce sunucu kurallarını okuduğunuzdan emin olun.', inline: false },
                            { name: '🔒 Güvenlik', value: 'Bu işlem spam ve bot saldırılarını önlemek için gereklidir.', inline: false },
                            { name: '💡 İpucu', value: 'Doğrulama işlemi sadece birkaç saniye sürer.', inline: false }
                        )
                        .setThumbnail(interaction.guild.iconURL())
                        .setFooter({
                            text: 'Doğrulamak için butona tıklayın',
                            iconURL: interaction.guild.iconURL()
                        })
                        .setTimestamp();

                    components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('verify_button')
                                    .setLabel('✅ Doğrula')
                                    .setStyle(ButtonStyle.Success)
                                    .setEmoji('✅')
                            )
                    ];
                    break;

                case 'captcha':
                    verifyEmbed = new EmbedBuilder()
                        .setColor('#ffa500')
                        .setTitle('🎯 Captcha Doğrulama')
                        .setDescription(`**${interaction.guild.name}** sunucusuna hoş geldiniz!\n\nBot olmadığınızı kanıtlamak için captcha doğrulaması yapmalısınız.`)
                        .addFields({
                            name: '🔍 Nasıl çalışır?',
                            value: 'Aşağıdaki butona tıklayarak captcha testini başlatın ve görseldeki kodu yazın.',
                            inline: false
                        })
                        .setThumbnail(interaction.guild.iconURL())
                        .setTimestamp();

                    components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('verify_captcha')
                                    .setLabel('🎯 Captcha Başlat')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('🎯')
                            )
                    ];
                    break;

                case 'reaction':
                    verifyEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('⚡ Reaction Doğrulama')
                        .setDescription(`**${interaction.guild.name}** sunucusuna hoş geldiniz!\n\nDoğrulamak için bu mesaja ✅ emojisi ile reaction verin.`)
                        .addFields({
                            name: '📝 Talimatlar',
                            value: '1. Bu mesajın altındaki ✅ emojisine tıklayın\n2. Otomatik olarak doğrulanacaksınız\n3. Sunucuya erişim sağlayacaksınız',
                            inline: false
                        })
                        .setThumbnail(interaction.guild.iconURL())
                        .setTimestamp();

                    components = [];
                    break;
            }

            // Doğrulama mesajını gönder
            const verifyMessage = await channel.send({
                embeds: [verifyEmbed],
                components: components
            });

            // Reaction doğrulama için emoji ekle
            if (verificationType === 'reaction') {
                await verifyMessage.react('✅');
            }

            // Başarı mesajı
            const setupEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Doğrulama Sistemi Kuruldu')
                .setDescription('Doğrulama sistemi başarıyla kuruldu!')
                .addFields(
                    { name: '📍 Kanal', value: `${channel}`, inline: true },
                    { name: '🔒 Doğrulanmamış Rol', value: `${unverifiedRole}`, inline: true },
                    { name: '✅ Doğrulanmış Rol', value: verifiedRole ? `${verifiedRole}` : 'Yok', inline: true },
                    { name: '🎯 Doğrulama Türü', value: this.getVerificationTypeText(verificationType), inline: true },
                    { name: '🆔 Mesaj ID', value: verifyMessage.id, inline: true },
                    { name: '📊 Durum', value: '✅ Aktif', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [setupEmbed] });

        } catch (error) {
            logger.error('Verification setup hatası', error);
        }
    },

    async handleForce(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcıları doğrulanamaz!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Bu kullanıcı sunucuda bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const result = await this.verifyUser(targetMember, interaction.guild);

            if (result.success) {
                const successEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Kullanıcı Doğrulandı')
                    .setDescription(`${targetUser} başarıyla doğrulandı!`)
                    .addFields(
                        { name: '👤 Kullanıcı', value: `${targetUser} (${targetUser.tag})`, inline: true },
                        { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                        { name: '📅 Doğrulama Tarihi', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Doğrulama Hatası')
                    .setDescription(`Doğrulama işlemi başarısız: ${result.error}`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            logger.error('Force verification hatası', error);
        }
    },

    async handleStats(interaction) {
        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });

        if (!guild || !guild.verificationEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Doğrulama Sistemi Kapalı')
                .setDescription('Bu sunucuda doğrulama sistemi etkin değil!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            // İstatistikleri topla
            const totalMembers = interaction.guild.memberCount;
            const verifiedCount = await GuildMember.count({
                where: {
                    guildId: interaction.guild.id,
                    verified: true
                }
            });
            const unverifiedCount = totalMembers - verifiedCount;

            // Bugünkü doğrulamalar
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayVerified = await GuildMember.count({
                where: {
                    guildId: interaction.guild.id,
                    verified: true,
                    verifiedAt: {
                        [require('sequelize').Op.gte]: today
                    }
                }
            });

            const verificationRate = totalMembers > 0 ? Math.round((verifiedCount / totalMembers) * 100) : 0;

            const statsEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Doğrulama İstatistikleri')
                .setDescription(`${interaction.guild.name} sunucusunun doğrulama verileri`)
                .addFields(
                    { name: '👥 Toplam Üye', value: totalMembers.toLocaleString(), inline: true },
                    { name: '✅ Doğrulanmış', value: verifiedCount.toLocaleString(), inline: true },
                    { name: '❌ Doğrulanmamış', value: unverifiedCount.toLocaleString(), inline: true },
                    { name: '📈 Doğrulama Oranı', value: `${verificationRate}%`, inline: true },
                    { name: '📅 Bugün Doğrulanan', value: todayVerified.toLocaleString(), inline: true },
                    { name: '🎯 Doğrulama Türü', value: this.getVerificationTypeText(guild.verificationType), inline: true }
                )
                .setFooter({
                    text: `Son güncelleme: ${new Date().toLocaleString('tr-TR')}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [statsEmbed] });

        } catch (error) {
            logger.error('Verification stats hatası', error);
        }
    },

    // Yardımcı fonksiyonlar
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
                    await member.roles.remove(unverifiedRole);
                }
            }

            // Doğrulanmış rolü ver
            if (guildSettings.memberRoleId) {
                const verifiedRole = await guild.roles.fetch(guildSettings.memberRoleId).catch(() => null);
                if (verifiedRole && !member.roles.cache.has(verifiedRole.id)) {
                    await member.roles.add(verifiedRole);
                }
            }

            // Database'i güncelle
            await GuildMember.update({
                verified: true,
                verifiedAt: new Date()
            }, {
                where: {
                    userId: member.user.id,
                    guildId: guild.id
                }
            });

            logger.info(`User verified: ${member.user.tag} in ${guild.name}`);
            return { success: true };

        } catch (error) {
            logger.error('User verification hatası', error);
            return { success: false, error: error.message };
        }
    },

    getVerificationTypeText(type) {
        switch (type) {
            case 'button': return '🔘 Button';
            case 'captcha': return '🎯 Captcha';
            case 'reaction': return '⚡ Reaction';
            default: return '❓ Bilinmiyor';
        }
    }
};





