const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invest')
        .setDescription('📈 NRC yatırım ve kredi sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('stake')
                .setDescription('🏦 NRC stake et ve faiz kazan')
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Stake edilecek NRC miktarı (bankadan)')
                        .setMinValue(1000)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('süre')
                        .setDescription('Stake süresi')
                        .addChoices(
                            { name: '7 gün (5% APY)', value: '7' },
                            { name: '30 gün (10% APY)', value: '30' },
                            { name: '90 gün (15% APY)', value: '90' },
                            { name: '365 gün (20% APY)', value: '365' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('positions')
                .setDescription('📊 Aktif staking pozisyonlarını görüntüle')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('💰 Staking pozisyonunu kapat ve ödülü al')
                .addStringOption(option =>
                    option.setName('pozisyon')
                        .setDescription('Kapatılacak pozisyon ID')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('loan')
                .setDescription('💳 NRC kredisi al')
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Kredi miktarı')
                        .setMinValue(500)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('süre')
                        .setDescription('Geri ödeme süresi')
                        .addChoices(
                            { name: '7 gün', value: '7' },
                            { name: '14 gün', value: '14' },
                            { name: '30 gün', value: '30' },
                            { name: '60 gün', value: '60' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('loans')
                .setDescription('📝 Aktif kredileri görüntüle')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('repay')
                .setDescription('💵 Kredi öde')
                .addStringOption(option =>
                    option.setName('kredi')
                        .setDescription('Ödenecek kredi ID')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('credit')
                .setDescription('⭐ Kredi skorunu görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Skoru görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'stake':
                    await this.handleStake(interaction);
                    break;
                case 'positions':
                    await this.handlePositions(interaction);
                    break;
                case 'claim':
                    await this.handleClaim(interaction);
                    break;
                case 'loan':
                    await this.handleLoan(interaction);
                    break;
                case 'loans':
                    await this.handleLoans(interaction);
                    break;
                case 'repay':
                    await this.handleRepay(interaction);
                    break;
                case 'credit':
                    await this.handleCredit(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Invest komut hatası', error, { 
                subcommand, 
                user: interaction.user.id 
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Yatırım Hatası')
                .setDescription('İşlem sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleStake(interaction) {
        const amount = interaction.options.getInteger('miktar');
        const duration = parseInt(interaction.options.getString('süre'));

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.bank < amount) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Yetersiz Bakiye')
                    .setDescription(`Bankada yeterli NRC yok!\n\n**Banka:** ${balance.bank.toLocaleString()} NRC\n**Gerekli:** ${amount.toLocaleString()} NRC\n\n💡 /economy deposit ile cüzdanınızdan bankaya yatırabilirsiniz.`)
                ],
                ephemeral: true
            });
        }

        const result = db.createStakingPosition(interaction.user.id, amount, duration);

        if (!result.success) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Staking Başarısız')
                    .setDescription(result.error || 'Bilinmeyen hata')
                ],
                ephemeral: true
            });
        }

        const staking = result.staking;
        const endDate = new Date(staking.endsAt);

        const stakeEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Staking Pozisyonu Oluşturuldu')
            .setDescription('NRC başarıyla stake edildi! Süre dolduğunda ödülünüzü alabilirsiniz.')
            .addFields(
                { name: '💰 Stake Edilen', value: `${amount.toLocaleString()} NRC`, inline: true },
                { name: '📈 APY', value: `${staking.apy}%`, inline: true },
                { name: '🎁 Beklenen Ödül', value: `${staking.totalReward.toLocaleString()} NRC`, inline: true },
                { name: '⏱️ Süre', value: `${duration} gün`, inline: true },
                { name: '📅 Bitiş Tarihi', value: `<t:${Math.floor(endDate.getTime() / 1000)}:F>`, inline: true },
                { name: '💵 Toplam Geri Dönüş', value: `**${(amount + staking.totalReward).toLocaleString()}** NRC`, inline: true },
                { name: '📝 Pozisyon ID', value: `\`${staking.id}\``, inline: false },
                { name: '⚠️ Erken Çekme', value: 'Süre dolmadan çekerseniz **%20 ceza** uygulanır ve ödül alamazsınız!', inline: false }
            )
            .setFooter({ text: 'Staking • NeuroCoin' })
            .setTimestamp();

        await interaction.reply({ embeds: [stakeEmbed] });
    },

    async handlePositions(interaction) {
        const db = getDatabase();
        const positions = db.getUserStakingPositions(interaction.user.id);

        if (positions.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('📊 Staking Pozisyonları')
                    .setDescription('Aktif staking pozisyonunuz yok!\n\n💡 `/invest stake` ile yeni pozisyon açabilirsiniz.')
                ],
                ephemeral: true
            });
        }

        let totalStaked = 0;
        let totalReward = 0;
        let positionsText = '';

        for (const pos of positions) {
            const now = Date.now();
            const isMatured = now >= pos.endsAt;
            const daysLeft = Math.ceil((pos.endsAt - now) / (1000 * 60 * 60 * 24));
            
            const statusEmoji = isMatured ? '✅' : '⏳';
            const timeText = isMatured ? 'Hazır!' : `${daysLeft} gün kaldı`;

            totalStaked += pos.amount;
            totalReward += pos.totalReward;

            positionsText += `${statusEmoji} **${pos.amount.toLocaleString()}** NRC | APY: ${pos.apy}% | ${timeText}\n`;
            positionsText += `└ Ödül: **+${pos.totalReward.toLocaleString()}** NRC | ID: \`${pos.id}\`\n\n`;
        }

        const positionsEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('📊 Aktif Staking Pozisyonları')
            .setDescription(positionsText)
            .addFields(
                { name: '💰 Toplam Stake', value: `${totalStaked.toLocaleString()} NRC`, inline: true },
                { name: '🎁 Toplam Ödül', value: `${totalReward.toLocaleString()} NRC`, inline: true },
                { name: '📊 Pozisyon Sayısı', value: `${positions.length}`, inline: true }
            )
            .setFooter({ text: 'Kapat: /invest claim <pozisyon_id>' })
            .setTimestamp();

        await interaction.reply({ embeds: [positionsEmbed] });
    },

    async handleClaim(interaction) {
        const positionId = interaction.options.getString('pozisyon');
        const db = getDatabase();

        const result = db.claimStaking(positionId, interaction.user.id);

        if (!result.success) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Claim Başarısız')
                    .setDescription(result.error || 'Bilinmeyen hata')
                ],
                ephemeral: true
            });
        }

        const balance = db.getNeuroCoinBalance(interaction.user.id);

        let claimEmbed;
        
        if (result.isEarly) {
            claimEmbed = new EmbedBuilder()
                .setColor('#f59e0b')
                .setTitle('⚠️ Erken Çekme - Staking Kapatıldı')
                .setDescription('Staking süreniz dolmadan çektiniz. Ceza uygulandı!')
                .addFields(
                    { name: '🚫 Ceza', value: `${result.penalty.toLocaleString()} NRC (-%20)`, inline: true },
                    { name: '💰 Alınan Miktar', value: `${result.returnAmount.toLocaleString()} NRC`, inline: true },
                    { name: '💵 Yeni Banka Bakiyesi', value: `${balance.bank.toLocaleString()} NRC`, inline: true }
                )
                .setFooter({ text: 'Erken Çekme Cezası • NeuroCoin' })
                .setTimestamp();
        } else {
            claimEmbed = new EmbedBuilder()
                .setColor('#10b981')
                .setTitle('✅ Staking Tamamlandı!')
                .setDescription('Staking pozisyonunuz başarıyla kapatıldı ve ödülünüz alındı!')
                .addFields(
                    { name: '🎁 Ödül', value: `${result.reward.toLocaleString()} NRC`, inline: true },
                    { name: '💰 Toplam Alınan', value: `${result.returnAmount.toLocaleString()} NRC`, inline: true },
                    { name: '💵 Yeni Banka Bakiyesi', value: `${balance.bank.toLocaleString()} NRC`, inline: true }
                )
                .setFooter({ text: 'Staking Tamamlandı • NeuroCoin' })
                .setTimestamp();
        }

        await interaction.reply({ embeds: [claimEmbed] });
    },

    async handleLoan(interaction) {
        const amount = interaction.options.getInteger('miktar');
        const duration = parseInt(interaction.options.getString('süre'));

        const db = getDatabase();
        const result = db.createLoan(interaction.user.id, amount, duration);

        if (!result.success) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Kredi Başarısız')
                    .setDescription(result.error || 'Bilinmeyen hata')
                ],
                ephemeral: true
            });
        }

        const loan = result.loan;
        const dueDate = new Date(loan.dueDate);
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        const loanEmbed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle('✅ Kredi Onaylandı')
            .setDescription('NRC krediniz cüzdanınıza yatırıldı!')
            .addFields(
                { name: '💰 Kredi Miktarı', value: `${amount.toLocaleString()} NRC`, inline: true },
                { name: '📊 Faiz Oranı', value: `${loan.interestRate.toFixed(2)}%`, inline: true },
                { name: '💸 Faiz Tutarı', value: `${loan.interestAmount.toLocaleString()} NRC`, inline: true },
                { name: '💵 Toplam Geri Ödeme', value: `**${loan.totalRepayment.toLocaleString()}** NRC`, inline: true },
                { name: '📅 Son Ödeme Tarihi', value: `<t:${Math.floor(dueDate.getTime() / 1000)}:F>`, inline: true },
                { name: '⏱️ Süre', value: `${duration} gün`, inline: true },
                { name: '📝 Kredi ID', value: `\`${loan.id}\``, inline: false },
                { name: '💳 Yeni Cüzdan Bakiyesi', value: `${balance.wallet.toLocaleString()} NRC`, inline: false },
                { name: '⚠️ Uyarı', value: 'Krediyi zamanında ödemezseniz kredi skorunuz düşer!', inline: false }
            )
            .setFooter({ text: 'Kredi Sistemi • NeuroCoin' })
            .setTimestamp();

        await interaction.reply({ embeds: [loanEmbed] });
    },

    async handleLoans(interaction) {
        const db = getDatabase();
        const loans = db.getUserLoans(interaction.user.id);

        if (loans.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('📝 Krediler')
                    .setDescription('Aktif krediniz yok!\n\n💡 `/invest loan` ile kredi alabilirsiniz.')
                ],
                ephemeral: true
            });
        }

        let totalDebt = 0;
        let loansText = '';

        for (const loan of loans) {
            const now = Date.now();
            const isOverdue = now > loan.dueDate;
            const daysLeft = Math.ceil((loan.dueDate - now) / (1000 * 60 * 60 * 24));
            
            const statusEmoji = isOverdue ? '🚨' : '📝';
            const timeText = isOverdue ? '**VADESİ GEÇMİŞ!**' : `${daysLeft} gün kaldı`;

            totalDebt += loan.totalRepayment;

            loansText += `${statusEmoji} **${loan.amount.toLocaleString()}** NRC | Faiz: +${loan.interestAmount.toLocaleString()} NRC\n`;
            loansText += `└ Toplam: **${loan.totalRepayment.toLocaleString()}** NRC | ${timeText}\n`;
            loansText += `└ ID: \`${loan.id}\`\n\n`;
        }

        const loansEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('📝 Aktif Krediler')
            .setDescription(loansText)
            .addFields(
                { name: '💸 Toplam Borç', value: `${totalDebt.toLocaleString()} NRC`, inline: true },
                { name: '📊 Kredi Sayısı', value: `${loans.length}`, inline: true }
            )
            .setFooter({ text: 'Öde: /invest repay <kredi_id>' })
            .setTimestamp();

        await interaction.reply({ embeds: [loansEmbed] });
    },

    async handleRepay(interaction) {
        const loanId = interaction.options.getString('kredi');
        const db = getDatabase();

        const result = db.repayLoan(loanId, interaction.user.id);

        if (!result.success) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Ödeme Başarısız')
                    .setDescription(result.error || 'Bilinmeyen hata')
                ],
                ephemeral: true
            });
        }

        const loan = result.loan;
        const balance = db.getNeuroCoinBalance(interaction.user.id);
        const userSettings = db.getUserSettings(interaction.user.id) || {};
        const creditScore = userSettings.creditScore || 100;

        const repayEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Kredi Ödendi')
            .setDescription('Krediniz başarıyla ödendi!')
            .addFields(
                { name: '💰 Ödenen Miktar', value: `${loan.repaidAmount.toLocaleString()} NRC`, inline: true },
                { name: '⭐ Kredi Skoru', value: `${creditScore}`, inline: true },
                { name: '💵 Yeni Cüzdan Bakiyesi', value: `${balance.wallet.toLocaleString()} NRC`, inline: true }
            )
            .setFooter({ text: 'Kredi Ödeme • NeuroCoin' })
            .setTimestamp();

        await interaction.reply({ embeds: [repayEmbed] });
    },

    async handleCredit(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Bot kullanıcılarının kredi skoru yoktur!',
                ephemeral: true
            });
        }

        const db = getDatabase();
        const userSettings = db.getUserSettings(targetUser.id) || {};
        const creditScore = userSettings.creditScore || 100;

        const loans = db.getUserLoans(targetUser.id);
        const activeLoans = loans.filter(l => l.status === 'active').length;

        const rating = creditScore >= 80 ? '🟢 Mükemmel' :
                      creditScore >= 60 ? '🟡 İyi' :
                      creditScore >= 40 ? '🟠 Orta' : '🔴 Düşük';

        const maxLoan = Math.floor(creditScore * 100); // Score * 100 = max loan

        const creditEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`⭐ ${targetUser.username} - Kredi Skoru`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '📊 Skor', value: `**${creditScore}**/100`, inline: true },
                { name: '🎯 Değerlendirme', value: rating, inline: true },
                { name: '💰 Max Kredi', value: `${maxLoan.toLocaleString()} NRC`, inline: true },
                { name: '📝 Aktif Krediler', value: `${activeLoans}`, inline: true }
            )
            .setFooter({ text: 'Kredi Skoru • NeuroCoin' })
            .setTimestamp();

        await interaction.reply({ embeds: [creditEmbed] });
    }
};

