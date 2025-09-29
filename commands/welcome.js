const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { Guild } = require('../models');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('👋 Hoş geldin sistemi ayarları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('📝 Hoş geldin sistemini kur')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Hoş geldin mesajlarının gönderileceği kanal')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('mesaj')
                        .setDescription('Hoş geldin mesajı ({user}, {guild}, {memberCount} değişkenleri kullanılabilir)')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Yeni üyelere otomatik verilecek rol')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('dm-mesaj')
                        .setDescription('Yeni üyelere DM ile hoş geldin mesajı gönderilsin mi?')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('❌ Hoş geldin sistemini devre dışı bırak')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('🧪 Hoş geldin mesajını test et')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave-setup')
                .setDescription('👋 Ayrılma sistemi kur')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Ayrılma mesajlarının gönderileceği kanal')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('mesaj')
                        .setDescription('Ayrılma mesajı ({user}, {guild}, {memberCount} değişkenleri kullanılabilir)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('⚙️ Mevcut ayarları görüntüle')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Yetki kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
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
                case 'disable':
                    await this.handleDisable(interaction);
                    break;
                case 'test':
                    await this.handleTest(interaction);
                    break;
                case 'leave-setup':
                    await this.handleLeaveSetup(interaction);
                    break;
                case 'settings':
                    await this.handleSettings(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Welcome komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Welcome Hatası')
                .setDescription('Welcome işlemi sırasında bir hata oluştu!')
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
        const message = interaction.options.getString('mesaj') || 'Hoş geldin {user}! {guild} sunucumuzda artık {memberCount} kişiyiz! 🎉';
        const role = interaction.options.getRole('rol');
        const dmMessage = interaction.options.getBoolean('dm-mesaj') || false;

        await interaction.deferReply();

        try {
            // Guild ayarlarını güncelle
            await Guild.update({
                welcomeEnabled: true,
                welcomeChannelId: channel.id,
                welcomeMessage: message,
                memberRoleId: role?.id || null,
                dmWelcome: dmMessage,
                dmWelcomeMessage: dmMessage ? `Hoş geldin! ${interaction.guild.name} sunucusuna katıldın! 🎉` : null
            }, {
                where: { id: interaction.guild.id }
            });

            const setupEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Hoş Geldin Sistemi Kuruldu')
                .setDescription('Hoş geldin sistemi başarıyla kuruldu!')
                .addFields(
                    { name: '📍 Kanal', value: `${channel}`, inline: true },
                    { name: '👋 Mesaj', value: message.length > 100 ? message.substring(0, 100) + '...' : message, inline: false },
                    { name: '🎭 Otomatik Rol', value: role ? `${role}` : 'Ayarlanmadı', inline: true },
                    { name: '💬 DM Mesajı', value: dmMessage ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '📊 Durum', value: '✅ Aktif', inline: true }
                )
                .setFooter({
                    text: 'Yeni üyeler bu ayarlara göre karşılanacak!',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [setupEmbed] });

        } catch (error) {
            logger.error('Welcome setup hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kurulum Hatası')
                .setDescription('Hoş geldin sistemi kurulurken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleDisable(interaction) {
        await interaction.deferReply();

        try {
            await Guild.update({
                welcomeEnabled: false,
                leaveEnabled: false
            }, {
                where: { id: interaction.guild.id }
            });

            const disableEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hoş Geldin Sistemi Devre Dışı')
                .setDescription('Hoş geldin sistemi devre dışı bırakıldı!')
                .addFields({
                    name: '📊 Durum',
                    value: '❌ Pasif',
                    inline: true
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [disableEmbed] });

        } catch (error) {
            logger.error('Welcome disable hatası', error);
        }
    },

    async handleTest(interaction) {
        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });

        if (!guild || !guild.welcomeEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sistem Kapalı')
                .setDescription('Hoş geldin sistemi aktif değil!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            // Test mesajını oluştur
            const testMessage = this.formatWelcomeMessage(guild.welcomeMessage, interaction.user, interaction.guild);
            
            const testEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🧪 Hoş Geldin Mesajı Testi')
                .setDescription(testMessage)
                .addFields(
                    { name: '📍 Hedef Kanal', value: `<#${guild.welcomeChannelId}>`, inline: true },
                    { name: '🎭 Otomatik Rol', value: guild.memberRoleId ? `<@&${guild.memberRoleId}>` : 'Yok', inline: true },
                    { name: '💬 DM Mesajı', value: guild.dmWelcome ? '✅ Gönderilecek' : '❌ Gönderilmeyecek', inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({
                    text: 'Bu bir test mesajıdır',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [testEmbed] });

            // Test mesajını welcome kanalına da gönder
            const welcomeChannel = await interaction.guild.channels.fetch(guild.welcomeChannelId).catch(() => null);
            if (welcomeChannel) {
                const actualWelcomeEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('👋 Hoş Geldin!')
                    .setDescription(testMessage)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({
                        text: '🧪 Bu bir test mesajıdır',
                        iconURL: interaction.guild.iconURL()
                    })
                    .setTimestamp();

                await welcomeChannel.send({ 
                    content: '🧪 **TEST MESAJI** 🧪',
                    embeds: [actualWelcomeEmbed] 
                });
            }

        } catch (error) {
            logger.error('Welcome test hatası', error);
        }
    },

    async handleLeaveSetup(interaction) {
        const channel = interaction.options.getChannel('kanal');
        const message = interaction.options.getString('mesaj') || '{user} sunucumuzu terk etti. Görüşürüz! 👋';

        await interaction.deferReply();

        try {
            await Guild.update({
                leaveEnabled: true,
                leaveChannelId: channel.id,
                leaveMessage: message
            }, {
                where: { id: interaction.guild.id }
            });

            const setupEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('✅ Ayrılma Sistemi Kuruldu')
                .setDescription('Ayrılma sistemi başarıyla kuruldu!')
                .addFields(
                    { name: '📍 Kanal', value: `${channel}`, inline: true },
                    { name: '👋 Mesaj', value: message, inline: false },
                    { name: '📊 Durum', value: '✅ Aktif', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [setupEmbed] });

        } catch (error) {
            logger.error('Leave setup hatası', error);
        }
    },

    async handleSettings(interaction) {
        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });

        if (!guild) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ayar Bulunamadı')
                .setDescription('Bu sunucu için ayar bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const settingsEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('⚙️ Welcome/Leave Ayarları')
            .setDescription(`${interaction.guild.name} sunucusunun mevcut ayarları:`)
            .addFields(
                { name: '👋 Hoş Geldin Sistemi', value: guild.welcomeEnabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                { name: '🚪 Ayrılma Sistemi', value: guild.leaveEnabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                { name: '📍 Hoş Geldin Kanalı', value: guild.welcomeChannelId ? `<#${guild.welcomeChannelId}>` : 'Ayarlanmadı', inline: true },
                { name: '📍 Ayrılma Kanalı', value: guild.leaveChannelId ? `<#${guild.leaveChannelId}>` : 'Ayarlanmadı', inline: true },
                { name: '🎭 Otomatik Rol', value: guild.memberRoleId ? `<@&${guild.memberRoleId}>` : 'Ayarlanmadı', inline: true },
                { name: '💬 DM Mesajı', value: guild.dmWelcome ? '✅ Aktif' : '❌ Pasif', inline: true }
            )
            .setThumbnail(interaction.guild.iconURL())
            .setTimestamp();

        if (guild.welcomeMessage) {
            settingsEmbed.addFields({
                name: '👋 Hoş Geldin Mesajı',
                value: guild.welcomeMessage.length > 200 ? guild.welcomeMessage.substring(0, 200) + '...' : guild.welcomeMessage,
                inline: false
            });
        }

        if (guild.leaveMessage) {
            settingsEmbed.addFields({
                name: '🚪 Ayrılma Mesajı',
                value: guild.leaveMessage.length > 200 ? guild.leaveMessage.substring(0, 200) + '...' : guild.leaveMessage,
                inline: false
            });
        }

        await interaction.reply({ embeds: [settingsEmbed] });
    },

    formatWelcomeMessage(message, user, guild) {
        return message
            .replace(/{user}/g, user.toString())
            .replace(/{username}/g, user.username)
            .replace(/{guild}/g, guild.name)
            .replace(/{memberCount}/g, guild.memberCount.toString())
            .replace(/{memberCount:ordinal}/g, this.getOrdinal(guild.memberCount));
    },

    getOrdinal(number) {
        const suffixes = ['inci', 'nci', 'üncü', 'ncü'];
        const lastDigit = number % 10;
        const lastTwoDigits = number % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return number + 'ncü';
        }

        return number + (suffixes[lastDigit - 1] || 'ncü');
    }
};



