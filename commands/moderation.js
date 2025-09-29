const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { Guild, ModerationCase, Warning, GuildMember } = require('../models');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('🛡️ Moderasyon komutları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('⚠️ Kullanıcıyı uyar')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Uyarılacak kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Uyarı sebebi')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('şiddet')
                        .setDescription('Uyarı şiddeti')
                        .addChoices(
                            { name: '🟢 Hafif', value: 'minor' },
                            { name: '🟡 Orta', value: 'moderate' },
                            { name: '🟠 Ağır', value: 'severe' },
                            { name: '🔴 Kritik', value: 'critical' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('👢 Kullanıcıyı sunucudan at')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Atılacak kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Atma sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('🔨 Kullanıcıyı sunucudan yasakla')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Yasaklanacak kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Yasaklama sebebi')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('mesaj-sil')
                        .setDescription('Silinecek mesaj günü (0-7)')
                        .setMinValue(0)
                        .setMaxValue(7)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('🔓 Kullanıcının yasağını kaldır')
                .addStringOption(option =>
                    option.setName('kullanıcı-id')
                        .setDescription('Yasağı kaldırılacak kullanıcının ID\'si')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Yasak kaldırma sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('🔇 Kullanıcıyı sustur')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Susturulacak kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('süre')
                        .setDescription('Susturma süresi (örn: 10m, 1h, 1d)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Susturma sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unmute')
                .setDescription('🔊 Kullanıcının susturmasını kaldır')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Susturması kaldırılacak kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Susturma kaldırma sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('⏰ Kullanıcıya zaman aşımı ver')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Zaman aşımı verilecek kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('süre')
                        .setDescription('Timeout süresi (örn: 10m, 1h)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Timeout sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('untimeout')
                .setDescription('⏰ Kullanıcının timeout\'unu kaldır')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Timeout\'u kaldırılacak kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Timeout kaldırma sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warnings')
                .setDescription('📋 Kullanıcının uyarılarını görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Uyarıları görüntülenecek kullanıcı')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear-warnings')
                .setDescription('🗑️ Kullanıcının uyarılarını temizle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Uyarıları temizlenecek kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Temizleme sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('case')
                .setDescription('📄 Moderasyon vakasını görüntüle')
                .addIntegerOption(option =>
                    option.setName('numara')
                        .setDescription('Vaka numarası')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('📊 Kullanıcının moderasyon geçmişi')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Geçmişi görüntülenecek kullanıcı')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Yetki kontrolü
        const requiredPermissions = {
            warn: PermissionFlagsBits.ModerateMembers,
            kick: PermissionFlagsBits.KickMembers,
            ban: PermissionFlagsBits.BanMembers,
            unban: PermissionFlagsBits.BanMembers,
            mute: PermissionFlagsBits.ModerateMembers,
            unmute: PermissionFlagsBits.ModerateMembers,
            timeout: PermissionFlagsBits.ModerateMembers,
            untimeout: PermissionFlagsBits.ModerateMembers,
            warnings: PermissionFlagsBits.ModerateMembers,
            'clear-warnings': PermissionFlagsBits.ModerateMembers,
            case: PermissionFlagsBits.ModerateMembers,
            history: PermissionFlagsBits.ModerateMembers
        };

        const requiredPermission = requiredPermissions[subcommand];
        if (requiredPermission && !interaction.member.permissions.has(requiredPermission)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz Erişim')
                .setDescription('Bu komutu kullanabilmek için gerekli yetkiniz yok!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'warn':
                    await this.handleWarn(interaction);
                    break;
                case 'kick':
                    await this.handleKick(interaction);
                    break;
                case 'ban':
                    await this.handleBan(interaction);
                    break;
                case 'unban':
                    await this.handleUnban(interaction);
                    break;
                case 'mute':
                    await this.handleMute(interaction);
                    break;
                case 'unmute':
                    await this.handleUnmute(interaction);
                    break;
                case 'timeout':
                    await this.handleTimeout(interaction);
                    break;
                case 'untimeout':
                    await this.handleUntimeout(interaction);
                    break;
                case 'warnings':
                    await this.handleWarnings(interaction);
                    break;
                case 'clear-warnings':
                    await this.handleClearWarnings(interaction);
                    break;
                case 'case':
                    await this.handleCase(interaction);
                    break;
                case 'history':
                    await this.handleHistory(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Moderation komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Moderasyon Hatası')
                .setDescription('Moderasyon işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleWarn(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep');
        const severity = interaction.options.getString('şiddet') || 'moderate';

        // Kendine uyarı kontrolü
        if (targetUser.id === interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz İşlem')
                .setDescription('Kendinizi uyaramazsınız!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Bot kontrolü
        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarını uyaramazsınız!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Guild member kontrolü
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Bu kullanıcı sunucuda bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Yetki kontrolü (uyarılan kişi moderatörden üst rütbede olmamalı)
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz İşlem')
                .setDescription('Bu kullanıcıyı uyaramazsınız! (Yüksek yetki)')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Case numarası al
            const guild = await Guild.findOne({ where: { id: interaction.guild.id } });
            const lastCase = await ModerationCase.findOne({
                where: { guildId: interaction.guild.id },
                order: [['caseNumber', 'DESC']]
            });
            const caseNumber = (lastCase?.caseNumber || 0) + 1;

            // Warning oluştur
            const warning = await Warning.create({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason: reason,
                severity: severity,
                caseNumber: caseNumber,
                channelId: interaction.channel.id,
                messageId: interaction.id
            });

            // Moderation case oluştur
            const moderationCase = await ModerationCase.create({
                caseNumber: caseNumber,
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                type: 'warn',
                reason: reason,
                details: `Şiddet: ${severity}`,
                channelId: interaction.channel.id,
                messageId: interaction.id
            });

            // Kullanıcının toplam uyarı sayısını güncelle
            const guildMember = await GuildMember.findOne({
                where: { userId: targetUser.id, guildId: interaction.guild.id }
            });

            if (guildMember) {
                await guildMember.update({
                    warnings: (guildMember.warnings || 0) + 1
                });
            }

            // Severity emoji ve renk
            const severityInfo = {
                minor: { emoji: '🟢', color: '#00ff00', name: 'Hafif' },
                moderate: { emoji: '🟡', color: '#ffff00', name: 'Orta' },
                severe: { emoji: '🟠', color: '#ff8000', name: 'Ağır' },
                critical: { emoji: '🔴', color: '#ff0000', name: 'Kritik' }
            };

            const severityData = severityInfo[severity];

            const warnEmbed = new EmbedBuilder()
                .setColor(severityData.color)
                .setTitle(`⚠️ Kullanıcı Uyarıldı`)
                .setDescription(`${targetUser} kullanıcısı uyarıldı!`)
                .addFields(
                    { name: '👤 Uyarılan', value: `${targetUser} (${targetUser.tag})`, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '📋 Case #', value: caseNumber.toString(), inline: true },
                    { name: '📝 Sebep', value: reason, inline: false },
                    { name: `${severityData.emoji} Şiddet`, value: severityData.name, inline: true },
                    { name: '⚠️ Toplam Uyarı', value: (guildMember?.warnings || 1).toString(), inline: true },
                    { name: '📅 Tarih', value: new Date().toLocaleString('tr-TR'), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [warnEmbed] });

            // DM gönder
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(severityData.color)
                    .setTitle(`⚠️ ${interaction.guild.name} - Uyarı Aldınız`)
                    .setDescription(`Sunucumuzda bir uyarı aldınız.`)
                    .addFields(
                        { name: '📝 Sebep', value: reason, inline: false },
                        { name: `${severityData.emoji} Şiddet`, value: severityData.name, inline: true },
                        { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                        { name: '📋 Case #', value: caseNumber.toString(), inline: true }
                    )
                    .setFooter({
                        text: 'Kurallara uymanızı rica ederiz.',
                        iconURL: interaction.guild.iconURL()
                    })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
                await moderationCase.update({ dmSent: true });
            } catch (error) {
                await moderationCase.update({ 
                    dmSent: false, 
                    dmError: 'DM gönderilemedi' 
                });
            }

            // Log kanalına gönder
            if (guild?.modLogChannelId) {
                const logChannel = await interaction.guild.channels.fetch(guild.modLogChannelId).catch(() => null);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(severityData.color)
                        .setTitle('⚠️ Moderasyon: Uyarı')
                        .addFields(
                            { name: '👤 Kullanıcı', value: `${targetUser} (${targetUser.tag})`, inline: true },
                            { name: '👮 Moderatör', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: '📋 Case #', value: caseNumber.toString(), inline: true },
                            { name: '📝 Sebep', value: reason, inline: false },
                            { name: `${severityData.emoji} Şiddet`, value: severityData.name, inline: true },
                            { name: '📍 Kanal', value: `${interaction.channel}`, inline: true },
                            { name: '🆔 User ID', value: targetUser.id, inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

            // Otomatik işlem kontrolü (max warnings)
            if (guild?.maxWarnings && guildMember && guildMember.warnings >= guild.maxWarnings) {
                const autoAction = guild.warnAction || 'kick';
                
                try {
                    if (autoAction === 'kick') {
                        await targetMember.kick(`Maksimum uyarı sayısına ulaştı (${guild.maxWarnings})`);
                    } else if (autoAction === 'ban') {
                        await targetMember.ban({ reason: `Maksimum uyarı sayısına ulaştı (${guild.maxWarnings})` });
                    }

                    const autoEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🔄 Otomatik İşlem')
                        .setDescription(`${targetUser} kullanıcısı maksimum uyarı sayısına ulaştığı için otomatik olarak ${autoAction === 'kick' ? 'atıldı' : 'yasaklandı'}!`)
                        .setTimestamp();

                    await interaction.followUp({ embeds: [autoEmbed] });
                } catch (error) {
                    logger.error('Otomatik moderasyon işlemi hatası', error);
                }
            }

        } catch (error) {
            logger.error('Warning oluşturma hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Uyarı Hatası')
                .setDescription('Uyarı oluşturulurken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    // Diğer metodlar buraya gelecek...
};



