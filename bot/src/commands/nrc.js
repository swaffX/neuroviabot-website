// ==========================================
// 🪙 NRC (NeuroCoin) - Quick Access Command
// ==========================================

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nrc')
        .setDescription('🪙 NeuroCoin (NRC) hızlı erişim')
        .addSubcommand(subcommand =>
            subcommand
                .setName('bakiye')
                .setDescription('💳 NRC bakiyeni görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Bakiyesi görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('günlük')
                .setDescription('🎁 Günlük NRC ödülünü al (500-1000 NRC)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('çalış')
                .setDescription('💼 Çalış ve NRC kazan (200-500 NRC, 4 saat cooldown)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('gönder')
                .setDescription('💸 Başka kullanıcıya NRC gönder')
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
                .setName('yatır')
                .setDescription('🏦 Bankaya NRC yatır (güvenli sakla)')
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Yatırılacak NRC miktarı')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('çek')
                .setDescription('💰 Bankadan NRC çek')
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Çekilecek NRC miktarı')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sıralama')
                .setDescription('🏆 NRC zenginlik sıralaması')
                .addStringOption(option =>
                    option.setName('tür')
                        .setDescription('Sıralama türü')
                        .addChoices(
                            { name: '💰 Toplam Bakiye', value: 'total' },
                            { name: '💵 Cüzdan', value: 'wallet' },
                            { name: '🏦 Banka', value: 'bank' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('profil')
                .setDescription('👤 NRC profil ve istatistikleri')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Profili görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('yardım')
                .setDescription('❓ NRC sistemi hakkında bilgi al')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('istatistik')
                .setDescription('📊 NRC istatistikleri ve işlem geçmişi')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('İstatistikleri görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('dönüştür')
                .setDescription('🔄 Eski coinleri NRC\'ye çevir (tek seferlik)')
        )
        .addSubcommandGroup(group =>
            group
                .setName('koleksiyon')
                .setDescription('🎨 NFT Koleksiyon sistemi')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('liste')
                        .setDescription('📜 Mevcut NFT koleksiyonlarını görüntüle')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('satın-al')
                        .setDescription('🛒 NFT satın al')
                        .addStringOption(option =>
                            option.setName('koleksiyon')
                                .setDescription('Koleksiyon ID\'si')
                                .setRequired(true)
                                .addChoices(
                                    { name: '🖼️ Avatar Çerçeveleri', value: 'avatar_frames_01' },
                                    { name: '🃏 Trading Cards', value: 'trading_cards_01' },
                                    { name: '🏆 Rozetler', value: 'badges_achievements' },
                                    { name: '🎨 Profil Öğeleri', value: 'profile_items_01' }
                                )
                        )
                        .addStringOption(option =>
                            option.setName('item')
                                .setDescription('Satın alınacak item ID\'si')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('envanter')
                        .setDescription('🎒 NFT envanterinizi görüntüle')
                        .addUserOption(option =>
                            option.setName('kullanıcı')
                                .setDescription('Envanteri görüntülenecek kullanıcı')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('sat')
                        .setDescription('💰 NFT\'nizi marketplace\'e listeleyin')
                        .addStringOption(option =>
                            option.setName('koleksiyon')
                                .setDescription('Koleksiyon ID\'si')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('item')
                                .setDescription('Satılacak item ID\'si')
                                .setRequired(true)
                        )
                        .addIntegerOption(option =>
                            option.setName('fiyat')
                                .setDescription('Satış fiyatı (NRC)')
                                .setMinValue(1)
                                .setRequired(true)
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('premium')
                .setDescription('👑 Premium abonelik sistemi')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('planlar')
                        .setDescription('📋 Tüm premium planlarını görüntüle')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('satın-al')
                        .setDescription('💳 Premium satın al')
                        .addStringOption(option =>
                            option.setName('plan')
                                .setDescription('Premium planı seçin')
                                .setRequired(true)
                                .addChoices(
                                    { name: '🥉 Bronze Premium - 5,000 NRC', value: 'bronze' },
                                    { name: '🥈 Silver Premium - 15,000 NRC', value: 'silver' },
                                    { name: '🥇 Gold Premium - 50,000 NRC', value: 'gold' }
                                )
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('durum')
                        .setDescription('📊 Premium durumunuzu kontrol edin')
                        .addUserOption(option =>
                            option.setName('kullanıcı')
                                .setDescription('Durumu kontrol edilecek kullanıcı')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('iptal')
                        .setDescription('❌ Premium otomatik yenilemeyi iptal et')
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('yatırım')
                .setDescription('💰 NRC yatırım ve faiz sistemi')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('planlar')
                        .setDescription('📋 Yatırım planlarını görüntüle')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('yap')
                        .setDescription('💸 Yatırım yap ve faiz kazan')
                        .addStringOption(option =>
                            option.setName('plan')
                                .setDescription('Yatırım planı seçin')
                                .setRequired(true)
                                .addChoices(
                                    { name: '📅 7 Gün - 5% APY (Min: 100 NRC)', value: 'week' },
                                    { name: '📆 30 Gün - 15% APY (Min: 500 NRC)', value: 'month' },
                                    { name: '🗓️ 90 Gün - 35% APY (Min: 1,000 NRC)', value: 'quarter' }
                                )
                        )
                        .addIntegerOption(option =>
                            option.setName('miktar')
                                .setDescription('Yatırılacak NRC miktarı')
                                .setMinValue(100)
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('durum')
                        .setDescription('📊 Yatırım portföyünüzü görüntüle')
                        .addUserOption(option =>
                            option.setName('kullanıcı')
                                .setDescription('Portföyü görüntülenecek kullanıcı')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('çek')
                        .setDescription('💰 Yatırımı çek (vade dolmuşsa)')
                        .addStringOption(option =>
                            option.setName('yatırım-id')
                                .setDescription('Yatırım ID\'si (durum komutuyla öğrenebilirsiniz)')
                                .setRequired(true)
                        )
                        .addBooleanOption(option =>
                            option.setName('erken')
                                .setDescription('Erken çekme (25% ceza)')
                                .setRequired(false)
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('market')
                .setDescription('🛒 NFT Marketplace')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('liste')
                        .setDescription('📜 Marketplace\'te satışta olan NFT\'leri görüntüle')
                        .addStringOption(option =>
                            option.setName('nadirlık')
                                .setDescription('Nadirlık filtresi')
                                .setRequired(false)
                                .addChoices(
                                    { name: '⚪ Common', value: 'common' },
                                    { name: '🔵 Rare', value: 'rare' },
                                    { name: '🟣 Epic', value: 'epic' },
                                    { name: '🟡 Legendary', value: 'legendary' }
                                )
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('satın-al')
                        .setDescription('💸 Marketplace\'ten NFT satın al (escrow korumalı)')
                        .addStringOption(option =>
                            option.setName('listing-id')
                                .setDescription('Satın alınacak listing ID\'si')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('listem')
                        .setDescription('📋 Kendi listingler ve iptal etme')
                )
        ),

    async execute(interaction) {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        // Ekonomi sistemi kontrolü
        const db = getDatabase();
        const settings = db.getGuildSettings(interaction.guild.id);
        
        // Features objesi içinde veya direkt economy objesi olarak kontrol et
        const economyEnabled = settings.features?.economy || settings.economy?.enabled;
        
        if (!economyEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ NeuroCoin Sistemi Kapalı')
                .setDescription('Bu sunucuda NeuroCoin ekonomi sistemi etkin değil!')
                .addFields({
                    name: '💡 Yöneticiler İçin',
                    value: `🌐 **Web Dashboard üzerinden açabilirsiniz:**\n└ https://neuroviabot.xyz/dashboard\n└ Sunucunuzu seçin → Ekonomi → Sistemi Etkinleştir`,
                    inline: false
                })
                .setFooter({ text: 'The Neural Currency of Discord' })
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            // Handle subcommand groups
            if (subcommandGroup === 'koleksiyon') {
                switch (subcommand) {
                    case 'liste':
                        await this.handleCollectionList(interaction);
                        break;
                    case 'satın-al':
                        await this.handleCollectionPurchase(interaction);
                        break;
                    case 'envanter':
                        await this.handleCollectionInventory(interaction);
                        break;
                    case 'sat':
                        await this.handleCollectionSell(interaction);
                        break;
                }
                return;
            }

            if (subcommandGroup === 'premium') {
                switch (subcommand) {
                    case 'planlar':
                        await this.handlePremiumPlans(interaction);
                        break;
                    case 'satın-al':
                        await this.handlePremiumPurchase(interaction);
                        break;
                    case 'durum':
                        await this.handlePremiumStatus(interaction);
                        break;
                    case 'iptal':
                        await this.handlePremiumCancel(interaction);
                        break;
                }
                return;
            }

            if (subcommandGroup === 'yatırım') {
                switch (subcommand) {
                    case 'planlar':
                        await this.handleInvestmentPlans(interaction);
                        break;
                    case 'yap':
                        await this.handleInvestmentCreate(interaction);
                        break;
                    case 'durum':
                        await this.handleInvestmentStatus(interaction);
                        break;
                    case 'çek':
                        await this.handleInvestmentWithdraw(interaction);
                        break;
                }
                return;
            }

            if (subcommandGroup === 'market') {
                switch (subcommand) {
                    case 'liste':
                        await this.handleMarketList(interaction);
                        break;
                    case 'satın-al':
                        await this.handleMarketPurchase(interaction);
                        break;
                    case 'listem':
                        await this.handleMarketMyListings(interaction);
                        break;
                }
                return;
            }

            // Handle regular subcommands
            switch (subcommand) {
                case 'bakiye':
                    await this.handleBalance(interaction);
                    break;
                case 'günlük':
                    await this.handleDaily(interaction);
                    break;
                case 'çalış':
                    await this.handleWork(interaction);
                    break;
                case 'gönder':
                    await this.handleTransfer(interaction);
                    break;
                case 'yatır':
                    await this.handleDeposit(interaction);
                    break;
                case 'çek':
                    await this.handleWithdraw(interaction);
                    break;
                case 'sıralama':
                    await this.handleLeaderboard(interaction);
                    break;
                case 'profil':
                    await this.handleProfile(interaction);
                    break;
                case 'yardım':
                    await this.handleHelp(interaction);
                    break;
                case 'istatistik':
                    await this.handleStats(interaction);
                    break;
                case 'dönüştür':
                    await this.handleConvert(interaction);
                    break;
            }
        } catch (error) {
            logger.error('NRC komut hatası', error, { 
                subcommand, 
                user: interaction.user.id 
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Hata')
                .setDescription('İşlem sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Bakiye görüntüleme
    async handleBalance(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Bot kullanıcılarının NeuroCoin bakiyesi yoktur!',
                ephemeral: true
            });
        }

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(targetUser.id);

        // Zenginlik yüzdesi hesapla
        const allBalances = Array.from(db.data.neuroCoinBalances.values());
        const totalNRC = allBalances.reduce((sum, b) => sum + b.total, 0);
        const wealthPercentage = totalNRC > 0 ? ((balance.total / totalNRC) * 100).toFixed(2) : 0;

        const balanceEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`💰 ${targetUser.username} - NeuroCoin Bakiyesi`)
            .setDescription('**The Neural Currency of Discord**')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '💵 Cüzdan', value: `**${balance.wallet.toLocaleString()}** NRC`, inline: true },
                { name: '🏦 Banka', value: `**${balance.bank.toLocaleString()}** NRC`, inline: true },
                { name: '📊 Toplam', value: `**${balance.total.toLocaleString()}** NRC`, inline: true },
                { name: '📈 Zenginlik Oranı', value: `%${wealthPercentage}`, inline: true },
                { name: '💎 Sıralama', value: `#${this.getUserRank(db, targetUser.id)}`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true }
            )
            .setFooter({
                text: `NeuroCoin (NRC) • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        // Quick action buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('nrc_daily')
                    .setLabel('🎁 Günlük')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('nrc_work')
                    .setLabel('💼 Çalış')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('nrc_leaderboard')
                    .setLabel('🏆 Sıralama')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [balanceEmbed], components: [row] });
    },

    // Günlük ödül
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
                const hours = Math.floor(hoursLeft);
                const minutes = Math.floor((hoursLeft - hours) * 60);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('⏰ Çok Erken!')
                    .setDescription(`Günlük ödülünüzü zaten aldınız!\n\n⏱️ **Kalan Süre:** ${hours} saat ${minutes} dakika`)
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Streak hesapla
        const streakData = db.data.dailyStreaks.get(interaction.user.id) || { count: 0, lastClaim: null };
        let currentStreak = streakData.count;
        
        if (streakData.lastClaim) {
            const lastClaim = new Date(streakData.lastClaim);
            const daysSinceLastClaim = Math.floor((now - lastClaim) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastClaim === 1) {
                currentStreak++;
            } else if (daysSinceLastClaim > 1) {
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }

        // Ödül hesapla (streak bonus)
        const baseReward = Math.floor(Math.random() * 501) + 500; // 500-1000
        const streakBonus = Math.min(currentStreak * 50, 500); // Max 500 bonus
        const totalReward = baseReward + streakBonus;

        // Bakiye güncelle
        balance.wallet += totalReward;
        balance.total = balance.wallet + balance.bank;
        balance.lastDaily = now.toISOString();
        db.data.neuroCoinBalances.set(interaction.user.id, balance);
        
        // Streak kaydet
        db.data.dailyStreaks.set(interaction.user.id, {
            count: currentStreak,
            lastClaim: now.toISOString()
        });
        
        db.saveData();

        const dailyEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('🎁 Günlük Ödül Alındı!')
            .setDescription(`Günlük NeuroCoin ödülünüzü aldınız!`)
            .addFields(
                { name: '💰 Temel Ödül', value: `${baseReward.toLocaleString()} NRC`, inline: true },
                { name: '🔥 Streak Bonusu', value: `${streakBonus.toLocaleString()} NRC (${currentStreak} gün)`, inline: true },
                { name: '🎉 Toplam', value: `**${totalReward.toLocaleString()} NRC**`, inline: true },
                { name: '💵 Yeni Bakiye', value: `${balance.wallet.toLocaleString()} NRC`, inline: true }
            )
            .setFooter({ text: '24 saat sonra tekrar gelebilirsiniz!' })
            .setTimestamp();

        await interaction.reply({ embeds: [dailyEmbed] });
    },

    // Çalışma
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
                const hours = Math.floor(hoursLeft);
                const minutes = Math.floor((hoursLeft - hours) * 60);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('😓 Yorgunsunuz!')
                    .setDescription(`Biraz dinlenmeniz gerekiyor!\n\n⏱️ **Kalan Süre:** ${hours} saat ${minutes} dakika`)
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Rastgele iş ve ödül
        const jobs = [
            { name: 'Yazılım Geliştirme', emoji: '💻', min: 300, max: 500 },
            { name: 'Discord Moderasyonu', emoji: '🛡️', min: 250, max: 450 },
            { name: 'Grafik Tasarım', emoji: '🎨', min: 280, max: 480 },
            { name: 'İçerik Oluşturma', emoji: '📝', min: 270, max: 470 },
            { name: 'Müzik Prodüksiyonu', emoji: '🎵', min: 290, max: 490 },
            { name: 'Bot Geliştirme', emoji: '🤖', min: 310, max: 500 }
        ];

        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const reward = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        // Bakiye güncelle
        balance.wallet += reward;
        balance.total = balance.wallet + balance.bank;
        balance.lastWork = now.toISOString();
        db.data.neuroCoinBalances.set(interaction.user.id, balance);
        db.saveData();

        const workEmbed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle(`${job.emoji} Çalıştınız!`)
            .setDescription(`**${job.name}** yaptınız ve kazandınız!`)
            .addFields(
                { name: '💰 Kazanç', value: `**${reward.toLocaleString()} NRC**`, inline: true },
                { name: '💵 Yeni Bakiye', value: `${balance.wallet.toLocaleString()} NRC`, inline: true }
            )
            .setFooter({ text: '4 saat sonra tekrar çalışabilirsiniz!' })
            .setTimestamp();

        await interaction.reply({ embeds: [workEmbed] });
    },

    // Transfer
    async handleTransfer(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Bot kullanıcılarına NRC gönderemezsiniz!',
                ephemeral: true
            });
        }

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Kendinize NRC gönderemezsiniz!',
                ephemeral: true
            });
        }

        const db = getDatabase();
        const senderBalance = db.getNeuroCoinBalance(interaction.user.id);

        if (senderBalance.wallet < amount) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Yetersiz Bakiye')
                .setDescription(`Cüzdanınızda yeterli NRC yok!\n\n**Cüzdan:** ${senderBalance.wallet.toLocaleString()} NRC`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Transfer işlemi
        const receiverBalance = db.getNeuroCoinBalance(targetUser.id);
        
        senderBalance.wallet -= amount;
        senderBalance.total = senderBalance.wallet + senderBalance.bank;
        
        receiverBalance.wallet += amount;
        receiverBalance.total = receiverBalance.wallet + receiverBalance.bank;
        
        db.data.neuroCoinBalances.set(interaction.user.id, senderBalance);
        db.data.neuroCoinBalances.set(targetUser.id, receiverBalance);
        
        // Transaction kaydet
        db.recordTransaction(interaction.user.id, targetUser.id, amount, 'transfer', {
            guild: interaction.guild.id
        });
        
        db.saveData();

        const transferEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✅ Transfer Başarılı')
            .setDescription(`**${targetUser.username}** kullanıcısına NRC gönderildi!`)
            .addFields(
                { name: '💸 Gönderilen', value: `**${amount.toLocaleString()} NRC**`, inline: true },
                { name: '💵 Kalan Bakiye', value: `${senderBalance.wallet.toLocaleString()} NRC`, inline: true }
            )
            .setFooter({ text: 'NeuroCoin Transfer' })
            .setTimestamp();

        await interaction.reply({ embeds: [transferEmbed] });
    },

    // Yatırma
    async handleDeposit(interaction) {
        const amount = interaction.options.getInteger('miktar');
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.wallet < amount) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Yetersiz Bakiye')
                .setDescription(`Cüzdanınızda yeterli NRC yok!\n\n**Cüzdan:** ${balance.wallet.toLocaleString()} NRC`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        balance.wallet -= amount;
        balance.bank += amount;
        balance.total = balance.wallet + balance.bank;
        
        db.data.neuroCoinBalances.set(interaction.user.id, balance);
        db.saveData();

        const depositEmbed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('🏦 Bankaya Yatırıldı')
            .setDescription('NeuroCoin başarıyla bankaya yatırıldı!')
            .addFields(
                { name: '💰 Yatırılan', value: `${amount.toLocaleString()} NRC`, inline: true },
                { name: '🏦 Yeni Banka', value: `${balance.bank.toLocaleString()} NRC`, inline: true },
                { name: '💵 Yeni Cüzdan', value: `${balance.wallet.toLocaleString()} NRC`, inline: true }
            )
            .setFooter({ text: 'Banka paranız güvende!' })
            .setTimestamp();

        await interaction.reply({ embeds: [depositEmbed] });
    },

    // Çekme
    async handleWithdraw(interaction) {
        const amount = interaction.options.getInteger('miktar');
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        if (balance.bank < amount) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Yetersiz Bakiye')
                .setDescription(`Bankanızda yeterli NRC yok!\n\n**Banka:** ${balance.bank.toLocaleString()} NRC`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        balance.bank -= amount;
        balance.wallet += amount;
        balance.total = balance.wallet + balance.bank;
        
        db.data.neuroCoinBalances.set(interaction.user.id, balance);
        db.saveData();

        const withdrawEmbed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle('💰 Bankadan Çekildi')
            .setDescription('NeuroCoin başarıyla çekildi!')
            .addFields(
                { name: '💵 Çekilen', value: `${amount.toLocaleString()} NRC`, inline: true },
                { name: '🏦 Yeni Banka', value: `${balance.bank.toLocaleString()} NRC`, inline: true },
                { name: '💵 Yeni Cüzdan', value: `${balance.wallet.toLocaleString()} NRC`, inline: true }
            )
            .setFooter({ text: 'Paranız cüzdanınızda' })
            .setTimestamp();

        await interaction.reply({ embeds: [withdrawEmbed] });
    },

    // Sıralama
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
                .setTitle('📊 Sıralama Boş')
                .setDescription('Henüz hiç kimse NeuroCoin kazanmamış!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed] });
        }

        // Leaderboard text oluştur
        let leaderboardText = '';
        for (let i = 0; i < top10.length; i++) {
            const entry = top10[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            
            try {
                const user = await interaction.client.users.fetch(entry.userId);
                const amount = entry[type].toLocaleString();
                leaderboardText += `${medal} **${user.username}** - ${amount} NRC\n`;
            } catch (error) {
                leaderboardText += `${medal} Unknown User - ${entry[type].toLocaleString()} NRC\n`;
            }
        }

        // Kullanıcının sıralaması
        const userRank = balances.findIndex(b => b.userId === interaction.user.id) + 1;
        const userBalance = db.getNeuroCoinBalance(interaction.user.id);

        const typeNames = {
            total: '💰 Toplam Bakiye',
            wallet: '💵 Cüzdan',
            bank: '🏦 Banka'
        };

        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`🏆 NeuroCoin Sıralaması - ${typeNames[type]}`)
            .setDescription(leaderboardText)
            .addFields({
                name: '📍 Sizin Sıralamanız',
                value: userRank > 0 
                    ? `**#${userRank}** - ${userBalance[type].toLocaleString()} NRC`
                    : 'Henüz sıralamada değilsiniz',
                inline: false
            })
            .setFooter({ text: `${interaction.guild.name} • NeuroCoin Leaderboard` })
            .setTimestamp();

        await interaction.reply({ embeds: [leaderboardEmbed] });
    },

    // Profil
    async handleProfile(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Bot kullanıcılarının NRC profili yoktur!',
                ephemeral: true
            });
        }

        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(targetUser.id);
        const transactions = db.getUserTransactions(targetUser.id, 5);
        const streakData = db.data.dailyStreaks.get(targetUser.id) || { count: 0 };

        // İstatistikler
        let totalEarned = 0;
        let totalSpent = 0;
        let totalTransfers = 0;

        for (const tx of transactions) {
            if (tx.to === targetUser.id) {
                totalEarned += tx.amount;
            } else if (tx.from === targetUser.id) {
                if (tx.type === 'transfer') {
                    totalTransfers++;
                }
                totalSpent += tx.amount;
            }
        }

        // Son işlemler
        const recentTransactions = transactions.length > 0 
            ? transactions.slice(0, 5).map((tx, i) => {
                const icon = tx.to === targetUser.id ? '📥' : '📤';
                return `${icon} ${tx.amount.toLocaleString()} NRC - ${tx.type}`;
            }).join('\n')
            : 'İşlem bulunamadı';

        const rank = this.getUserRank(db, targetUser.id);

        const profileEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`👤 ${targetUser.username} - NRC Profil`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '💰 Toplam Bakiye', value: `**${balance.total.toLocaleString()}** NRC`, inline: true },
                { name: '💵 Cüzdan', value: `${balance.wallet.toLocaleString()} NRC`, inline: true },
                { name: '🏦 Banka', value: `${balance.bank.toLocaleString()} NRC`, inline: true },
                { name: '📈 Sıralama', value: `#${rank}`, inline: true },
                { name: '🔥 Daily Streak', value: `${streakData.count} gün`, inline: true },
                { name: '💸 Transfer Sayısı', value: `${totalTransfers}`, inline: true },
                { name: '📜 Son 5 İşlem', value: recentTransactions, inline: false }
            )
            .setFooter({ text: `NeuroCoin Profile • ${interaction.guild.name}` })
            .setTimestamp();

        await interaction.reply({ embeds: [profileEmbed] });
    },

    // Yardım
    async handleHelp(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('❓ NeuroCoin (NRC) Yardım')
            .setDescription('**The Neural Currency of Discord**\n\nNeuroCoin, Discord sunucunuzda kullanabileceğiniz dijital bir para birimidir.')
            .addFields(
                {
                    name: '💰 Temel Komutlar',
                    value: '`/nrc bakiye` - Bakiyenizi görüntüleyin\n`/nrc günlük` - Günlük ödül (24 saat)\n`/nrc çalış` - Çalışıp NRC kazanın (4 saat)\n`/nrc profil` - Profilinizi görüntüleyin',
                    inline: false
                },
                {
                    name: '💸 Transfer ve Banka',
                    value: '`/nrc gönder` - Başkasına NRC gönderin\n`/nrc yatır` - Bankaya güvenle saklayın\n`/nrc çek` - Bankadan çekin',
                    inline: false
                },
                {
                    name: '🏆 Sıralama ve İstatistikler',
                    value: '`/nrc sıralama` - Zenginlik sıralaması\n`/nrc profil` - Detaylı profil ve istatistikler',
                    inline: false
                },
                {
                    name: '💡 İpuçları',
                    value: '• Her gün giriş yaparak streak bonusu kazanın!\n• Paranızı bankaya yatırın, güvenli olsun\n• Çalışma ile düzenli gelir elde edin\n• Sunucu etkinliklerine katılarak NRC kazanın',
                    inline: false
                },
                {
                    name: '🔗 Web Dashboard',
                    value: '[neuroviabot.xyz/dashboard](https://neuroviabot.xyz/dashboard)\nDetaylı yönetim için web paneli kullanın!',
                    inline: false
                }
            )
            .setFooter({ text: 'NeuroCoin • The Neural Currency of Discord' })
            .setTimestamp();

        await interaction.reply({ embeds: [helpEmbed] });
    },

    // İstatistikler
    async handleStats(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Bot kullanıcılarının NRC verisi yoktur!',
                ephemeral: true
            });
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
            .setTitle(`📊 ${targetUser.username} - NRC İstatistikleri`)
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
                text: `NRC İstatistikleri • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [statsEmbed] });
    },

    // Coin dönüştürme (legacy migration)
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
                .setDescription('Eski coinlerinizi zaten NRC\'ye dönüştürdünüz!')
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
            .setDescription(`**Eski coinleriniz NRC'ye dönüştürüldü!**\n\nDönüştürme oranı: **1:${CONVERSION_RATE}**`)
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

    // Helper: Kullanıcının sırasını bul
    getUserRank(db, userId) {
        const balances = Array.from(db.data.neuroCoinBalances.entries())
            .map(([id, balance]) => ({ userId: id, total: balance.total }))
            .sort((a, b) => b.total - a.total);
        
        const rank = balances.findIndex(b => b.userId === userId) + 1;
        return rank > 0 ? rank : '-';
    },

    // ==========================================
    // NFT COLLECTION HANDLERS
    // ==========================================

    // List all collections
    async handleCollectionList(interaction) {
        const { getNFTHandler } = require('../handlers/nftHandler');
        const nftHandler = getNFTHandler();
        
        const collections = nftHandler.getAllCollections();

        if (collections.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Koleksiyon Bulunamadı')
                .setDescription('Henüz hiç NFT koleksiyonu yok!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        // Show each collection
        const embeds = collections.map(collection => nftHandler.createCollectionEmbed(collection));

        const mainEmbed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🎨 NFT Koleksiyonları')
            .setDescription(`Toplam **${collections.length}** koleksiyon mevcut!\n\n**Satın almak için:**\n\`/nrc koleksiyon satın-al\` komutunu kullanın.`)
            .setFooter({ text: `${interaction.guild.name} • NFT Marketplace` })
            .setTimestamp();

        await interaction.editReply({ embeds: [mainEmbed, ...embeds.slice(0, 9)] }); // Max 10 embeds
    },

    // Purchase NFT
    async handleCollectionPurchase(interaction) {
        const { getNFTHandler } = require('../handlers/nftHandler');
        const nftHandler = getNFTHandler();
        
        const collectionId = interaction.options.getString('koleksiyon');
        const itemId = interaction.options.getString('item');

        try {
            await interaction.deferReply();

            const result = await nftHandler.purchaseNFT(interaction.user.id, collectionId, itemId);

            if (!result.success) {
                throw new Error('Satın alma başarısız!');
            }

            const { item, newBalance } = result;

            const purchaseEmbed = new EmbedBuilder()
                .setColor(nftHandler.getRarityColor(item.rarity))
                .setTitle('✅ NFT Satın Alındı!')
                .setDescription(`**${item.emoji} ${item.name}** başarıyla satın alındı!`)
                .addFields(
                    { name: '🎨 Nadirlık', value: `${nftHandler.getRarityEmoji(item.rarity)} **${item.rarity.toUpperCase()}**`, inline: true },
                    { name: '💰 Fiyat', value: `**${item.price.toLocaleString()}** NRC`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '💵 Yeni Bakiye', value: `**${newBalance.wallet.toLocaleString()}** NRC`, inline: true },
                    { name: '🏦 Banka', value: `**${newBalance.bank.toLocaleString()}** NRC`, inline: true },
                    { name: '📊 Toplam', value: `**${newBalance.total.toLocaleString()}** NRC`, inline: true }
                )
                .setFooter({ text: 'NFT Koleksiyonunuza eklendi!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [purchaseEmbed] });

            // Broadcast to socket
            const socket = interaction.client.socket;
            if (socket) {
                socket.emit('nrc_nft_purchased', {
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    nftId: itemId,
                    nftName: item.name,
                    rarity: item.rarity,
                    price: item.price,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error('[NFT Purchase] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Satın Alma Hatası')
                .setDescription(error.message || 'NFT satın alınırken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Show user's inventory
    async handleCollectionInventory(interaction) {
        const { getNFTHandler } = require('../handlers/nftHandler');
        const nftHandler = getNFTHandler();
        
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Hata')
                .setDescription('Bot kullanıcılarının NFT koleksiyonu yoktur!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const inventoryEmbed = nftHandler.createInventoryEmbed(targetUser.id, targetUser.username);

        await interaction.reply({ embeds: [inventoryEmbed] });
    },

    // Sell NFT on marketplace
    async handleCollectionSell(interaction) {
        const { getNFTHandler } = require('../handlers/nftHandler');
        const nftHandler = getNFTHandler();
        
        const collectionId = interaction.options.getString('koleksiyon');
        const itemId = interaction.options.getString('item');
        const price = interaction.options.getInteger('fiyat');

        try {
            await interaction.deferReply();

            const result = await nftHandler.listNFTForSale(
                interaction.user.id,
                collectionId,
                itemId,
                price
            );

            if (!result.success) {
                throw new Error('Listeleme başarısız!');
            }

            const sellEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('✅ NFT Listelendi!')
                .setDescription(`NFT\'niz marketplace\'e başarıyla listelendi!`)
                .addFields(
                    { name: '🆔 Listing ID', value: `\`${result.listingId}\``, inline: false },
                    { name: '💰 Satış Fiyatı', value: `**${price.toLocaleString()}** NRC`, inline: true },
                    { name: '💸 Platform Komisyonu', value: `**${Math.floor(price * 0.05).toLocaleString()}** NRC (5%)`, inline: true },
                    { name: '💵 Net Kazanç', value: `**${Math.floor(price * 0.95).toLocaleString()}** NRC`, inline: true }
                )
                .setFooter({ text: 'NFT satıldığında bildirim alacaksınız!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [sellEmbed] });

            // Broadcast to socket
            const socket = interaction.client.socket;
            if (socket) {
                socket.emit('marketplace_listing_added', {
                    listingId: result.listingId,
                    sellerId: interaction.user.id,
                    sellerName: interaction.user.username,
                    price,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error('[NFT Sell] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Listeleme Hatası')
                .setDescription(error.message || 'NFT listelenirken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // ==========================================
    // PREMIUM HANDLERS
    // ==========================================

    // Show premium plans
    async handlePremiumPlans(interaction) {
        const { getPremiumHandler } = require('../handlers/premiumHandler');
        const premiumHandler = getPremiumHandler();
        
        const plansEmbed = premiumHandler.createPlansEmbed();

        // Add user's current balance
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        plansEmbed.addFields({
            name: '💰 Mevcut Bakiyeniz',
            value: `**${balance.wallet.toLocaleString()}** NRC (Cüzdan)`,
            inline: false
        });

        await interaction.reply({ embeds: [plansEmbed] });
    },

    // Purchase premium
    async handlePremiumPurchase(interaction) {
        const { getPremiumHandler } = require('../handlers/premiumHandler');
        const premiumHandler = getPremiumHandler();
        
        const planId = interaction.options.getString('plan');

        try {
            await interaction.deferReply();

            const result = await premiumHandler.purchasePremium(interaction.user.id, planId);

            if (!result.success) {
                throw new Error('Premium satın alma başarısız!');
            }

            const { plan, expiresAt, newBalance } = result;

            const purchaseEmbed = new EmbedBuilder()
                .setColor(plan.color)
                .setTitle('✅ Premium Aktif!')
                .setDescription(`${plan.emoji} **${plan.name}** başarıyla aktif edildi!`)
                .addFields(
                    { name: '⏳ Süre', value: `**${plan.duration}** gün`, inline: true },
                    { name: '⏰ Bitiş Tarihi', value: `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:F>`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '💰 Ödenen', value: `**${plan.price.toLocaleString()}** NRC`, inline: true },
                    { name: '💵 Yeni Bakiye', value: `**${newBalance.wallet.toLocaleString()}** NRC`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }
                )
                .setFooter({ text: 'Premium aboneliğiniz için teşekkürler!' })
                .setTimestamp();

            // Add features
            const featuresText = plan.features.map(f => `✓ ${f}`).join('\n');
            purchaseEmbed.addFields({
                name: '✨ Aktif Özellikler',
                value: featuresText,
                inline: false
            });

            await interaction.editReply({ embeds: [purchaseEmbed] });

            // Broadcast to socket
            const socket = interaction.client.socket;
            if (socket) {
                socket.emit('premium_activated', {
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    tier: planId,
                    expiresAt,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error('[Premium Purchase] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Satın Alma Hatası')
                .setDescription(error.message || 'Premium satın alınırken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Check premium status
    async handlePremiumStatus(interaction) {
        const { getPremiumHandler } = require('../handlers/premiumHandler');
        const premiumHandler = getPremiumHandler();
        
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Hata')
                .setDescription('Bot kullanıcılarının premium durumu yoktur!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const statusEmbed = premiumHandler.createStatusEmbed(targetUser.id, targetUser.username);

        await interaction.reply({ embeds: [statusEmbed] });
    },

    // Cancel premium auto-renewal
    async handlePremiumCancel(interaction) {
        const { getPremiumHandler } = require('../handlers/premiumHandler');
        const premiumHandler = getPremiumHandler();

        try {
            const result = await premiumHandler.cancelPremium(interaction.user.id);

            if (!result.success) {
                throw new Error('İptal başarısız!');
            }

            const cancelEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('✅ Otomatik Yenileme İptal Edildi')
                .setDescription('Premium otomatik yenileme başarıyla iptal edildi.')
                .addFields({
                    name: '⏳ Premium Süresi',
                    value: `Mevcut premium aboneliğiniz <t:${Math.floor(new Date(result.expiresAt).getTime() / 1000)}:R> sona erecek.\n\nDaha sonra tekrar premium satın alabilirsiniz.`,
                    inline: false
                })
                .setFooter({ text: 'Otomatik yenilemeyi tekrar aktif etmek için premium satın alın' })
                .setTimestamp();

            await interaction.reply({ embeds: [cancelEmbed] });

        } catch (error) {
            logger.error('[Premium Cancel] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ İptal Hatası')
                .setDescription(error.message || 'Otomatik yenileme iptal edilirken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    // ==========================================
    // INVESTMENT HANDLERS
    // ==========================================

    // Show investment plans
    async handleInvestmentPlans(interaction) {
        const { getInvestmentHandler } = require('../handlers/investmentHandler');
        const investmentHandler = getInvestmentHandler();
        
        const plansEmbed = investmentHandler.createPlansEmbed();

        // Add user's current balance
        const db = getDatabase();
        const balance = db.getNeuroCoinBalance(interaction.user.id);

        plansEmbed.addFields({
            name: '💰 Mevcut Bakiyeniz',
            value: `**${balance.wallet.toLocaleString()}** NRC (Cüzdan)`,
            inline: false
        });

        await interaction.reply({ embeds: [plansEmbed] });
    },

    // Create new investment
    async handleInvestmentCreate(interaction) {
        const { getInvestmentHandler } = require('../handlers/investmentHandler');
        const investmentHandler = getInvestmentHandler();
        
        const planId = interaction.options.getString('plan');
        const amount = interaction.options.getInteger('miktar');

        try {
            await interaction.deferReply();

            const result = await investmentHandler.createInvestment(interaction.user.id, planId, amount);

            if (!result.success) {
                throw new Error('Yatırım oluşturulamadı!');
            }

            const { investment, plan, newBalance } = result;
            const expectedInterest = investmentHandler.calculateInterest(amount, plan.apy, plan.duration);
            const expectedTotal = amount + expectedInterest;

            const createEmbed = new EmbedBuilder()
                .setColor(plan.color)
                .setTitle('✅ Yatırım Başarılı!')
                .setDescription(`${plan.emoji} **${plan.name}** yatırımınız oluşturuldu!`)
                .addFields(
                    { name: '💰 Yatırılan', value: `**${amount.toLocaleString()}** NRC`, inline: true },
                    { name: '⏳ Süre', value: `**${plan.duration}** gün`, inline: true },
                    { name: '📈 APY', value: `**${(plan.apy * 100).toFixed(0)}%**`, inline: true },
                    { name: '💵 Beklenen Faiz', value: `+**${expectedInterest.toLocaleString()}** NRC`, inline: true },
                    { name: '🎯 Toplam Getiri', value: `**${expectedTotal.toLocaleString()}** NRC`, inline: true },
                    { name: '⏰ Vade Tarihi', value: `<t:${Math.floor(new Date(investment.endDate).getTime() / 1000)}:F>`, inline: true }
                )
                .addFields({
                    name: '📋 Yatırım ID',
                    value: `\`${investment.investmentId}\`\n\nYatırımınızı çekmek için bu ID\'yi kullanın.`,
                    inline: false
                })
                .addFields({
                    name: '💵 Yeni Bakiye',
                    value: `**${newBalance.wallet.toLocaleString()}** NRC`,
                    inline: true
                })
                .setFooter({ text: 'Vade dolduğunda otomatik olarak faiziniz hesaplanır' })
                .setTimestamp();

            await interaction.editReply({ embeds: [createEmbed] });

        } catch (error) {
            logger.error('[Investment Create] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Yatırım Hatası')
                .setDescription(error.message || 'Yatırım oluşturulurken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Show investment status
    async handleInvestmentStatus(interaction) {
        const { getInvestmentHandler } = require('../handlers/investmentHandler');
        const investmentHandler = getInvestmentHandler();
        
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Hata')
                .setDescription('Bot kullanıcılarının yatırımları yoktur!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const statusEmbed = investmentHandler.createStatusEmbed(targetUser.id, targetUser.username);

        await interaction.reply({ embeds: [statusEmbed] });
    },

    // Withdraw investment
    async handleInvestmentWithdraw(interaction) {
        const { getInvestmentHandler } = require('../handlers/investmentHandler');
        const investmentHandler = getInvestmentHandler();
        
        const investmentId = interaction.options.getString('yatırım-id');
        const early = interaction.options.getBoolean('erken') || false;

        try {
            await interaction.deferReply();

            const result = await investmentHandler.withdrawInvestment(
                interaction.user.id,
                investmentId,
                early
            );

            if (!result.success) {
                throw new Error('Çekim başarısız!');
            }

            const { investment, totalReturn, earnedInterest, penaltyAmount, isEarlyWithdrawal, newBalance } = result;

            const withdrawEmbed = new EmbedBuilder()
                .setColor(isEarlyWithdrawal ? '#E74C3C' : '#2ECC71')
                .setTitle(isEarlyWithdrawal ? '⚠️ Erken Çekim Yapıldı' : '✅ Yatırım Çekildi!')
                .setDescription(isEarlyWithdrawal 
                    ? `Yatırımınız vade dolmadan çekildi. **%25 ceza** uygulandı.`
                    : `Yatırımınız başarıyla çekildi!`)
                .addFields(
                    { name: '💰 Ana Para', value: `**${investment.amount.toLocaleString()}** NRC`, inline: true },
                    { name: '📈 Kazanılan Faiz', value: `+**${earnedInterest.toLocaleString()}** NRC`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }
                );

            if (isEarlyWithdrawal && penaltyAmount > 0) {
                withdrawEmbed.addFields(
                    { name: '⚠️ Ceza', value: `-**${penaltyAmount.toLocaleString()}** NRC`, inline: true }
                );
            }

            withdrawEmbed.addFields(
                { name: '💵 Cüzdana Eklenen', value: `**${totalReturn.toLocaleString()}** NRC`, inline: true },
                { name: '📊 Yeni Bakiye', value: `**${newBalance.wallet.toLocaleString()}** NRC`, inline: true }
            );

            withdrawEmbed.setFooter({ 
                text: isEarlyWithdrawal 
                    ? 'Erken çekim nedeniyle faiz kazancınız kaybedildi' 
                    : 'Yatırımınız için teşekkürler!'
            }).setTimestamp();

            await interaction.editReply({ embeds: [withdrawEmbed] });

            // Broadcast to socket
            const socket = interaction.client.socket;
            if (socket) {
                socket.emit('investment_withdrawn', {
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    investmentId,
                    amount: totalReturn,
                    isEarly: isEarlyWithdrawal,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error('[Investment Withdraw] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Çekim Hatası')
                .setDescription(error.message || 'Yatırım çekilirken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // ==========================================
    // MARKETPLACE HANDLERS
    // ==========================================

    // Browse marketplace listings
    async handleMarketList(interaction) {
        const { getMarketHandler } = require('../handlers/marketHandler');
        const marketHandler = getMarketHandler();
        
        const rarityFilter = interaction.options.getString('nadirlık');

        const filters = {};
        if (rarityFilter) {
            filters.rarity = rarityFilter;
        }

        const listings = marketHandler.getListings(filters);

        const browseEmbed = marketHandler.createBrowseEmbed(listings);

        await interaction.reply({ embeds: [browseEmbed] });
    },

    // Purchase from marketplace
    async handleMarketPurchase(interaction) {
        const { getMarketHandler } = require('../handlers/marketHandler');
        const marketHandler = getMarketHandler();
        
        const listingId = interaction.options.getString('listing-id');

        try {
            await interaction.deferReply();

            const result = await marketHandler.purchaseListing(interaction.user.id, listingId);

            if (!result.success) {
                throw new Error('Satın alma başarısız!');
            }

            const { listing, tradeId, fee, discount } = result;

            const purchaseEmbed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Marketplace Satın Alma Başarılı!')
                .setDescription(`**${listing.itemName}** başarıyla satın alındı! (Escrow korumalı)`)
                .addFields(
                    { name: '💰 Ödenen', value: `**${listing.price.toLocaleString()}** NRC`, inline: true },
                    { name: '🎨 Nadirlık', value: marketHandler.nftHandler.getRarityEmoji(listing.rarity) + ` ${listing.rarity.toUpperCase()}`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '👤 Satıcı', value: `<@${listing.sellerId}>`, inline: true },
                    { name: '📋 İşlem ID', value: `\`${tradeId}\``, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }
                )
                .setFooter({ text: 'NFT koleksiyonunuza eklendi!' })
                .setTimestamp();

            // Show fee info if applicable
            if (fee > 0 || discount > 0) {
                let feeText = `Platform Ücreti: **${fee.toLocaleString()}** NRC`;
                if (discount > 0) {
                    feeText += `\n✨ Premium İndirim: -**${discount.toLocaleString()}** NRC`;
                }
                purchaseEmbed.addFields({
                    name: '💸 Ücretler',
                    value: feeText,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [purchaseEmbed] });

            // Broadcast to socket
            const socket = interaction.client.socket;
            if (socket) {
                socket.emit('marketplace_purchase', {
                    buyerId: interaction.user.id,
                    buyerName: interaction.user.username,
                    sellerId: listing.sellerId,
                    listingId,
                    itemName: listing.itemName,
                    price: listing.price,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error('[Market Purchase] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Satın Alma Hatası')
                .setDescription(error.message || 'Marketplace satın alma sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Show user's marketplace listings
    async handleMarketMyListings(interaction) {
        const { getMarketHandler } = require('../handlers/marketHandler');
        const marketHandler = getMarketHandler();
        
        const activeListings = marketHandler.getUserListings(interaction.user.id, 'active');

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('📋 Listingleriniz')
            .setTimestamp();

        if (activeListings.length === 0) {
            embed.setDescription('❌ Aktif listinginiz yok!\n\n`/nrc koleksiyon sat` komutu ile NFT\'nizi listeleyebilirsiniz.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        embed.setDescription(`Toplam **${activeListings.length}** aktif listing`);

        for (const listing of activeListings.slice(0, 10)) {
            const pendingOffers = listing.offers?.filter(o => o.status === 'pending').length || 0;
            
            embed.addFields({
                name: `${marketHandler.nftHandler.getRarityEmoji(listing.rarity)} ${listing.itemName}`,
                value: [
                    `💰 **${listing.price.toLocaleString()} NRC**`,
                    `📅 ${new Date(listing.listedAt).toLocaleDateString('tr-TR')}`,
                    pendingOffers > 0 ? `📬 ${pendingOffers} teklif` : '',
                    `🆔 \`${listing.listingId}\``
                ].filter(Boolean).join('\n'),
                inline: true
            });
        }

        embed.addFields({
            name: '💡 İptal Etme',
            value: 'Web dashboard\'dan iptal edebilirsiniz veya `/nrc koleksiyon envanter` ile envanter değişikliklerini görebilirsiniz.',
            inline: false
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

