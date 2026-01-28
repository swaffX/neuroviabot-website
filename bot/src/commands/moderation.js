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
                .setName('tempban')
                .setDescription('⏰ Kullanıcıyı geçici olarak yasakla')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Yasaklanacak kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('süre')
                        .setDescription('Yasak süresi (örn: 1h, 1d, 7d)')
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

        // Moderasyon sistemi kontrolü
        const { getDatabase } = require('../database/simple-db');
        const db = getDatabase();
        const settings = db.getGuildSettings(interaction.guild.id);
        
        // Features objesi içinde veya direkt moderation objesi olarak kontrol et
        const moderationEnabled = settings.features?.moderation || settings.moderation?.enabled;
        
        if (!moderationEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Moderasyon Sistemi Kapalı')
                .setDescription('Bu sunucuda moderasyon sistemi etkin değil!')
                .addFields({
                    name: '💡 Yöneticiler İçin',
                    value: `🌐 **Web Dashboard üzerinden açabilirsiniz:**\n└ https://neuroviabot.xyz/dashboard\n└ Sunucunuzu seçin → Moderasyon → Sistemi Etkinleştir`,
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        // Yetki kontrolü
        const requiredPermissions = {
            warn: PermissionFlagsBits.ModerateMembers,
            kick: PermissionFlagsBits.KickMembers,
            ban: PermissionFlagsBits.BanMembers,
            tempban: PermissionFlagsBits.BanMembers,
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
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
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
                case 'tempban':
                    await this.handleTempBan(interaction);
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
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        // Bot kontrolü
        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarını uyaramazsınız!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        // Guild member kontrolü
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Bu kullanıcı sunucuda bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        // Yetki kontrolü (uyarılan kişi moderatörden üst rütbede olmamalı)
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz İşlem')
                .setDescription('Bu kullanıcıyı uyaramazsınız! (Yüksek yetki)')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
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

    async handleBan(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';
        const deleteMessageDays = interaction.options.getInteger('mesaj-sil') || 0;

        // Kendine ban kontrolü
        if (targetUser.id === interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz İşlem')
                .setDescription('Kendinizi yasaklayamazsınız!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        // Bot kontrolü
        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarını yasaklayamazsınız!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        await interaction.deferReply();

        try {
            // Guild member kontrolü
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (targetMember) {
                // Yetki kontrolü
                if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Yetkisiz İşlem')
                        .setDescription('Bu kullanıcıyı yasaklayamazsınız! (Yüksek yetki)')
                        .setTimestamp();
                    
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
            }

            // DM gönder (ban öncesi)
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`🔨 ${interaction.guild.name} - Sunucudan Yasaklandınız`)
                    .setDescription(`Sunucudan yasaklandınız.`)
                    .addFields(
                        { name: '📝 Sebep', value: reason, inline: false },
                        { name: '👮 Moderatör', value: interaction.user.username, inline: true }
                    )
                    .setFooter({
                        text: 'Yasak kaldırma için moderatörlerle iletişime geçebilirsiniz.',
                        iconURL: interaction.guild.iconURL()
                    })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // DM gönderilemedi, devam et
            }

            // Ban işlemi
            await interaction.guild.members.ban(targetUser, {
                reason: `${interaction.user.tag}: ${reason}`,
                deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
            });

            const banEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Kullanıcı Yasaklandı')
                .setDescription(`${targetUser} kullanıcısı sunucudan yasaklandı!`)
                .addFields(
                    { name: '👤 Yasaklanan', value: `${targetUser.tag}`, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false },
                    { name: '🗑️ Silinen Mesajlar', value: `${deleteMessageDays} gün`, inline: true },
                    { name: '📅 Tarih', value: new Date().toLocaleString('tr-TR'), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [banEmbed] });

            logger.info(`[Moderation] ${targetUser.tag} banned by ${interaction.user.tag} in ${interaction.guild.name}`);

        } catch (error) {
            logger.error('Ban işlemi hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ban Hatası')
                .setDescription('Yasaklama işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleKick(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

        await interaction.deferReply();

        try {
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            
            // Yetki kontrolü
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetkisiz İşlem')
                    .setDescription('Bu kullanıcıyı atamazsınız! (Yüksek yetki)')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // DM gönder
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff8000')
                    .setTitle(`👢 ${interaction.guild.name} - Sunucudan Atıldınız`)
                    .setDescription(`Sunucudan atıldınız.`)
                    .addFields(
                        { name: '📝 Sebep', value: reason, inline: false },
                        { name: '👮 Moderatör', value: interaction.user.username, inline: true }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // DM gönderilemedi
            }

            await targetMember.kick(`${interaction.user.tag}: ${reason}`);

            const kickEmbed = new EmbedBuilder()
                .setColor('#ff8000')
                .setTitle('👢 Kullanıcı Atıldı')
                .setDescription(`${targetUser} kullanıcısı sunucudan atıldı!`)
                .addFields(
                    { name: '👤 Atılan', value: `${targetUser.tag}`, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [kickEmbed] });

        } catch (error) {
            logger.error('Kick işlemi hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kick Hatası')
                .setDescription('Kullanıcı atılırken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleTempBan(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const durationStr = interaction.options.getString('süre');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';
        const deleteMessageDays = interaction.options.getInteger('mesaj-sil') || 0;

        // Kendine ban kontrolü
        if (targetUser.id === interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz İşlem')
                .setDescription('Kendinizi yasaklayamazsınız!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        // Bot kontrolü
        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarını yasaklayamazsınız!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        await interaction.deferReply();

        try {
            // Parse duration
            const duration = this.parseDuration(durationStr);
            if (!duration) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Geçersiz Süre')
                    .setDescription('Geçersiz süre formatı! Örnek: 1h, 1d, 7d')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Max 30 days
            const maxDuration = 30 * 24 * 60 * 60 * 1000;
            if (duration > maxDuration) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Süre Çok Uzun')
                    .setDescription('Maksimum geçici yasak süresi 30 gündür!')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Guild member kontrolü
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (targetMember) {
                // Yetki kontrolü
                if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Yetkisiz İşlem')
                        .setDescription('Bu kullanıcıyı yasaklayamazsınız! (Yüksek yetki)')
                        .setTimestamp();
                    
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
            }

            // Calculate expiry
            const expiresAt = Date.now() + duration;
            const expiryDate = new Date(expiresAt);

            // DM gönder (ban öncesi)
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff8000')
                    .setTitle(`⏰ ${interaction.guild.name} - Geçici Yasaklandınız`)
                    .setDescription(`Sunucudan geçici olarak yasaklandınız.`)
                    .addFields(
                        { name: '📝 Sebep', value: reason, inline: false },
                        { name: '⏱️ Süre', value: durationStr, inline: true },
                        { name: '📅 Yasak Bitiş', value: expiryDate.toLocaleString('tr-TR'), inline: true },
                        { name: '👮 Moderatör', value: interaction.user.username, inline: true }
                    )
                    .setFooter({
                        text: 'Yasak süresi dolduğunda otomatik olarak kaldırılacaktır.',
                        iconURL: interaction.guild.iconURL()
                    })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // DM gönderilemedi, devam et
            }

            // Ban işlemi
            await interaction.guild.members.ban(targetUser, {
                reason: `[TEMPBAN] ${interaction.user.tag}: ${reason} (Süre: ${durationStr})`,
                deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
            });

            // Add to temp ban scheduler
            const tempBanScheduler = interaction.client.tempBanScheduler;
            if (tempBanScheduler) {
                tempBanScheduler.addTempBan(targetUser.id, interaction.guild.id, expiresAt, reason);
            }

            const banEmbed = new EmbedBuilder()
                .setColor('#ff8000')
                .setTitle('⏰ Kullanıcı Geçici Yasaklandı')
                .setDescription(`${targetUser} kullanıcısı geçici olarak sunucudan yasaklandı!`)
                .addFields(
                    { name: '👤 Yasaklanan', value: `${targetUser.tag}`, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '⏱️ Süre', value: durationStr, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false },
                    { name: '📅 Yasak Bitiş', value: expiryDate.toLocaleString('tr-TR'), inline: true },
                    { name: '🗑️ Silinen Mesajlar', value: `${deleteMessageDays} gün`, inline: true }
                )
                .setFooter({ text: 'Yasak otomatik olarak kaldırılacaktır.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [banEmbed] });

            logger.info(`[Moderation] ${targetUser.tag} temp banned for ${durationStr} by ${interaction.user.tag} in ${interaction.guild.name}`);

        } catch (error) {
            logger.error('TempBan işlemi hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ TempBan Hatası')
                .setDescription('Geçici yasaklama işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleUnban(interaction) {
        const userId = interaction.options.getString('kullanıcı-id');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

        await interaction.deferReply();

        try {
            // Check and remove from temp bans if exists
            const tempBanScheduler = interaction.client.tempBanScheduler;
            if (tempBanScheduler) {
                tempBanScheduler.removeTempBan(userId, interaction.guild.id);
            }

            await interaction.guild.members.unban(userId, `${interaction.user.tag}: ${reason}`);

            const unbanEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔓 Kullanıcı Yasağı Kaldırıldı')
                .setDescription(`<@${userId}> kullanıcısının yasağı kaldırıldı!`)
                .addFields(
                    { name: '👤 Kullanıcı ID', value: userId, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [unbanEmbed] });

        } catch (error) {
            logger.error('Unban işlemi hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Unban Hatası')
                .setDescription('Yasak kaldırılırken bir hata oluştu! Kullanıcı ID\'sinin doğru olduğundan emin olun.')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleMute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const durationStr = interaction.options.getString('süre');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

        await interaction.deferReply();

        try {
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            
            // Parse duration
            const duration = this.parseDuration(durationStr);
            if (!duration) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Geçersiz Süre')
                    .setDescription('Geçersiz süre formatı! Örnek: 10m, 1h, 1d')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Discord timeout (max 28 days)
            if (duration > 28 * 24 * 60 * 60 * 1000) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Süre Çok Uzun')
                    .setDescription('Maksimum timeout süresi 28 gündür!')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            await targetMember.timeout(duration, `${interaction.user.tag}: ${reason}`);

            const muteEmbed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('🔇 Kullanıcı Susturuldu')
                .setDescription(`${targetUser} kullanıcısı susturuldu!`)
                .addFields(
                    { name: '👤 Susturulan', value: `${targetUser.tag}`, inline: true },
                    { name: '⏱️ Süre', value: durationStr, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [muteEmbed] });

        } catch (error) {
            logger.error('Mute işlemi hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Mute Hatası')
                .setDescription('Susturma işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleUnmute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

        await interaction.deferReply();

        try {
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            await targetMember.timeout(null, `${interaction.user.tag}: ${reason}`);

            const unmuteEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔊 Kullanıcının Susturması Kaldırıldı')
                .setDescription(`${targetUser} kullanıcısının susturması kaldırıldı!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: `${targetUser.tag}`, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [unmuteEmbed] });

        } catch (error) {
            logger.error('Unmute işlemi hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                .setTitle('❌ Unmute Hatası')
                .setDescription('Susturma kaldırılırken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleTimeout(interaction) {
        // Timeout aynı mute gibi çalışır
        return this.handleMute(interaction);
    },

    async handleUntimeout(interaction) {
        // Untimeout aynı unmute gibi çalışır
        return this.handleUnmute(interaction);
    },

    async handleWarnings(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');

        await interaction.deferReply();

        try {
            const warnings = await Warning.findAll({
                where: {
                    guildId: interaction.guild.id,
                    userId: targetUser.id
                },
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            if (warnings.length === 0) {
                const noWarningsEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📋 Uyarılar')
                    .setDescription(`${targetUser} kullanıcısının hiç uyarısı yok.`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [noWarningsEmbed] });
            }

            const warningsEmbed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle(`📋 ${targetUser.tag} - Uyarılar (${warnings.length})`)
                .setDescription(`Son 10 uyarı gösteriliyor:`)
                .setTimestamp();

            warnings.forEach((warning, index) => {
                const severityEmoji = {
                    minor: '🟢',
                    moderate: '🟡',
                    severe: '🟠',
                    critical: '🔴'
                }[warning.severity] || '⚪';

                warningsEmbed.addFields({
                    name: `${severityEmoji} Uyarı #${warning.caseNumber}`,
                    value: `**Sebep:** ${warning.reason}\n**Tarih:** ${new Date(warning.createdAt).toLocaleString('tr-TR')}`,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [warningsEmbed] });

        } catch (error) {
            logger.error('Warnings görüntüleme hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Uyarılar yüklenirken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleClearWarnings(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

        await interaction.deferReply();

        try {
            const deletedCount = await Warning.destroy({
                where: {
                    guildId: interaction.guild.id,
                    userId: targetUser.id
                }
            });

            // GuildMember warnings sayısını sıfırla
            await GuildMember.update(
                { warnings: 0 },
                {
                    where: {
                        guildId: interaction.guild.id,
                        userId: targetUser.id
                    }
                }
            );

            const clearEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🗑️ Uyarılar Temizlendi')
                .setDescription(`${targetUser} kullanıcısının ${deletedCount} uyarısı temizlendi!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: `${targetUser.tag}`, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [clearEmbed] });

        } catch (error) {
            logger.error('Clear warnings hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Uyarılar temizlenirken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleCase(interaction) {
        const caseNumber = interaction.options.getInteger('numara');

        await interaction.deferReply();

        try {
            const moderationCase = await ModerationCase.findOne({
                where: {
                    guildId: interaction.guild.id,
                    caseNumber: caseNumber
                }
            });

            if (!moderationCase) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Case Bulunamadı')
                    .setDescription(`#${caseNumber} numaralı moderasyon vakası bulunamadı.`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const caseEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📄 Case #${caseNumber}`)
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${moderationCase.userId}>`, inline: true },
                    { name: '👮 Moderatör', value: `<@${moderationCase.moderatorId}>`, inline: true },
                    { name: '⚙️ İşlem', value: moderationCase.type, inline: true },
                    { name: '📝 Sebep', value: moderationCase.reason || 'Belirtilmedi', inline: false },
                    { name: '📅 Tarih', value: new Date(moderationCase.createdAt).toLocaleString('tr-TR'), inline: true }
                )
                .setTimestamp();

            if (moderationCase.details) {
                caseEmbed.addFields({ name: '📋 Detaylar', value: moderationCase.details, inline: false });
            }

            await interaction.editReply({ embeds: [caseEmbed] });

        } catch (error) {
            logger.error('Case görüntüleme hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Case yüklenirken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleHistory(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');

        await interaction.deferReply();

        try {
            const cases = await ModerationCase.findAll({
                where: {
                    guildId: interaction.guild.id,
                    userId: targetUser.id
                },
                order: [['createdAt', 'DESC']],
                limit: 15
            });

            if (cases.length === 0) {
                const noHistoryEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📊 Moderasyon Geçmişi')
                    .setDescription(`${targetUser} kullanıcısının moderasyon geçmişi temiz.`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [noHistoryEmbed] });
            }

            const historyEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 ${targetUser.tag} - Moderasyon Geçmişi`)
                .setDescription(`Toplam ${cases.length} kayıt (son 15 gösteriliyor):`)
                .setTimestamp();

            cases.forEach((c, index) => {
                const typeEmoji = {
                    warn: '⚠️',
                    kick: '👢',
                    ban: '🔨',
                    mute: '🔇',
                    timeout: '⏰'
                }[c.type] || '📋';

                historyEmbed.addFields({
                    name: `${typeEmoji} Case #${c.caseNumber} - ${c.type.toUpperCase()}`,
                    value: `**Sebep:** ${c.reason || 'Belirtilmedi'}\n**Tarih:** ${new Date(c.createdAt).toLocaleString('tr-TR')}`,
                    inline: true
                });
            });

            await interaction.editReply({ embeds: [historyEmbed] });

        } catch (error) {
            logger.error('History görüntüleme hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Geçmiş yüklenirken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    parseDuration(durationStr) {
        const regex = /^(\d+)([smhd])$/;
        const match = durationStr.match(regex);
        
        if (!match) return null;
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        const multipliers = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };
        
        return value * multipliers[unit];
    }
};

