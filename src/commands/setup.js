const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { Settings } = require('../models/index');
const { logger } = require('../utils/logger');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('⚙️ Sunucu ayarlarını yapılandır')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('👋 Karşılama sistemi ayarları')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Karşılama mesajları gönderilecek kanal')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('aktif')
                        .setDescription('Karşılama sistemini aktif/pasif yap')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('moderation')
                .setDescription('🛡️ Moderasyon ayarları')
                .addRoleOption(option =>
                    option.setName('mod-rolü')
                        .setDescription('Moderatör rolü')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('mute-rolü')
                        .setDescription('Mute rolü')
                        .setRequired(false)
                )
                .addChannelOption(option =>
                    option.setName('log-kanalı')
                        .setDescription('Moderasyon logları için kanal')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('auto-mod')
                        .setDescription('Otomatik moderasyonu aktif/pasif yap')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('👀 Mevcut sunucu ayarlarını görüntüle')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('🔄 Tüm ayarları varsayılan değerlere sıfırla')
                .addBooleanOption(option =>
                    option.setName('confirm')
                        .setDescription('Sıfırlama işlemini onayla (true yazın)')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'welcome':
                    await handleWelcomeSetup(interaction);
                    break;
                case 'moderation':
                    await handleModerationSetup(interaction);
                    break;
                case 'view':
                    await handleViewSettings(interaction);
                    break;
                case 'reset':
                    await handleResetSettings(interaction);
                    break;
            }

        } catch (error) {
            logger.error('Setup command error', error, {
                guild: interaction.guild.name,
                user: interaction.user.tag
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Ayar yapılandırılırken bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};

// Karşılama ayarları
async function handleWelcomeSetup(interaction) {
    const channel = interaction.options.getChannel('kanal');
    const enabled = interaction.options.getBoolean('aktif');

    const currentSettings = await Settings.getGuildSettings(interaction.guild.id);
    const updates = {};

    if (channel !== null) {
        updates.welcomeChannel = channel.id;
    }

    if (enabled !== null) {
        updates.welcomeEnabled = enabled;
    }

    if (Object.keys(updates).length === 0) {
        // Mevcut ayarları göster
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('👋 Karşılama Sistemi Ayarları')
            .addFields(
                {
                    name: '📊 Durum',
                    value: currentSettings.welcomeEnabled ? '✅ Aktif' : '❌ Pasif',
                    inline: true
                },
                {
                    name: '📺 Kanal',
                    value: currentSettings.welcomeChannel ? `<#${currentSettings.welcomeChannel}>` : 'Ayarlanmamış',
                    inline: true
                }
            )
            .setFooter({ text: 'Ayarları değiştirmek için parametreleri kullanın' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    // Ayarları güncelle
    await Settings.updateGuildSettings(interaction.guild.id, updates);

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Karşılama Ayarları Güncellendi')
        .setDescription('Ayarlarınız başarıyla kaydedildi!');

    if (updates.welcomeChannel) {
        embed.addFields({
            name: '📺 Yeni Kanal',
            value: `<#${updates.welcomeChannel}>`,
            inline: true
        });
    }

    if (updates.welcomeEnabled !== undefined) {
        embed.addFields({
            name: '📊 Durum',
            value: updates.welcomeEnabled ? '✅ Aktif' : '❌ Pasif',
            inline: true
        });
    }

    await interaction.reply({ embeds: [embed] });
}

// Moderasyon ayarları
async function handleModerationSetup(interaction) {
    const modRole = interaction.options.getRole('mod-rolü');
    const muteRole = interaction.options.getRole('mute-rolü');
    const logChannel = interaction.options.getChannel('log-kanalı');
    const autoMod = interaction.options.getBoolean('auto-mod');

    const updates = {};

    if (modRole) updates.modRole = modRole.id;
    if (muteRole) updates.muteRole = muteRole.id;
    if (logChannel) updates.logChannel = logChannel.id;
    if (autoMod !== null) updates.autoMod = { ...updates.autoMod, enabled: autoMod };

    if (Object.keys(updates).length === 0) {
        // Mevcut ayarları göster
        const currentSettings = await Settings.getGuildSettings(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🛡️ Moderasyon Sistemi Ayarları')
            .addFields(
                {
                    name: '👮 Moderatör Rolü',
                    value: currentSettings.modRole ? `<@&${currentSettings.modRole}>` : 'Ayarlanmamış',
                    inline: true
                },
                {
                    name: '🔇 Mute Rolü',
                    value: currentSettings.muteRole ? `<@&${currentSettings.muteRole}>` : 'Ayarlanmamış',
                    inline: true
                },
                {
                    name: '📝 Log Kanalı',
                    value: currentSettings.logChannel ? `<#${currentSettings.logChannel}>` : 'Ayarlanmamış',
                    inline: true
                },
                {
                    name: '🤖 Otomatik Moderasyon',
                    value: currentSettings.autoMod?.enabled ? '✅ Aktif' : '❌ Pasif',
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    // Ayarları güncelle
    await Settings.updateGuildSettings(interaction.guild.id, updates);

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Moderasyon Ayarları Güncellendi')
        .setDescription('Moderasyon ayarlarınız başarıyla kaydedildi!');

    if (modRole) {
        embed.addFields({
            name: '👮 Moderatör Rolü',
            value: `${modRole}`,
            inline: true
        });
    }

    if (muteRole) {
        embed.addFields({
            name: '🔇 Mute Rolü',
            value: `${muteRole}`,
            inline: true
        });
    }

    if (logChannel) {
        embed.addFields({
            name: '📝 Log Kanalı',
            value: `${logChannel}`,
            inline: true
        });
    }

    await interaction.reply({ embeds: [embed] });
}

// Ayarları görüntüleme
async function handleViewSettings(interaction) {
    const settings = await Settings.getGuildSettings(interaction.guild.id);

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('⚙️ Sunucu Ayarları')
        .setDescription(`**${interaction.guild.name}** sunucusunun mevcut ayarları`)
        .addFields(
            {
                name: '👋 Karşılama Sistemi',
                value: `**Durum:** ${settings.welcomeEnabled ? '✅ Aktif' : '❌ Pasif'}\n**Kanal:** ${settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : 'Ayarlanmamış'}`,
                inline: true
            },
            {
                name: '🛡️ Moderasyon',
                value: `**Auto-Mod:** ${settings.autoMod?.enabled ? '✅' : '❌'}\n**Mod Rolü:** ${settings.modRole ? `<@&${settings.modRole}>` : 'Yok'}\n**Log Kanalı:** ${settings.logChannel ? `<#${settings.logChannel}>` : 'Yok'}`,
                inline: true
            },
            {
                name: '🎛️ Aktif Özellikler',
                value: `${settings.features?.music ? '🎵' : '❌'} Müzik\n${settings.features?.economy ? '💰' : '❌'} Ekonomi\n${settings.features?.leveling ? '📊' : '❌'} Seviye\n${settings.features?.tickets ? '🎫' : '❌'} Ticket`,
                inline: true
            }
        )
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setFooter({ text: 'Ayarları değiştirmek için web dashboard kullanın: https://neuroviabot.xyz/dashboard' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Ayarları sıfırlama
async function handleResetSettings(interaction) {
    const confirm = interaction.options.getBoolean('confirm');

    if (!confirm) {
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('⚠️ Sıfırlama Onayı')
            .setDescription('Tüm sunucu ayarlarını sıfırlamak istediğinizden emin misiniz?\n\n`/setup reset confirm:True` komutuyla onaylayın.')
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: 64 });
    }

    // Default ayarları oluştur
    const defaultSettings = {
        guildId: interaction.guild.id,
        prefix: '!',
        welcomeEnabled: true,
        welcomeChannel: null,
        leaveEnabled: true,
        leaveChannel: null,
        autoRole: null,
        modRole: null,
        muteRole: null,
        logChannel: null,
        features: {
            music: true,
            economy: true,
            moderation: true,
            leveling: true,
            tickets: true,
            giveaways: true
        },
        autoMod: {
            enabled: false,
            deleteInvites: false,
            deleteSpam: false,
            filterWords: []
        }
    };

    await Settings.updateGuildSettings(interaction.guild.id, defaultSettings);

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Ayarlar Sıfırlandı')
        .setDescription('Tüm sunucu ayarları varsayılan değerlere sıfırlandı!')
        .addFields({
            name: '🔄 Sıfırlanan Ayarlar',
            value: '• Karşılama sistemi\n• Moderasyon ayarları\n• Özellik durumları\n• Rol ve kanal atamaları',
            inline: false
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}
