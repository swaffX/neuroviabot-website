const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

// ==========================================
// ⚠️ DEPRECATED: Use /nrc instead
// ==========================================
// This command is kept for backward compatibility
// All functionality has been moved to /nrc command

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('⚠️ DEPRECATED - Lütfen /nrc komutunu kullanın')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('💳 NeuroCoin bakiyeni görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Bakiyesi görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('🎁 Günlük NeuroCoin ödülünü al (500-1000 NRC)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('work')
                .setDescription('💼 Çalış ve NeuroCoin kazan (200-500 NRC)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('💸 Başka kullanıcıya NeuroCoin gönder')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('NRC gönderilecek kullanıcı')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Gönderilecek NRC miktarı')
                        .setMinValue(10)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deposit')
                .setDescription('🏦 Bankaya NeuroCoin yatır')
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Yatırılacak NRC miktarı (all = hepsi)')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('withdraw')
                .setDescription('🏧 Bankadan NeuroCoin çek')
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Çekilecek NRC miktarı (all = hepsi)')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('🏆 NeuroCoin zenginlik sıralaması')
                .addStringOption(option =>
                    option.setName('tür')
                        .setDescription('Sıralama türü')
                        .addChoices(
                            { name: '💰 Cüzdan', value: 'wallet' },
                            { name: '🏦 Banka', value: 'bank' },
                            { name: '📊 Toplam', value: 'total' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 NeuroCoin istatistikleri')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('İstatistikleri görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('convert')
                .setDescription('🔄 Eski coinleri NeuroCoin\'e çevir (tek seferlik)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('📊 NeuroCoin portföyünü görüntüle')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // REDIRECT to /nrc command
        const commandMap = {
            'balance': 'bakiye',
            'daily': 'günlük',
            'work': 'çalış',
            'transfer': 'gönder',
            'deposit': 'yatır',
            'withdraw': 'çek',
            'leaderboard': 'sıralama',
            'stats': 'istatistik',
            'convert': 'dönüştür',
            'portfolio': 'profil'
        };

        const newCommand = commandMap[subcommand] || subcommand;

        const redirectEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚠️ Komut Taşındı!')
            .setDescription(`\`/economy\` komutu artık kullanılmamaktadır.\n\n**Lütfen yeni komutu kullanın:**`)
            .addFields({
                name: '🆕 Yeni Komut',
                value: `\`\`\`\n/nrc ${newCommand}\n\`\`\``,
                inline: false
            }, {
                name: '💡 Neden değişti?',
                value: '`/nrc` komutu daha kısa, hızlı ve kullanıcı dostudur!\nTüm NRC işlemleriniz için tek bir komut.',
                inline: false
            }, {
                name: '📚 Tüm Komutlar',
                value: 'Tüm NRC komutlarını görmek için: `/nrc yardım`',
                inline: false
            })
            .setFooter({ text: 'NeuroCoin • The Neural Currency of Discord' })
            .setTimestamp();

        return interaction.reply({ embeds: [redirectEmbed], ephemeral: true });

        try {
            switch (subcommand) {
                case 'balance':
                    await this.handleBalance(interaction);
                    break;
                case 'daily':
                    await this.handleDaily(interaction);
                    break;
                case 'work':
                    await this.handleWork(interaction);
                    break;
                case 'transfer':
                    await this.handleTransfer(interaction);
                    break;
                case 'deposit':
                    await this.handleDeposit(interaction);
                    break;
                case 'withdraw':
                    await this.handleWithdraw(interaction);
                    break;
                case 'leaderboard':
                    await this.handleLeaderboard(interaction);
                    break;
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                case 'convert':
                    await this.handleConvert(interaction);
                    break;
                case 'portfolio':
                    await this.handlePortfolio(interaction);
                    break;
            }
        } catch (error) {
            logger.error('NeuroCoin komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ NeuroCoin Hatası')
                .setDescription('İşlem sırasında bir hata oluştu!')
                .setFooter({ text: 'The Neural Currency of Discord' })
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleBalance(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarının NeuroCoin verisi yoktur!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(targetUser.id);

        const balanceEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`🪙 ${targetUser.username} - NeuroCoin Bakiyesi`)
            .setDescription('**The Neural Currency of Discord**')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: `💵 Cüzdan`, value: `**${balance.wallet.toLocaleString()}** NRC`, inline: true },
                { name: `🏦 Banka`, value: `**${balance.bank.toLocaleString()}** NRC`, inline: true },
                { name: `📊 Toplam`, value: `**${balance.total.toLocaleString()}** NRC`, inline: true }
            )
            .setFooter({
                text: `NeuroCoin (NRC) • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [balanceEmbed] });
    },

    async handleDaily(interaction) {
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        // Son daily kontrolü
        const now = new Date();
        const lastDaily = balance.lastDaily;
        
        if (lastDaily) {
            const timeSinceDaily = now - new Date(lastDaily);
            const hoursLeft = 24 - (timeSinceDaily / (1000 * 60 * 60));
            
            if (hoursLeft > 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('⏰ Günlük Ödül Bekleniyor')
                    .setDescription(`Günlük NeuroCoin ödülünüzü zaten aldınız!`)
                    .addFields({
                        name: '🕒 Sonraki Ödül',
                        value: `${Math.floor(hoursLeft)} saat ${Math.floor((hoursLeft % 1) * 60)} dakika sonra`,
                        inline: false
                    })
                    .setFooter({ text: 'The Neural Currency of Discord' })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Daily streak hesapla
        const streakData = db.data.dailyStreaks.get(interaction.user.id) || { count: 0, lastClaim: null };
        let streak = streakData.count;
        
        if (streakData.lastClaim) {
            const daysSince = Math.floor((now - new Date(streakData.lastClaim)) / (1000 * 60 * 60 * 24));
            if (daysSince === 1) {
                streak += 1;
            } else if (daysSince > 1) {
                streak = 1; // Streak sıfırlandı
            }
        } else {
            streak = 1;
        }

        // Ödül hesapla (500-1000 NRC base + streak bonus)
        const baseReward = Math.floor(Math.random() * 501) + 500; // 500-1000 NRC
        const streakBonus = Math.min(streak * 50, 1000); // Max 1000 bonus
        const totalReward = baseReward + streakBonus;

        // Bakiyeyi güncelle
        db.updateNeuroCoinBalance(interaction.user.id, totalReward, 'wallet');
        balance.lastDaily = now.toISOString();
        db.data.neuroCoinBalances.set(interaction.user.id, balance);
        
        // Streak kaydet
        db.data.dailyStreaks.set(interaction.user.id, {
            count: streak,
            lastClaim: now.toISOString()
        });
        
        // Transaction kaydet
        db.recordTransaction('system', interaction.user.id, totalReward, 'daily', {
            streak,
            baseReward,
            streakBonus
        });
        
        db.saveData();

        const newBalance = db.getNeuroCoinBalance(interaction.user.id);

        const dailyEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🎁 Günlük NeuroCoin Ödülü!')
            .setDescription(`**The Neural Currency of Discord**\n\nGünlük ödülünüzü başarıyla aldınız!`)
            .addFields(
                { name: '💰 Kazanılan', value: `**${totalReward.toLocaleString()}** NRC`, inline: true },
                { name: '🔥 Streak', value: `**${streak}** gün`, inline: true },
                { name: '💵 Yeni Bakiye', value: `**${newBalance.wallet.toLocaleString()}** NRC`, inline: true }
            )
            .setFooter({
                text: `Yarın tekrar gelin! • NeuroCoin`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [dailyEmbed] });
    },

    async handleWork(interaction) {
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        // Son work kontrolü (4 saat cooldown)
        const now = new Date();
        const lastWork = balance.lastWork;
        
        if (lastWork) {
            const timeSinceWork = now - new Date(lastWork);
            const hoursLeft = 4 - (timeSinceWork / (1000 * 60 * 60));
            
            if (hoursLeft > 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('⏰ Çalışma Bekleniyor')
                    .setDescription(`Henüz tekrar çalışamazsınız!`)
                    .addFields({
                        name: '🕒 Sonraki Çalışma',
                        value: `${Math.floor(hoursLeft)} saat ${Math.floor((hoursLeft % 1) * 60)} dakika sonra`,
                        inline: false
                    })
                    .setFooter({ text: 'The Neural Currency of Discord' })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // İş türleri
        const jobs = [
            { name: '💻 Kod Yazdı', emoji: '💻' },
            { name: '🎨 Tasarım Yaptı', emoji: '🎨' },
            { name: '📊 Veri Analizi Yaptı', emoji: '📊' },
            { name: '🎮 Oyun Geliştirdi', emoji: '🎮' },
            { name: '📝 Makale Yazdı', emoji: '📝' },
            { name: '🎵 Müzik Üretti', emoji: '🎵' },
            { name: '🧠 AI Modeli Eğitti', emoji: '🧠' },
            { name: '🔧 Sistem Bakımı Yaptı', emoji: '🔧' }
        ];

        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        
        // Ödül hesapla (200-500 NRC)
        const reward = Math.floor(Math.random() * 301) + 200; // 200-500 NRC

        // Bakiyeyi güncelle
        db.updateNeuroCoinBalance(interaction.user.id, reward, 'wallet');
        balance.lastWork = now.toISOString();
        db.data.neuroCoinBalances.set(interaction.user.id, balance);
        
        // Transaction kaydet
        db.recordTransaction('system', interaction.user.id, reward, 'work', {
            job: randomJob.name
        });
        
        db.saveData();

        const newBalance = db.getNeuroCoinBalance(interaction.user.id);

        const workEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('💼 Çalışma Tamamlandı!')
            .setDescription(`**${randomJob.emoji} ${randomJob.name}**\n\nHarika iş çıkardınız!`)
            .addFields(
                { name: '💰 Kazanılan', value: `**${reward.toLocaleString()}** NRC`, inline: true },
                { name: '💵 Yeni Bakiye', value: `**${newBalance.wallet.toLocaleString()}** NRC`, inline: true }
            )
            .setFooter({
                text: '4 saat sonra tekrar çalışabilirsiniz • NeuroCoin',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [workEmbed] });
    },

    async handleTransfer(interaction) {
        const recipient = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');

        if (recipient.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarına NeuroCoin gönderemezsiniz!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (recipient.id === interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Geçersiz Transfer')
                .setDescription('Kendinize NeuroCoin gönderemezsiniz!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const db = getDatabase();
        const result = db.transferNeuroCoin(interaction.user.id, recipient.id, amount);

        if (!result.success) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Transfer Başarısız')
                .setDescription(result.error || 'Transfer işlemi başarısız oldu!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const senderBalance = db.getNeuroCoinBalance(interaction.user.id);

        const transferEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('💸 NeuroCoin Transferi Başarılı!')
            .setDescription(`**${recipient.username}** kullanıcısına NeuroCoin gönderildi!`)
            .addFields(
                { name: '💰 Gönderilen', value: `**${amount.toLocaleString()}** NRC`, inline: true },
                { name: '💵 Kalan Bakiye', value: `**${senderBalance.wallet.toLocaleString()}** NRC`, inline: true },
                { name: '📝 İşlem ID', value: `\`${result.txId}\``, inline: false }
            )
            .setFooter({
                text: `Transfer • NeuroCoin`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [transferEmbed] });

        // Alıcıya bildirim gönder (DM)
        try {
            const recipientEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('💰 NeuroCoin Aldınız!')
                .setDescription(`**${interaction.user.username}** size NeuroCoin gönderdi!`)
                .addFields(
                    { name: '💰 Alınan', value: `**${amount.toLocaleString()}** NRC`, inline: true },
                    { name: '📍 Sunucu', value: interaction.guild.name, inline: true }
                )
                .setFooter({ text: 'The Neural Currency of Discord' })
                .setTimestamp();

            await recipient.send({ embeds: [recipientEmbed] });
        } catch (error) {
            // DM gönderilemedi, sessizce devam et
        }
    },

    async handleDeposit(interaction) {
        const amount = interaction.options.getInteger('miktar');
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.wallet < amount) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Yetersiz Bakiye')
                .setDescription(`Cüzdanınızda yeterli NeuroCoin yok!\n\n**Cüzdan:** ${balance.wallet.toLocaleString()} NRC`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Transfer yap
        db.updateNeuroCoinBalance(interaction.user.id, -amount, 'wallet');
        db.updateNeuroCoinBalance(interaction.user.id, amount, 'bank');
        
        // Transaction kaydet
        db.recordTransaction(interaction.user.id, interaction.user.id, amount, 'deposit', {});
        db.saveData();

        const newBalance = db.getNeuroCoinBalance(interaction.user.id);

        const depositEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🏦 Banka Yatırma Başarılı!')
            .setDescription(`NeuroCoin bankaya yatırıldı!`)
            .addFields(
                { name: '💰 Yatırılan', value: `**${amount.toLocaleString()}** NRC`, inline: true },
                { name: '💵 Cüzdan', value: `**${newBalance.wallet.toLocaleString()}** NRC`, inline: true },
                { name: '🏦 Banka', value: `**${newBalance.bank.toLocaleString()}** NRC`, inline: true }
            )
            .setFooter({
                text: `Banka • NeuroCoin`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [depositEmbed] });
    },

    async handleWithdraw(interaction) {
        const amount = interaction.options.getInteger('miktar');
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.bank < amount) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Yetersiz Bakiye')
                .setDescription(`Bankanızda yeterli NeuroCoin yok!\n\n**Banka:** ${balance.bank.toLocaleString()} NRC`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Transfer yap
        db.updateNeuroCoinBalance(interaction.user.id, -amount, 'bank');
        db.updateNeuroCoinBalance(interaction.user.id, amount, 'wallet');
        
        // Transaction kaydet
        db.recordTransaction(interaction.user.id, interaction.user.id, amount, 'withdraw', {});
        db.saveData();

        const newBalance = db.getNeuroCoinBalance(interaction.user.id);

        const withdrawEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🏧 Banka Çekme Başarılı!')
            .setDescription(`NeuroCoin bankadan çekildi!`)
            .addFields(
                { name: '💰 Çekilen', value: `**${amount.toLocaleString()}** NRC`, inline: true },
                { name: '💵 Cüzdan', value: `**${newBalance.wallet.toLocaleString()}** NRC`, inline: true },
                { name: '🏦 Banka', value: `**${newBalance.bank.toLocaleString()}** NRC`, inline: true }
            )
            .setFooter({
                text: `Banka • NeuroCoin`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [withdrawEmbed] });
    },

    async handleLeaderboard(interaction) {
        const type = interaction.options.getString('tür') || 'total';
        const db = getDatabase();

        // Tüm balanceları al ve sırala
        const balances = [];
        for (const [userId, balance] of db.data.neuroCoinBalances) {
            balances.push({
                userId,
                wallet: balance.wallet,
                bank: balance.bank,
                total: balance.total
            });
        }

        // Sıralama türüne göre sırala
        balances.sort((a, b) => b[type] - a[type]);

        // Top 10
        const top10 = balances.slice(0, 10);

        if (top10.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('📊 NeuroCoin Sıralaması')
                .setDescription('Henüz hiç kimse NeuroCoin kazanmamış!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed] });
        }

        const typeNames = {
            wallet: '💵 Cüzdan',
            bank: '🏦 Banka',
            total: '📊 Toplam'
        };

        const medals = ['🥇', '🥈', '🥉'];
        
        let description = '';
        for (let i = 0; i < top10.length; i++) {
            const entry = top10[i];
            const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
            const username = user ? user.username : 'Bilinmeyen Kullanıcı';
            const medal = i < 3 ? medals[i] : `**${i + 1}.**`;
            const amount = entry[type].toLocaleString();
            
            description += `${medal} **${username}** - ${amount} NRC\n`;
        }

        // Kullanıcının sıralaması
        const userRank = balances.findIndex(b => b.userId === interaction.user.id) + 1;
        const userBalance = db.getNeuroCoinBalance(interaction.user.id);

        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`🏆 NeuroCoin Sıralaması - ${typeNames[type]}`)
            .setDescription(description)
            .addFields({
                name: '📍 Sizin Sıralamanız',
                value: userRank > 0 
                    ? `**#${userRank}** - ${userBalance[type].toLocaleString()} NRC`
                    : 'Henüz sıralamada değilsiniz',
                inline: false
            })
            .setFooter({
                text: `The Neural Currency of Discord • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [leaderboardEmbed] });
    },

    async handleStats(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarının NeuroCoin verisi yoktur!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(targetUser.id);
        const transactions = db.getUserTransactions(targetUser.id, 10);
        const streakData = db.data.dailyStreaks.get(targetUser.id) || { count: 0 };

        // Transaction istatistikleri
        let totalEarned = 0;
        let totalSpent = 0;
        let totalTransfers = 0;

        for (const tx of transactions) {
            if (tx.to === targetUser.id) {
                totalEarned += tx.amount;
            }
            if (tx.from === targetUser.id && tx.to !== targetUser.id) {
                totalSpent += tx.amount;
                totalTransfers++;
            }
        }

        const statsEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`📊 ${targetUser.username} - NeuroCoin İstatistikleri`)
            .setDescription('**The Neural Currency of Discord**')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '💰 Toplam Bakiye', value: `**${balance.total.toLocaleString()}** NRC`, inline: true },
                { name: '💵 Cüzdan', value: `**${balance.wallet.toLocaleString()}** NRC`, inline: true },
                { name: '🏦 Banka', value: `**${balance.bank.toLocaleString()}** NRC`, inline: true },
                { name: '📈 Toplam Kazanılan', value: `**${totalEarned.toLocaleString()}** NRC`, inline: true },
                { name: '📉 Toplam Harcanan', value: `**${totalSpent.toLocaleString()}** NRC`, inline: true },
                { name: '💸 Transfer Sayısı', value: `**${totalTransfers}**`, inline: true },
                { name: '🔥 Daily Streak', value: `**${streakData.count}** gün`, inline: true },
                { name: '📝 İşlem Sayısı', value: `**${transactions.length}**`, inline: true },
                { name: '⏱️ Son İşlem', value: transactions.length > 0 
                    ? `<t:${Math.floor(new Date(transactions[0].timestamp).getTime() / 1000)}:R>`
                    : 'Henüz işlem yok', inline: true }
            )
            .setFooter({
                text: `NeuroCoin İstatistikleri • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [statsEmbed] });
    },

    async handleConvert(interaction) {
        const db = getDatabase();
        
        // Eski ekonomi verisini kontrol et
        const oldEconomy = db.data.userEconomy.get(interaction.user.id);
        
        if (!oldEconomy || (oldEconomy.balance === 0 && oldEconomy.bank === 0)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Dönüştürülecek Coin Yok')
                .setDescription('Eski ekonomi sisteminde hiç coininiz yok veya zaten dönüştürdünüz!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Daha önce dönüştürüldü mü kontrol et
        if (oldEconomy.converted) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Zaten Dönüştürüldü')
                .setDescription('Eski coinlerinizi zaten NeuroCoin\'e dönüştürdünüz!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Conversion rate: 1 old coin = 10 NRC
        const CONVERSION_RATE = 10;
        const oldBalance = oldEconomy.balance || 0;
        const oldBank = oldEconomy.bank || 0;
        const oldTotal = oldBalance + oldBank;

        const newWallet = oldBalance * CONVERSION_RATE;
        const newBank = oldBank * CONVERSION_RATE;
        const newTotal = oldTotal * CONVERSION_RATE;

        // NeuroCoin bakiyesini güncelle
        db.updateNeuroCoinBalance(interaction.user.id, newWallet, 'wallet');
        db.updateNeuroCoinBalance(interaction.user.id, newBank, 'bank');

        // Transaction kaydet
        db.recordTransaction('system', interaction.user.id, newTotal, 'migration', {
            oldBalance,
            oldBank,
            conversionRate: CONVERSION_RATE
        });

        // Eski ekonomiyi işaretle
        oldEconomy.converted = true;
        db.data.userEconomy.set(interaction.user.id, oldEconomy);
        db.saveData();

        const balance = db.getNeuroCoinBalance(interaction.user.id);

        const convertEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🔄 Dönüştürme Başarılı!')
            .setDescription(`**Eski coinleriniz NeuroCoin'e dönüştürüldü!**\n\nDönüştürme oranı: **1:${CONVERSION_RATE}**`)
            .addFields(
                { name: '📊 Eski Toplam', value: `${oldTotal.toLocaleString()} coin`, inline: true },
                { name: '🪙 Yeni Toplam', value: `**${newTotal.toLocaleString()}** NRC`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: '💵 Cüzdan', value: `**${balance.wallet.toLocaleString()}** NRC`, inline: true },
                { name: '🏦 Banka', value: `**${balance.bank.toLocaleString()}** NRC`, inline: true },
                { name: '📊 Toplam', value: `**${balance.total.toLocaleString()}** NRC`, inline: true }
            )
            .setFooter({
                text: 'Welcome to NeuroCoin! • The Neural Currency of Discord',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [convertEmbed] });
    },

    async handlePortfolio(interaction) {
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);
        const transactions = db.getUserTransactions(interaction.user.id, 5);
        const streakData = db.data.dailyStreaks.get(interaction.user.id) || { count: 0 };

        // Son 5 işlem
        let recentTransactions = '```\n';
        if (transactions.length === 0) {
            recentTransactions += 'Henüz işlem yok\n';
        } else {
            for (const tx of transactions) {
                const date = new Date(tx.timestamp);
                const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                const typeEmoji = {
                    daily: '🎁',
                    work: '💼',
                    transfer: '💸',
                    deposit: '🏦',
                    withdraw: '🏧',
                    activity: '⚡',
                    migration: '🔄'
                }[tx.type] || '📝';
                
                const amount = tx.to === interaction.user.id ? `+${tx.amount}` : `-${tx.amount}`;
                recentTransactions += `${dateStr} ${typeEmoji} ${amount} NRC\n`;
            }
        }
        recentTransactions += '```';

        const portfolioEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`📊 ${interaction.user.username} - NeuroCoin Portföyü`)
            .setDescription('**The Neural Currency of Discord**')
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { name: '💰 Toplam Varlık', value: `**${balance.total.toLocaleString()}** NRC`, inline: false },
                { name: '💵 Cüzdan', value: `${balance.wallet.toLocaleString()} NRC`, inline: true },
                { name: '🏦 Banka', value: `${balance.bank.toLocaleString()} NRC`, inline: true },
                { name: '🔥 Daily Streak', value: `${streakData.count} gün`, inline: true },
                { name: '📜 Son İşlemler', value: recentTransactions, inline: false }
            )
            .setFooter({
                text: `NeuroCoin Portföyü • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [portfolioEmbed] });
    }
};
