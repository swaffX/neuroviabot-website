const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('💰 Ekonomi sistemi komutları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('💳 Bakiye görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Bakiyesi görüntülenecek kullanıcı (isteğe bağlı)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('🎁 Günlük ödülünü al')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('work')
                .setDescription('💼 Çalış ve para kazan')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('💸 Başka kullanıcıya para gönder')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Para gönderilecek kullanıcı')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Gönderilecek miktar')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deposit')
                .setDescription('🏦 Bankaya para yatır')
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Yatırılacak miktar (all = hepsi)')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('withdraw')
                .setDescription('🏧 Bankadan para çek')
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Çekilecek miktar (all = hepsi)')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('🏆 Zenginlik sıralaması')
                .addStringOption(option =>
                    option.setName('tür')
                        .setDescription('Sıralama türü')
                        .addChoices(
                            { name: '💰 Cüzdan', value: 'balance' },
                            { name: '🏦 Banka', value: 'bank' },
                            { name: '📊 Toplam', value: 'total' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Ekonomi istatistikleri')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('İstatistikleri görüntülenecek kullanıcı (isteğe bağlı)')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Ekonomi sistemi aktif mi kontrol et
        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });
        if (!guild || !guild.economyEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ekonomi Sistemi Kapalı')
                .setDescription('Bu sunucuda ekonomi sistemi etkin değil!')
                .addFields({
                    name: '💡 Yöneticiler İçin',
                    value: 'Ekonomi sistemini etkinleştirmek için web panelini kullanın.',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'balance':
                    await this.handleBalance(interaction, guild);
                    break;
                case 'daily':
                    await this.handleDaily(interaction, guild);
                    break;
                case 'work':
                    await this.handleWork(interaction, guild);
                    break;
                case 'transfer':
                    await this.handleTransfer(interaction, guild);
                    break;
                case 'deposit':
                    await this.handleDeposit(interaction, guild);
                    break;
                case 'withdraw':
                    await this.handleWithdraw(interaction, guild);
                    break;
                case 'leaderboard':
                    await this.handleLeaderboard(interaction, guild);
                    break;
                case 'stats':
                    await this.handleStats(interaction, guild);
                    break;
            }
        } catch (error) {
            logger.error('Economy komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ekonomi Hatası')
                .setDescription('Ekonomi işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleBalance(interaction, guild) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarının ekonomi verisi yoktur!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const guildMember = await GuildMember.findOne({
            where: {
                userId: targetUser.id,
                guildId: interaction.guild.id
            },
            include: [{
                model: User,
                as: 'user'
            }]
        });

        if (!guildMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Bu kullanıcının ekonomi verisi bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const balance = parseInt(guildMember.balance) || 0;
        const bank = parseInt(guildMember.bank) || 0;
        const total = balance + bank;

        const balanceEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`💰 ${targetUser.username} - Bakiye`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: `💵 Cüzdan`, value: `${balance.toLocaleString()} ${guild.currencySymbol}`, inline: true },
                { name: `🏦 Banka`, value: `${bank.toLocaleString()} ${guild.currencySymbol}`, inline: true },
                { name: `📊 Toplam`, value: `${total.toLocaleString()} ${guild.currencySymbol}`, inline: true }
            )
            .setFooter({
                text: `${guild.currencyName} • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [balanceEmbed] });
    },

    async handleDaily(interaction, guild) {
        const guildMember = await GuildMember.findOne({
            where: {
                userId: interaction.user.id,
                guildId: interaction.guild.id
            }
        });

        if (!guildMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Ekonomi verileriniz bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Son daily kontrolü
        const now = new Date();
        const lastDaily = guildMember.lastDaily;
        
        if (lastDaily) {
            const timeSinceDaily = now - new Date(lastDaily);
            const hoursLeft = 24 - (timeSinceDaily / (1000 * 60 * 60));
            
            if (hoursLeft > 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Günlük Ödül Bekleniyor')
                    .setDescription(`Günlük ödülünüzü zaten aldınız!`)
                    .addFields({
                        name: '🕒 Sonraki Ödül',
                        value: `${Math.floor(hoursLeft)} saat ${Math.floor((hoursLeft % 1) * 60)} dakika sonra`,
                        inline: false
                    })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Daily streak hesapla
        let streak = guildMember.dailyStreak || 0;
        if (lastDaily) {
            const daysSince = Math.floor((now - new Date(lastDaily)) / (1000 * 60 * 60 * 24));
            if (daysSince === 1) {
                streak += 1;
            } else if (daysSince > 1) {
                streak = 1; // Streak sıfırlandı
            }
        } else {
            streak = 1;
        }

        // Ödül miktarı hesapla
        const baseAmount = guild.dailyAmount || 100;
        const streakBonus = Math.min(streak * 10, 500); // Max 500 bonus
        const totalAmount = baseAmount + streakBonus;

        // Bakiyeyi güncelle
        const newBalance = parseInt(guildMember.balance) + totalAmount;
        await guildMember.update({
            balance: newBalance,
            lastDaily: now,
            dailyStreak: streak
        });

        // Real-time güncelleme gönder
        if (global.realtimeUpdates) {
            global.realtimeUpdates.economyUpdate(interaction.guild.id, interaction.user.id, {
                type: 'daily_reward',
                amount: totalAmount,
                streak: streak,
                newBalance: newBalance,
                user: {
                    id: interaction.user.id,
                    username: interaction.user.username,
                    avatar: interaction.user.displayAvatarURL()
                }
            });
        }

        const dailyEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎁 Günlük Ödül Alındı!')
            .setDescription(`Günlük ödülünüzü başarıyla aldınız!`)
            .addFields(
                { name: '💰 Kazanılan', value: `${totalAmount.toLocaleString()} ${guild.currencySymbol}`, inline: true },
                { name: '🔥 Streak', value: `${streak} gün`, inline: true },
                { name: '🎯 Bonus', value: `${streakBonus.toLocaleString()} ${guild.currencySymbol}`, inline: true },
                { name: '💵 Yeni Bakiye', value: `${newBalance.toLocaleString()} ${guild.currencySymbol}`, inline: false }
            )
            .setFooter({
                text: 'Sonraki ödül 24 saat sonra!',
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [dailyEmbed] });
    },

    async handleWork(interaction, guild) {
        const guildMember = await GuildMember.findOne({
            where: {
                userId: interaction.user.id,
                guildId: interaction.guild.id
            }
        });

        if (!guildMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Ekonomi verileriniz bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Cooldown kontrolü
        const now = new Date();
        const lastWork = guildMember.lastWork;
        const cooldown = guild.workCooldown || 3600000; // 1 saat default
        
        if (lastWork) {
            const timeSinceWork = now - new Date(lastWork);
            
            if (timeSinceWork < cooldown) {
                const timeLeft = cooldown - timeSinceWork;
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Çalışma Bekleniyor')
                    .setDescription(`Henüz çalışamazsınız!`)
                    .addFields({
                        name: '🕒 Sonraki Çalışma',
                        value: `${hoursLeft} saat ${minutesLeft} dakika sonra`,
                        inline: false
                    })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Çalışma işleri
        const jobs = [
            { name: 'Kargo Dağıtım', emoji: '📦', description: 'Paketleri evlere teslim ettiniz' },
            { name: 'Temizlik', emoji: '🧹', description: 'Ofisleri temizlediniz' },
            { name: 'Garsonluk', emoji: '🍽️', description: 'Restoranda müşterilere hizmet verdiniz' },
            { name: 'Yazılım Geliştirme', emoji: '💻', description: 'Kod yazdınız ve bug\'ları düzelttiniz' },
            { name: 'Grafik Tasarım', emoji: '🎨', description: 'Müşteriler için logo tasarladınız' },
            { name: 'Bahçıvanlık', emoji: '🌱', description: 'Çiçekleri suladınız ve bahçeyi düzenlediniz' },
            { name: 'Müzik Dersi', emoji: '🎵', description: 'Öğrencilere müzik dersi verdiniz' },
            { name: 'Fotoğrafçılık', emoji: '📸', description: 'Etkinlik fotoğrafları çektiniz' }
        ];

        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        
        // Kazanç hesapla
        const minAmount = guild.workMinAmount || 50;
        const maxAmount = guild.workMaxAmount || 200;
        const earnedAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

        // Work streak hesapla
        let workStreak = guildMember.workStreak || 0;
        if (lastWork) {
            const daysSince = Math.floor((now - new Date(lastWork)) / (1000 * 60 * 60 * 24));
            if (daysSince <= 1) {
                workStreak += 1;
            } else {
                workStreak = 1;
            }
        } else {
            workStreak = 1;
        }

        // Streak bonusu
        const streakBonus = Math.min(workStreak * 5, 100);
        const totalAmount = earnedAmount + streakBonus;

        // Bakiyeyi güncelle
        await guildMember.update({
            balance: parseInt(guildMember.balance) + totalAmount,
            lastWork: now,
            workStreak: workStreak
        });

        const workEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`💼 ${randomJob.name}`)
            .setDescription(`${randomJob.emoji} ${randomJob.description}`)
            .addFields(
                { name: '💰 Kazanılan', value: `${earnedAmount.toLocaleString()} ${guild.currencySymbol}`, inline: true },
                { name: '🔥 Streak Bonusu', value: `${streakBonus.toLocaleString()} ${guild.currencySymbol}`, inline: true },
                { name: '📊 Toplam', value: `${totalAmount.toLocaleString()} ${guild.currencySymbol}`, inline: true },
                { name: '💵 Yeni Bakiye', value: `${(parseInt(guildMember.balance) + totalAmount).toLocaleString()} ${guild.currencySymbol}`, inline: false }
            )
            .setFooter({
                text: `Çalışma Streak: ${workStreak} | Sonraki: ${Math.floor(cooldown / (1000 * 60 * 60))} saat sonra`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [workEmbed] });
    },

    // Transfer, deposit, withdraw, leaderboard ve stats metodları buraya gelecek...
};

