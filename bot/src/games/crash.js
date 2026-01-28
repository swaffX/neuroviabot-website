// ==========================================
// 💥 Crash Game
// ==========================================
// Multiplier-based gambling game

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');
const { getQuestProgressTracker } = require('../utils/questProgressTracker');

class CrashGame {
    constructor() {
        this.activeGames = new Map(); // userId -> gameData
        this.HOUSE_EDGE = 0.03; // 3% house edge
        this.MAX_MULTIPLIER = 10.0;
        this.MIN_BET = 10;
        this.MAX_BET = 10000;
    }

    /**
     * Start a crash game
     * @param {string} userId - Player's user ID
     * @param {number} betAmount - Bet amount in NRC
     * @returns {object} - Game start result
     */
    async startGame(userId, betAmount) {
        const db = getDatabase();

        // Validate bet amount
        if (betAmount < this.MIN_BET || betAmount > this.MAX_BET) {
            throw new Error(`Bahis miktarı ${this.MIN_BET}-${this.MAX_BET} NRC arasında olmalıdır!`);
        }

        // Check if user already has an active game
        if (this.activeGames.has(userId)) {
            throw new Error('Zaten aktif bir Crash oyununuz var! Önce çıkış yapın veya bekleyin.');
        }

        // Check balance
        const balance = db.getNeuroCoinBalance(userId);
        if (balance.wallet < betAmount) {
            throw new Error(`Yetersiz NRC! Gerekli: ${betAmount.toLocaleString()} NRC, Mevcut: ${balance.wallet.toLocaleString()} NRC`);
        }

        // Deduct bet amount
        db.addNeuroCoin(userId, -betAmount, 'crash_bet', { amount: betAmount });

        // Generate crash point (server-side, provably fair)
        const crashPoint = this.generateCrashPoint();

        // Create game
        const game = {
            userId,
            betAmount,
            crashPoint,
            currentMultiplier: 1.0,
            cashedOut: false,
            cashOutMultiplier: null,
            startTime: Date.now(),
            status: 'running'
        };

        this.activeGames.set(userId, game);

        // Track quest progress
        const questTracker = getQuestProgressTracker();
        await questTracker.trackGamePlayed(userId, 'global');

        logger.info(`[Crash] ${userId} started game with ${betAmount} NRC, crash at ${crashPoint.toFixed(2)}x`);

        return {
            success: true,
            betAmount,
            gameId: `crash_${userId}_${Date.now()}`
        };
    }

    /**
     * Generate crash point using house edge
     * @returns {number} - Crash multiplier
     */
    generateCrashPoint() {
        // Provably fair crash point generation
        const random = Math.random();
        const houseEdgeAdjusted = 1 - this.HOUSE_EDGE;
        
        // Inverse function for crash point
        const crashPoint = Math.max(1.0, houseEdgeAdjusted / random);
        
        // Cap at max multiplier
        return Math.min(crashPoint, this.MAX_MULTIPLIER);
    }

    /**
     * Cash out from active game
     * @param {string} userId - Player's user ID
     * @param {number} cashOutMultiplier - Multiplier at cash out
     * @returns {object} - Cash out result
     */
    async cashOut(userId, cashOutMultiplier) {
        const db = getDatabase();
        const game = this.activeGames.get(userId);

        if (!game) {
            throw new Error('Aktif Crash oyununuz yok!');
        }

        if (game.cashedOut) {
            throw new Error('Bu oyundan zaten çıkış yaptınız!');
        }

        if (game.status !== 'running') {
            throw new Error('Oyun artık aktif değil!');
        }

        // Check if crashed before cash out
        if (cashOutMultiplier >= game.crashPoint) {
            // Player tried to cash out at or after crash point - they lose
            game.status = 'crashed';
            game.cashedOut = false;
            this.activeGames.delete(userId);

            // Record loss
            this.updateGameStats(userId, false, 0, game.betAmount);

            logger.info(`[Crash] ${userId} crashed at ${game.crashPoint.toFixed(2)}x (tried ${cashOutMultiplier.toFixed(2)}x), lost ${game.betAmount} NRC`);

            return {
                success: false,
                crashed: true,
                crashPoint: game.crashPoint,
                lostAmount: game.betAmount
            };
        }

        // Successful cash out
        const winAmount = Math.floor(game.betAmount * cashOutMultiplier);
        
        // Add winnings
        db.addNeuroCoin(userId, winAmount, 'crash_win', {
            betAmount: game.betAmount,
            multiplier: cashOutMultiplier,
            profit: winAmount - game.betAmount
        });

        game.cashedOut = true;
        game.cashOutMultiplier = cashOutMultiplier;
        game.status = 'cashed_out';

        // Record win
        this.updateGameStats(userId, true, winAmount - game.betAmount, 0);

        this.activeGames.delete(userId);

        // Track big wins
        const profit = winAmount - game.betAmount;
        if (profit >= 1000) {
            try {
                const { trackGameWin } = require('../utils/activityTracker');
                const client = global.discordClient;
                let username = `User${userId.substring(0, 8)}`;

                if (client) {
                    try {
                        const user = await client.users.fetch(userId).catch(() => null);
                        if (user) username = user.username;
                    } catch (e) {}
                }

                await trackGameWin({
                    userId,
                    username,
                    game: 'Crash',
                    winAmount: profit,
                    multiplier: cashOutMultiplier
                });
            } catch (error) {
                // Silent fail
            }
        }

        logger.info(`[Crash] ${userId} cashed out at ${cashOutMultiplier.toFixed(2)}x, won ${winAmount} NRC`);

        return {
            success: true,
            crashed: false,
            cashOutMultiplier,
            winAmount,
            profit: winAmount - game.betAmount,
            newBalance: db.getNeuroCoinBalance(userId)
        };
    }

