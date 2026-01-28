// ==========================================
// 🎮 Games Command
// ==========================================
// Minigames hub command

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { getCrashGame } = require('../games/crash');
const { getDuelGame } = require('../games/duel');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('games')
        .setDescription('🎮 Oyun sistemi - NRC ile oyunlar oyna')
        .addSubcommand(subcommand =>
            subcommand
                .setName('crash')
                .setDescription('💥 Crash oyunu - Çarpan artar, zamanında çık!')
                .addIntegerOption(option =>
                    option.setName('bahis')
                        .setDescription('Bahis miktarı (NRC)')
                        .setMinValue(10)
                        .setMaxValue(10000)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('crash-çıkış')
                .setDescription('💸 Aktif Crash oyunundan çıkış yap')
                .addNumberOption(option =>
                    option.setName('çarpan')
                        .setDescription('Çıkış yapmak istediğiniz çarpan (örn: 2.5)')
                        .setMinValue(1.01)
                        .setMaxValue(10.0)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('düello')
                .setDescription('⚔️ Başka bir kullanıcıya düello meydan okuması')
                .addUserOption(option =>
                    option.setName('rakip')
                        .setDescription('Meydan okuyacağınız kullanıcı')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('bahis')
                        .setDescription('Bahis miktarı (NRC)')
                        .setMinValue(50)
                        .setMaxValue(5000)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('oyun')
                        .setDescription('Oyun türü')
                        .setRequired(false)
                        .addChoices(
                            { name: '✊ Taş-Kağıt-Makas', value: 'rps' },
                            { name: '🪙 Yazı-Tura', value: 'coinflip' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('düello-kabul')
                .setDescription('✅ Düello davetini kabul et')
                .addStringOption(option =>
                    option.setName('düello-id')
                        .setDescription('Düello ID\'si')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('düello-hamle')
                .setDescription('🎯 Düelloda hamle yap')
                .addStringOption(option =>
                    option.setName('düello-id')
                        .setDescription('Düello ID\'si')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('hamle')
                        .setDescription('Hamleniz')
                        .setRequired(true)
                        .addChoices(
                            { name: '🪨 Taş', value: 'rock' },
                            { name: '📄 Kağıt', value: 'paper' },
                            { name: '✂️ Makas', value: 'scissors' },
                            { name: '👤 Yazı', value: 'heads' },
                            { name: '🦅 Tura', value: 'tails' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('istatistik')
                .setDescription('📊 Oyun istatistiklerinizi görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('İstatistikleri görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        ),

    category: 'games',

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if economy is enabled
        const db = getDatabase();
        const settings = db.getGuildSettings(interaction.guild.id);
        const economyEnabled = settings.features?.economy || settings.economy?.enabled;
        
        if (!economyEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ Oyun Sistemi Kapalı')
                .setDescription('Bu sunucuda ekonomi sistemi etkin değil!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'crash':
                    await this.handleCrashStart(interaction);
                    break;
                case 'crash-çıkış':
                    await this.handleCrashCashOut(interaction);
                    break;
                case 'düello':
                    await this.handleDuelChallenge(interaction);
                    break;
                case 'düello-kabul':
                    await this.handleDuelAccept(interaction);
                    break;
                case 'düello-hamle':
                    await this.handleDuelMove(interaction);
                    break;
                case 'istatistik':
                    await this.handleStats(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Games komut hatası', error, { 
                subcommand, 
                user: interaction.user.id 
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
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

    // Crash game start
    async handleCrashStart(interaction) {
        const crashGame = getCrashGame();
        const betAmount = interaction.options.getInteger('bahis');

        try {
            const result = await crashGame.startGame(interaction.user.id, betAmount);

            const embed = crashGame.createGameEmbed(result);

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ Oyun Başlatma Hatası')
                .setDescription(error.message)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    // Crash cash out
    async handleCrashCashOut(interaction) {
        const crashGame = getCrashGame();
        const multiplier = interaction.options.getNumber('çarpan');

        try {
            await interaction.deferReply();

            const result = await crashGame.cashOut(interaction.user.id, multiplier);

            const embed = crashGame.createCashOutEmbed(result);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ Çıkış Hatası')
                .setDescription(error.message)
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Duel challenge
    async handleDuelChallenge(interaction) {
        const duelGame = getDuelGame();
        const opponent = interaction.options.getUser('rakip');
        const stake = interaction.options.getInteger('bahis');
        const gameType = interaction.options.getString('oyun') || 'rps';

        if (opponent.bot) {
            return interaction.reply({ 
                content: '❌ Bot kullanıcılarına meydan okuyamazsınız!', 
                ephemeral: true 
            });
        }

        try {
            const result = await duelGame.createChallenge(
                interaction.user.id,
                opponent.id,
                stake,
                gameType
            );

            const embed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle('⚔️ Düello Meydan Okuması!')
                .setDescription(`<@${interaction.user.id}> → <@${opponent.id}> düelloya meydan okuyor!`)
                .addFields(
                    { name: '💰 Bahis', value: `**${stake.toLocaleString()}** NRC`, inline: true },
                    { name: '🎮 Oyun', value: gameType === 'rps' ? '✊ Taş-Kağıt-Makas' : '🪙 Yazı-Tura', inline: true },
                    { name: '🏆 Kazanan Alır', value: `**${(stake * 2 * 0.95).toLocaleString()}** NRC (-%5 fee)`, inline: true }
                )
                .addFields({
                    name: '📋 Düello ID',
                    value: `\`${result.challengeId}\`\n\n<@${opponent.id}> kabul etmek için: \`/games düello-kabul\``,
                    inline: false
                })
                .setFooter({ text: '5 dakika içinde kabul edilmezse otomatik iptal olur' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ Meydan Okuma Hatası')
                .setDescription(error.message)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    // Duel accept
    async handleDuelAccept(interaction) {
        const duelGame = getDuelGame();
        const duelId = interaction.options.getString('düello-id');

        try {
            await interaction.deferReply();

            const result = await duelGame.acceptChallenge(interaction.user.id, duelId);

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Düello Kabul Edildi!')
                .setDescription('Düello başladı! Her iki oyuncu da hamlesini yapmalı.')
                .addFields(
                    { name: '📋 Düello ID', value: `\`${result.duelId}\``, inline: false },
                    { name: '💡 Hamle Yapma', value: '`/games düello-hamle` komutu ile hamlenizi yapın!', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ Kabul Hatası')
                .setDescription(error.message)
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Duel move
    async handleDuelMove(interaction) {
        const duelGame = getDuelGame();
        const duelId = interaction.options.getString('düello-id');
        const move = interaction.options.getString('hamle');

        try {
            await interaction.deferReply({ ephemeral: true });

            const result = await duelGame.makeMove(interaction.user.id, duelId, move);

            if (result.waitingForOpponent) {
                const embed = new EmbedBuilder()
                    .setColor('#F39C12')
                    .setTitle('⏳ Hamle Kaydedildi')
                    .setDescription('Rakibinizin hamlesini bekliyorsunuz...')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                // Duel resolved
                const embed = new EmbedBuilder()
                    .setTitle(result.result === 'draw' ? '🤝 Beraberlik!' : '🏆 Düello Tamamlandı!')
                    .setTimestamp();

                if (result.result === 'draw') {
                    embed.setColor('#95A5A6')
                        .setDescription('Düello berabere bitti! Bahisler iade edildi.')
                        .addFields(
                            { name: '↩️ İade', value: `**${result.winnings.toLocaleString()}** NRC`, inline: true }
                        );
                } else {
                    const isWinner = result.winnerId === interaction.user.id;
                    embed.setColor(isWinner ? '#2ECC71' : '#E74C3C')
                        .setDescription(isWinner 
                            ? `🎉 Tebrikler! Düelloyu kazandınız!`
                            : `😔 Düelloyu kaybettiniz.`)
                        .addFields(
                            { name: '🏆 Kazanan', value: `<@${result.winnerId}>`, inline: true },
                            { name: '💰 Kazanç', value: `**${result.winnings.toLocaleString()}** NRC`, inline: true }
                        );

                    if (result.coinFlipResult) {
                        embed.addFields({
                            name: '🪙 Sonuç',
                            value: result.coinFlipResult === 'heads' ? '👤 Yazı' : '🦅 Tura',
                            inline: true
                        });
                    }
                }

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ Hamle Hatası')
                .setDescription(error.message)
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Game statistics
    async handleStats(interaction) {
        const db = getDatabase();
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({ 
                content: '❌ Bot kullanıcılarının oyun istatistikleri yoktur!', 
                ephemeral: true 
            });
        }

        const stats = db.data.gameStats.get(targetUser.id);

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle(`🎮 ${targetUser.username} - Oyun İstatistikleri`)
            .setTimestamp();

        if (!stats || stats.totalGamesPlayed === 0) {
            embed.setDescription('❌ Henüz hiç oyun oynanmamış!');
            return interaction.reply({ embeds: [embed] });
        }

        const winRate = ((stats.totalWins / stats.totalGamesPlayed) * 100).toFixed(1);
        const netProfit = stats.lifetimeWinnings - stats.lifetimeLosses;

        embed.addFields(
            { name: '🎲 Toplam Oyun', value: `**${stats.totalGamesPlayed}**`, inline: true },
            { name: '✅ Kazanma', value: `**${stats.totalWins}**`, inline: true },
            { name: '❌ Kaybetme', value: `**${stats.totalLosses}**`, inline: true },
            { name: '📊 Kazanma Oranı', value: `**${winRate}%**`, inline: true },
            { name: '🔥 Streak', value: `**${stats.currentStreak}**`, inline: true },
            { name: '💎 En Büyük Kazanç', value: `**${stats.biggestWin.toLocaleString()}** NRC`, inline: true },
            { name: '💰 Toplam Kazanç', value: `**${stats.lifetimeWinnings.toLocaleString()}** NRC`, inline: true },
            { name: '💸 Toplam Kayıp', value: `**${stats.lifetimeLosses.toLocaleString()}** NRC`, inline: true },
            { name: '📈 Net Kar/Zarar', value: `**${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}** NRC`, inline: true }
        );

        if (stats.favoriteGame) {
            embed.setFooter({ text: `Favori Oyun: ${stats.favoriteGame}` });
        }

        await interaction.reply({ embeds: [embed] });
    }
};

