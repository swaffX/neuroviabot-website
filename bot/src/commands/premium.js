const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getOrCreateUser, getOrCreateGuild } = require('../models');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Premium özellikler ve abonelik yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Premium özellikler hakkında bilgi al')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Premium durumunu kontrol et')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('activate')
                .setDescription('Premium kodu etkinleştir')
                .addStringOption(option =>
                    option
                        .setName('code')
                        .setDescription('Premium aktivasyon kodu')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('gift')
                .setDescription('Premium hediye et')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Hediye edilecek kullanıcı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('duration')
                        .setDescription('Hediye süresi')
                        .setRequired(true)
                        .addChoices(
                            { name: '1 Ay', value: '1month' },
                            { name: '3 Ay', value: '3months' },
                            { name: '6 Ay', value: '6months' },
                            { name: '1 Yıl', value: '1year' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Sunucu premium durumu')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('upgrade')
                .setDescription('Premium\'a yükselt')
        ),

    async execute(interaction) {
        const { user, guild } = interaction;
        const subcommand = interaction.options.getSubcommand();

        try {
            await interaction.deferReply();

            const userData = await getOrCreateUser(user.id, user.username, user.discriminator);
            const guildData = await getOrCreateGuild(guild.id, guild.name);

            switch (subcommand) {
                case 'info':
                    await this.handlePremiumInfo(interaction);
                    break;
                case 'status':
                    await this.handlePremiumStatus(interaction, userData, guildData);
                    break;
                case 'activate':
                    await this.handleActivateCode(interaction, userData);
                    break;
                case 'gift':
                    await this.handleGiftPremium(interaction, userData);
                    break;
                case 'server':
                    await this.handleServerPremium(interaction, guildData);
                    break;
                case 'upgrade':
                    await this.handleUpgrade(interaction);
                    break;
            }

            logger.info(`Premium command executed: ${subcommand} by ${user.tag} in ${guild.name}`);

        } catch (error) {
            logger.error('Premium command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#f04747')
                .setTitle('❌ Hata')
                .setDescription('Premium işlemi sırasında bir hata oluştu.')
                .addFields({ name: 'Hata', value: error.message })
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handlePremiumInfo(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#faa61a')
            .setTitle('👑 Discord Bot Premium')
            .setDescription('Premium üyelik ile bot deneyiminizi bir üst seviyeye çıkarın!')
            .setThumbnail('https://cdn.discordapp.com/emojis/852899630343659520.png')
            .addFields(
                {
                    name: '🎵 Müzik Premium',
                    value: [
                        '• **Sınırsız kuyruk** - 500+ şarkı ekleyin',
                        '• **Yüksek kalite ses** - 320kbps kalitede müzik',
                        '• **Özel playlist\'ler** - 50+ kişisel playlist',
                        '• **Atla hakkı** - Sınırsız şarkı atlama',
                        '• **Ön plan çalma** - Kuyruğun önüne geç'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '💰 Ekonomi Premium',
                    value: [
                        '• **2x Günlük ödül** - Daha fazla para kazanın',
                        '• **VIP çalışma** - Özel işlerle daha çok kazanç',
                        '• **Premium mağaza** - Özel eşyalar ve indirimler',
                        '• **Yatırım sistemi** - Paranızı büyütün',
                        '• **Premium casino** - Özel kumar oyunları'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🛡️ Güvenlik Premium',
                    value: [
                        '• **Gelişmiş koruma** - AI destekli güvenlik',
                        '• **Özel whitelist** - Güvenilir kullanıcı sistemi',
                        '• **Detaylı loglar** - 30 gün mesaj geçmişi',
                        '• **Backup sistemi** - Otomatik sunucu yedekleme',
                        '• **Anti-raid Pro** - Gelişmiş saldırı koruması'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '✨ Özel Özellikler',
                    value: [
                        '• **Premium rozetler** - Özel profil süsleri',
                        '• **Öncelikli destek** - 7/24 premium destek',
                        '• **Beta erişim** - Yeni özellikleri ilk deneme',
                        '• **Custom komutlar** - Sınırsız özel komut',
                        '• **API erişimi** - Bot verilerine programlı erişim'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '💎 Fiyatlandırma',
                    value: [
                        '**Aylık:** ₺19.99/ay',
                        '**3 Aylık:** ₺49.99 (₺17/ay)',
                        '**6 Aylık:** ₺89.99 (₺15/ay)',
                        '**Yıllık:** ₺149.99 (₺12.5/ay)'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎁 Hediye Seçenekleri',
                    value: [
                        '**1 Ay Hediye:** ₺24.99',
                        '**3 Ay Hediye:** ₺64.99',
                        '**6 Ay Hediye:** ₺119.99',
                        '**1 Yıl Hediye:** ₺199.99'
                    ].join('\n'),
                    inline: true
                }
            )
            .setFooter({ text: '💳 Güvenli ödeme ile 7 gün garanti' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('premium_upgrade')
                    .setLabel('Premium\'a Yükselt')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑'),
                new ButtonBuilder()
                    .setCustomId('premium_gift')
                    .setLabel('Hediye Et')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎁'),
                new ButtonBuilder()
                    .setURL('https://discord.gg/support')
                    .setLabel('Destek')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('💬')
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },

    async handlePremiumStatus(interaction, userData, guildData) {
        const userPremium = await this.getUserPremiumStatus(userData);
        const serverPremium = await this.getServerPremiumStatus(guildData);

        const embed = new EmbedBuilder()
            .setColor(userPremium.active ? '#faa61a' : '#36393f')
            .setTitle('👑 Premium Durumu')
            .setDescription('Kullanıcı ve sunucu premium durumunuz')
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                {
                    name: '👤 Kişisel Premium',
                    value: userPremium.active 
                        ? [
                            `✅ **Aktif** - ${userPremium.type}`,
                            `📅 **Bitiş:** ${userPremium.expiresAt.toLocaleDateString('tr-TR')}`,
                            `⏱️ **Kalan:** ${this.getTimeRemaining(userPremium.expiresAt)}`,
                            `🔄 **Otomatik yenileme:** ${userPremium.autoRenew ? 'Açık' : 'Kapalı'}`
                        ].join('\n')
                        : '❌ Premium üyeliğiniz bulunmamaktadır',
                    inline: false
                },
                {
                    name: '🏰 Sunucu Premium',
                    value: serverPremium.active
                        ? [
                            `✅ **Aktif** - ${serverPremium.type}`,
                            `📅 **Bitiş:** ${serverPremium.expiresAt.toLocaleDateString('tr-TR')}`,
                            `👤 **Sponsor:** <@${serverPremium.sponsorId}>`,
                            `⏱️ **Kalan:** ${this.getTimeRemaining(serverPremium.expiresAt)}`
                        ].join('\n')
                        : '❌ Bu sunucuda premium bulunmamaktadır',
                    inline: false
                }
            )
            .setTimestamp();

        if (userPremium.active) {
            embed.addFields({
                name: '🎯 Aktif Özellikler',
                value: this.getActivePremiumFeatures(userPremium, serverPremium).join('\n'),
                inline: false
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('premium_manage')
                    .setLabel('Yönet')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚙️')
                    .setDisabled(!userPremium.active),
                new ButtonBuilder()
                    .setCustomId('premium_upgrade')
                    .setLabel(userPremium.active ? 'Uzat' : 'Premium Al')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑'),
                new ButtonBuilder()
                    .setCustomId('premium_history')
                    .setLabel('Geçmiş')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋')
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },

    async handleActivateCode(interaction, userData) {
        const code = interaction.options.getString('code');

        // Validate and activate premium code
        const activationResult = await this.activatePremiumCode(code, userData);

        if (activationResult.success) {
            const embed = new EmbedBuilder()
                .setColor('#43b581')
                .setTitle('✅ Premium Kod Aktif Edildi')
                .setDescription('Premium kodunuz başarıyla aktif edildi!')
                .addFields(
                    { name: '🎁 Paket', value: activationResult.package, inline: true },
                    { name: '⏰ Süre', value: activationResult.duration, inline: true },
                    { name: '📅 Bitiş Tarihi', value: activationResult.expiresAt.toLocaleDateString('tr-TR'), inline: true }
                )
                .setFooter({ text: 'Premium özellikleriniz hemen aktif oldu!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#f04747')
                .setTitle('❌ Geçersiz Kod')
                .setDescription('Girdiğiniz premium kod geçersiz veya kullanılmış.')
                .addFields(
                    { name: '🔍 Kontrol Edin', value: 'Kodun doğru yazıldığından emin olun' },
                    { name: '💬 Destek', value: 'Sorun devam ederse destek ekibimizle iletişime geçin' }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleGiftPremium(interaction, userData) {
        const targetUser = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');

        // Check if user has premium to gift
        const userPremium = await this.getUserPremiumStatus(userData);
        if (!userPremium.active || !userPremium.canGift) {
            const embed = new EmbedBuilder()
                .setColor('#f04747')
                .setTitle('❌ Premium Hediye Edilemez')
                .setDescription('Premium hediye etmek için premium üyeliğiniz olmalı.')
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const giftResult = await this.giftPremium(targetUser.id, duration, userData.userId);

        if (giftResult.success) {
            const embed = new EmbedBuilder()
                .setColor('#43b581')
                .setTitle('🎁 Premium Hediye Edildi')
                .setDescription(`${targetUser.username} kullanıcısına premium hediye ettiniz!`)
                .addFields(
                    { name: '👤 Alıcı', value: `<@${targetUser.id}>`, inline: true },
                    { name: '⏰ Süre', value: this.getDurationText(duration), inline: true },
                    { name: '💰 Maliyet', value: giftResult.cost, inline: true }
                )
                .setFooter({ text: 'Hediye alıcıya DM olarak bildirildi' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#f04747')
                .setTitle('❌ Hediye Gönderilemedi')
                .setDescription('Premium hediye gönderilirken bir hata oluştu.')
                .addFields({ name: 'Hata', value: giftResult.error })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleServerPremium(interaction, guildData) {
        const serverPremium = await this.getServerPremiumStatus(guildData);

        const embed = new EmbedBuilder()
            .setColor(serverPremium.active ? '#faa61a' : '#36393f')
            .setTitle('🏰 Sunucu Premium')
            .setDescription('Bu sunucunun premium durumu ve özellikleri')
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
                {
                    name: '📊 Premium Durumu',
                    value: serverPremium.active
                        ? [
                            `✅ **Aktif** - ${serverPremium.type}`,
                            `👤 **Sponsor:** <@${serverPremium.sponsorId}>`,
                            `📅 **Bitiş:** ${serverPremium.expiresAt.toLocaleDateString('tr-TR')}`,
                            `⏱️ **Kalan:** ${this.getTimeRemaining(serverPremium.expiresAt)}`
                        ].join('\n')
                        : '❌ Bu sunucuda premium bulunmamaktadır',
                    inline: false
                }
            );

        if (serverPremium.active) {
            embed.addFields(
                {
                    name: '🎯 Aktif Özellikler',
                    value: [
                        '• Sınırsız müzik kuyruğu',
                        '• Otomatik backup sistemi',
                        '• Gelişmiş moderasyon',
                        '• Premium ekonomi özellikleri',
                        '• Özel bot komutları',
                        '• Öncelikli destek'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📈 Kullanım İstatistikleri',
                    value: [
                        `🎵 **Müzik:** ${serverPremium.stats?.musicUsage || 0} saat`,
                        `💰 **Ekonomi:** ${serverPremium.stats?.economyTransactions || 0} işlem`,
                        `🛡️ **Moderasyon:** ${serverPremium.stats?.moderationActions || 0} eylem`,
                        `📁 **Backup:** ${serverPremium.stats?.backupCount || 0} adet`
                    ].join('\n'),
                    inline: true
                }
            );
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('server_premium_upgrade')
                    .setLabel(serverPremium.active ? 'Uzat' : 'Sunucu Premium Al')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑'),
                new ButtonBuilder()
                    .setCustomId('server_premium_transfer')
                    .setLabel('Premium Transfer')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄')
                    .setDisabled(!serverPremium.active)
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },

    async handleUpgrade(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#faa61a')
            .setTitle('👑 Premium\'a Yükselt')
            .setDescription('En uygun premium paketini seçin ve hemen premium olun!')
            .addFields(
                {
                    name: '💎 Premium Aylık',
                    value: [
                        '• **₺19.99/ay**',
                        '• Tüm premium özellikler',
                        '• İstediğiniz zaman iptal',
                        '• 7 gün para iade garantisi'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💎 Premium 3 Aylık',
                    value: [
                        '• **₺49.99 (₺17/ay)**',
                        '• %15 indirim',
                        '• 3 aylık taahhüt',
                        '• Bonus özellikler'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💎 Premium Yıllık',
                    value: [
                        '• **₺149.99 (₺12.5/ay)**',
                        '• %37 indirim',
                        '• En avantajlı paket',
                        '• VIP destek'
                    ].join('\n'),
                    inline: true
                }
            )
            .setFooter({ text: '💳 Güvenli ödeme ile anında aktivasyon' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('premium_buy_monthly')
                    .setLabel('Aylık ₺19.99')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💳'),
                new ButtonBuilder()
                    .setCustomId('premium_buy_3months')
                    .setLabel('3 Aylık ₺49.99')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💰'),
                new ButtonBuilder()
                    .setCustomId('premium_buy_yearly')
                    .setLabel('Yıllık ₺149.99')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑')
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },

    async getUserPremiumStatus(userData) {
        const premium = userData.premiumData || {};
        return {
            active: premium.active || false,
            type: premium.type || 'None',
            expiresAt: premium.expiresAt ? new Date(premium.expiresAt) : null,
            autoRenew: premium.autoRenew || false,
            canGift: premium.canGift || false
        };
    },

    async getServerPremiumStatus(guildData) {
        const premium = guildData.premiumData || {};
        return {
            active: premium.active || false,
            type: premium.type || 'None',
            expiresAt: premium.expiresAt ? new Date(premium.expiresAt) : null,
            sponsorId: premium.sponsorId || null,
            stats: premium.stats || {}
        };
    },

    getTimeRemaining(expiresAt) {
        if (!expiresAt) return 'Belirsiz';
        
        const now = new Date();
        const timeLeft = expiresAt - now;
        
        if (timeLeft <= 0) return 'Süresi dolmuş';
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days} gün ${hours} saat`;
        return `${hours} saat`;
    },

    getActivePremiumFeatures(userPremium, serverPremium) {
        const features = [];
        
        if (userPremium.active) {
            features.push('• Kişisel premium özellikler');
        }
        
        if (serverPremium.active) {
            features.push('• Sunucu premium özellikleri');
        }
        
        return features.length > 0 ? features : ['• Aktif premium özellik bulunamadı'];
    },

    async activatePremiumCode(code, userData) {
        // Mock implementation - in real app, validate against database
        const validCodes = {
            'PREMIUM30': { package: 'Premium 1 Ay', duration: '30 gün', months: 1 },
            'PREMIUM90': { package: 'Premium 3 Ay', duration: '90 gün', months: 3 },
            'PREMIUM365': { package: 'Premium 1 Yıl', duration: '365 gün', months: 12 }
        };

        if (validCodes[code]) {
            const codeData = validCodes[code];
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + codeData.months);

            // Update user premium status
            await userData.update({
                premiumData: {
                    active: true,
                    type: codeData.package,
                    expiresAt: expiresAt,
                    autoRenew: false,
                    canGift: true,
                    activatedAt: new Date()
                }
            });

            return {
                success: true,
                package: codeData.package,
                duration: codeData.duration,
                expiresAt: expiresAt
            };
        }

        return { success: false };
    },

    async giftPremium(targetUserId, duration, gifterId) {
        // Mock implementation
        const costs = {
            '1month': '₺24.99',
            '3months': '₺64.99',
            '6months': '₺119.99',
            '1year': '₺199.99'
        };

        return {
            success: true,
            cost: costs[duration]
        };
    },

    getDurationText(duration) {
        const durations = {
            '1month': '1 Ay',
            '3months': '3 Ay',
            '6months': '6 Ay',
            '1year': '1 Yıl'
        };
        return durations[duration] || duration;
    }
};