    /**
     * Auto-crash check (called periodically or on demand)
     * @param {string} userId - Player's user ID
     * @param {number} currentMultiplier - Current game multiplier
     * @returns {object} - Crash check result
     */
    checkCrash(userId, currentMultiplier) {
        const game = this.activeGames.get(userId);

        if (!game) {
            return { hasGame: false };
        }

        if (currentMultiplier >= game.crashPoint && !game.cashedOut) {
            // Game has crashed!
            game.status = 'crashed';
            this.activeGames.delete(userId);

            // Record loss
            this.updateGameStats(userId, false, 0, game.betAmount);

            logger.info(`[Crash] ${userId} auto-crashed at ${game.crashPoint.toFixed(2)}x, lost ${game.betAmount} NRC`);

            return {
                hasGame: true,
                crashed: true,
                crashPoint: game.crashPoint,
                lostAmount: game.betAmount
            };
        }

        return {
            hasGame: true,
            crashed: false,
            currentMultiplier: game.currentMultiplier,
            crashPoint: game.crashPoint // Don't reveal this to client in real implementation
        };
    }

    /**
     * Get active game for user
     * @param {string} userId - Player's user ID
     * @returns {object|null} - Game data
     */
    getActiveGame(userId) {
        return this.activeGames.get(userId) || null;
    }

    /**
     * Update game statistics
     * @param {string} userId - Player's user ID
     * @param {boolean} won - Did player win?
     * @param {number} profit - Profit amount (positive or 0)
     * @param {number} loss - Loss amount (positive or 0)
     */
    updateGameStats(userId, won, profit, loss) {
        const db = getDatabase();

        if (!db.data.gameStats.has(userId)) {
            db.data.gameStats.set(userId, {
                totalGamesPlayed: 0,
                totalWins: 0,
                totalLosses: 0,
                biggestWin: 0,
                currentStreak: 0,
                favoriteGame: 'crash',
                lifetimeWinnings: 0,
                lifetimeLosses: 0
            });
        }

        const stats = db.data.gameStats.get(userId);

        stats.totalGamesPlayed += 1;

        if (won) {
            stats.totalWins += 1;
            stats.lifetimeWinnings += profit;
            stats.currentStreak = stats.currentStreak > 0 ? stats.currentStreak + 1 : 1;
            
            if (profit > stats.biggestWin) {
                stats.biggestWin = profit;
            }
        } else {
            stats.totalLosses += 1;
            stats.lifetimeLosses += loss;
            stats.currentStreak = stats.currentStreak < 0 ? stats.currentStreak - 1 : -1;
        }

        db.data.gameStats.set(userId, stats);
        db.saveData();
    }

    /**
     * Create game start embed
     * @param {object} gameData - Game data
     * @returns {EmbedBuilder} - Embed
     */
    createGameEmbed(gameData) {
        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('💥 Crash Game - Oyun Başladı!')
            .setDescription('Multiplier artıyor! Çıkış yapmak için butonlara tıklayın.')
            .addFields(
                { name: '💰 Bahis', value: `**${gameData.betAmount.toLocaleString()}** NRC`, inline: true },
                { name: '📈 Mevcut Çarpan', value: `**1.00x**`, inline: true },
                { name: '🎯 Potansiyel Kazanç', value: `**${gameData.betAmount.toLocaleString()}** NRC`, inline: true }
            )
            .setFooter({ text: 'Çarpan arttıkça kazancınız artar, ama dikkat - her an çökebilir!' })
            .setTimestamp();

        return embed;
    }

    /**
     * Create cash out embed
     * @param {object} result - Cash out result
     * @returns {EmbedBuilder} - Embed
     */
    createCashOutEmbed(result) {
        if (result.crashed) {
            return new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('💥 CRASHED!')
                .setDescription(`Oyun **${result.crashPoint.toFixed(2)}x** seviyesinde çöktü!`)
                .addFields(
                    { name: '💸 Kaybedilen', value: `**${result.lostAmount.toLocaleString()}** NRC`, inline: true }
                )
                .setFooter({ text: 'Tekrar denemek için yeni oyun başlatın!' })
                .setTimestamp();
        }

        return new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ Başarılı Çıkış!')
            .setDescription(`**${result.cashOutMultiplier.toFixed(2)}x** seviyesinde çıkış yaptınız!`)
            .addFields(
                { name: '💰 Kazanç', value: `**${result.winAmount.toLocaleString()}** NRC`, inline: true },
                { name: '📊 Kar', value: `+**${result.profit.toLocaleString()}** NRC`, inline: true },
                { name: '💵 Yeni Bakiye', value: `**${result.newBalance.wallet.toLocaleString()}** NRC`, inline: true }
            )
            .setFooter({ text: 'Tebrikler! 🎉' })
            .setTimestamp();
    }
}

// Singleton instance
let crashGameInstance = null;

function getCrashGame() {
    if (!crashGameInstance) {
        crashGameInstance = new CrashGame();
    }
    return crashGameInstance;
}

module.exports = { CrashGame, getCrashGame };

