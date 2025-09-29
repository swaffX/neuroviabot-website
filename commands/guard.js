const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { Guild } = require('../models');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guard')
        .setDescription('🛡️ Sunucu koruma sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('⚙️ Guard sistemini kur')
                .addBooleanOption(option =>
                    option.setName('durum')
                        .setDescription('Guard sistemi aktif olsun mu?')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('anti-raid')
                        .setDescription('Anti-raid koruması aktif olsun mu?')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('max-katilim')
                        .setDescription('Dakikada maksimum katılım sayısı (varsayılan: 10)')
                        .setMinValue(1)
                        .setMaxValue(50)
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('raid-aksiyonu')
                        .setDescription('Raid tespit edildiğinde yapılacak işlem')
                        .addChoices(
                            { name: '👢 Kick', value: 'kick' },
                            { name: '🔨 Ban', value: 'ban' },
                            { name: '🔒 Lockdown', value: 'lockdown' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('📝 Whitelist yönetimi')
                .addStringOption(option =>
                    option.setName('işlem')
                        .setDescription('Yapılacak işlem')
                        .addChoices(
                            { name: '➕ Ekle', value: 'add' },
                            { name: '➖ Çıkar', value: 'remove' },
                            { name: '📋 Listele', value: 'list' }
                        )
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Whitelist\'e eklenecek/çıkarılacak kullanıcı')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Whitelist\'e eklenecek/çıkarılacak rol')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('automod')
                .setDescription('🤖 Otomatik moderasyon ayarları')
                .addBooleanOption(option =>
                    option.setName('anti-spam')
                        .setDescription('Anti-spam koruması')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('anti-link')
                        .setDescription('Link koruması')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('anti-caps')
                        .setDescription('Büyük harf koruması')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('anti-mention')
                        .setDescription('Mention spam koruması')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lockdown')
                .setDescription('🔒 Sunucu kilitleme')
                .addBooleanOption(option =>
                    option.setName('durum')
                        .setDescription('Lockdown aktif olsun mu?')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Lockdown sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('📊 Guard sistemi durumu')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('📋 Son guard olayları')
                .addIntegerOption(option =>
                    option.setName('sayı')
                        .setDescription('Gösterilecek olay sayısı (varsayılan: 10)')
                        .setMinValue(1)
                        .setMaxValue(50)
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Yetki kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz Erişim')
                .setDescription('Bu komutu kullanabilmek için **Yönetici** yetkisine sahip olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'setup':
                    await this.handleSetup(interaction);
                    break;
                case 'whitelist':
                    await this.handleWhitelist(interaction);
                    break;
                case 'automod':
                    await this.handleAutomod(interaction);
                    break;
                case 'lockdown':
                    await this.handleLockdown(interaction);
                    break;
                case 'status':
                    await this.handleStatus(interaction);
                    break;
                case 'logs':
                    await this.handleLogs(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Guard komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Guard Hatası')
                .setDescription('Guard işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleSetup(interaction) {
        const enabled = interaction.options.getBoolean('durum');
        const antiRaid = interaction.options.getBoolean('anti-raid') ?? true;
        const maxJoins = interaction.options.getInteger('max-katilim') || 10;
        const raidAction = interaction.options.getString('raid-aksiyonu') || 'kick';

        await interaction.deferReply();

        try {
            await Guild.update({
                guardEnabled: enabled,
                antiRaidEnabled: antiRaid,
                maxJoinsPerMinute: maxJoins,
                raidAction: raidAction
            }, {
                where: { id: interaction.guild.id }
            });

            const setupEmbed = new EmbedBuilder()
                .setColor(enabled ? '#00ff00' : '#ff0000')
                .setTitle(`🛡️ Guard Sistemi ${enabled ? 'Aktif' : 'Pasif'}`)
                .setDescription(`Guard sistemi başarıyla ${enabled ? 'aktif edildi' : 'pasif edildi'}!`)
                .addFields(
                    { name: '🛡️ Guard Durumu', value: enabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '🚫 Anti-Raid', value: antiRaid ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '👥 Max Katılım/Dk', value: maxJoins.toString(), inline: true },
                    { name: '⚔️ Raid Aksiyonu', value: this.getRaidActionText(raidAction), inline: true },
                    { name: '📊 Whitelist', value: 'Yönetilmeyi bekliyor', inline: true },
                    { name: '🤖 Auto-Mod', value: 'Yapılandırılacak', inline: true }
                )
                .setFooter({
                    text: 'Sunucu güvenliği aktif!',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [setupEmbed] });

        } catch (error) {
            logger.error('Guard setup hatası', error);
        }
    },

    async handleWhitelist(interaction) {
        const action = interaction.options.getString('işlem');
        const user = interaction.options.getUser('kullanıcı');
        const role = interaction.options.getRole('rol');

        if ((action === 'add' || action === 'remove') && !user && !role) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Eksik Parametre')
                .setDescription('Kullanıcı veya rol belirtmelisiniz!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const guild = await Guild.findOne({ where: { id: interaction.guild.id } });
            let whitelistUsers = guild.whitelistUsers || [];
            let whitelistRoles = guild.whitelistRoles || [];

            switch (action) {
                case 'add':
                    if (user) {
                        if (!whitelistUsers.includes(user.id)) {
                            whitelistUsers.push(user.id);
                        }
                    }
                    if (role) {
                        if (!whitelistRoles.includes(role.id)) {
                            whitelistRoles.push(role.id);
                        }
                    }
                    break;

                case 'remove':
                    if (user) {
                        whitelistUsers = whitelistUsers.filter(id => id !== user.id);
                    }
                    if (role) {
                        whitelistRoles = whitelistRoles.filter(id => id !== role.id);
                    }
                    break;
            }

            await Guild.update({
                whitelistUsers: whitelistUsers,
                whitelistRoles: whitelistRoles
            }, {
                where: { id: interaction.guild.id }
            });

            if (action === 'list') {
                const listEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('📝 Whitelist Listesi')
                    .setDescription('Mevcut whitelist kayıtları:')
                    .setTimestamp();

                if (whitelistUsers.length > 0) {
                    const userList = whitelistUsers.map(id => `<@${id}>`).join('\n');
                    listEmbed.addFields({ name: '👤 Kullanıcılar', value: userList, inline: false });
                }

                if (whitelistRoles.length > 0) {
                    const roleList = whitelistRoles.map(id => `<@&${id}>`).join('\n');
                    listEmbed.addFields({ name: '🎭 Roller', value: roleList, inline: false });
                }

                if (whitelistUsers.length === 0 && whitelistRoles.length === 0) {
                    listEmbed.setDescription('Whitelist boş.');
                }

                await interaction.editReply({ embeds: [listEmbed] });
            } else {
                const actionEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`✅ Whitelist ${action === 'add' ? 'Eklendi' : 'Çıkarıldı'}`)
                    .setDescription(`Whitelist ${action === 'add' ? 'ekleme' : 'çıkarma'} işlemi başarılı!`)
                    .addFields(
                        { name: '👤 Kullanıcı', value: user ? `${user}` : 'Yok', inline: true },
                        { name: '🎭 Rol', value: role ? `${role}` : 'Yok', inline: true },
                        { name: '📊 Toplam Whitelist', value: `${whitelistUsers.length} kullanıcı, ${whitelistRoles.length} rol`, inline: true }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [actionEmbed] });
            }

        } catch (error) {
            logger.error('Whitelist hatası', error);
        }
    },

    async handleAutomod(interaction) {
        const antiSpam = interaction.options.getBoolean('anti-spam');
        const antiLink = interaction.options.getBoolean('anti-link');
        const antiCaps = interaction.options.getBoolean('anti-caps');
        const antiMention = interaction.options.getBoolean('anti-mention');

        await interaction.deferReply();

        try {
            const updateData = {};
            
            if (antiSpam !== null) updateData.antiSpamEnabled = antiSpam;
            if (antiLink !== null) updateData.autoDeleteLinks = antiLink;
            if (antiCaps !== null) updateData.antiCapsEnabled = antiCaps;
            if (antiMention !== null) updateData.antiMentionEnabled = antiMention;

            await Guild.update(updateData, {
                where: { id: interaction.guild.id }
            });

            const guild = await Guild.findOne({ where: { id: interaction.guild.id } });

            const automodEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🤖 Auto-Mod Ayarları Güncellendi')
                .setDescription('Otomatik moderasyon ayarları başarıyla güncellendi!')
                .addFields(
                    { name: '🚫 Anti-Spam', value: guild.antiSpamEnabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '🔗 Anti-Link', value: guild.autoDeleteLinks ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '📢 Anti-Caps', value: guild.antiCapsEnabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '👥 Anti-Mention', value: guild.antiMentionEnabled ? '✅ Aktif' : '❌ Pasif', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [automodEmbed] });

        } catch (error) {
            logger.error('Automod hatası', error);
        }
    },

    async handleStatus(interaction) {
        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });

        if (!guild) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ayar Bulunamadı')
                .setDescription('Bu sunucu için guard ayarları bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const statusEmbed = new EmbedBuilder()
            .setColor(guild.guardEnabled ? '#00ff00' : '#ff0000')
            .setTitle('🛡️ Guard Sistemi Durumu')
            .setDescription(`${interaction.guild.name} sunucusunun guard durumu:`)
            .addFields(
                { name: '🛡️ Guard Sistemi', value: guild.guardEnabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                { name: '🚫 Anti-Raid', value: guild.antiRaidEnabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                { name: '👥 Max Katılım/Dk', value: (guild.maxJoinsPerMinute || 10).toString(), inline: true },
                { name: '⚔️ Raid Aksiyonu', value: this.getRaidActionText(guild.raidAction || 'kick'), inline: true },
                { name: '📝 Whitelist Kullanıcı', value: (guild.whitelistUsers?.length || 0).toString(), inline: true },
                { name: '📝 Whitelist Rol', value: (guild.whitelistRoles?.length || 0).toString(), inline: true },
                { name: '🚫 Anti-Spam', value: guild.antiSpamEnabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                { name: '🔗 Anti-Link', value: guild.autoDeleteLinks ? '✅ Aktif' : '❌ Pasif', inline: true },
                { name: '📢 Anti-Caps', value: guild.antiCapsEnabled ? '✅ Aktif' : '❌ Pasif', inline: true }
            )
            .setThumbnail(interaction.guild.iconURL())
            .setTimestamp();

        await interaction.reply({ embeds: [statusEmbed] });
    },

    getRaidActionText(action) {
        switch (action) {
            case 'kick': return '👢 Kick';
            case 'ban': return '🔨 Ban';
            case 'lockdown': return '🔒 Lockdown';
            default: return '❓ Bilinmiyor';
        }
    }
};



