// ==========================================
// ⚔️ Duel Game
// ==========================================
// 1v1 battles with NRC stakes

const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');
const { getQuestProgressTracker } = require('../utils/questProgressTracker');

class DuelGame {
    constructor() {
        this.activeDuels = new Map(); // duelId -> duel data
        this.pendingChallenges = new Map(); // challengerId -> challenge data
        this.MIN_STAKE = 50;
        this.MAX_STAKE = 5000;
        this.PLATFORM_FEE = 0.05; // 5% fee
    }

    /**
     * Challenge another user to a duel
     * @param {string} challengerId - Challenger's user ID
     * @param {string} opponentId - Opponent's user ID
     * @param {number} stake - Stake amount in NRC
     * @param {string} gameType - 'rps' | 'trivia' | 'coinflip'
     * @returns {object} - Challenge result
     */
    async createChallenge(challengerId, opponentId, stake, gameType = 'rps') {
        const db = getDatabase();

        // Validate
        if (challengerId === opponentId) {
            throw new Error('Kendinize meydan okuyamazsınız!');
        }

        if (stake < this.MIN_STAKE || stake > this.MAX_STAKE) {
            throw new Error(`Bahis miktarı ${this.MIN_STAKE}-${this.MAX_STAKE} NRC arasında olmalıdır!`);
        }

        // Check if challenger already has pending challenge
        if (this.pendingChallenges.has(challengerId)) {
            throw new Error('Zaten bekleyen bir meydan okumanız var!');
        }

        // Check challenger balance
        const challengerBalance = db.getNeuroCoinBalance(challengerId);
        if (challengerBalance.wallet < stake) {
            throw new Error(`Yetersiz NRC! Gerekli: ${stake.toLocaleString()} NRC`);
        }

        // Hold challenger's stake
        db.addNeuroCoin(challengerId, -stake, 'duel_stake_hold', { opponentId, stake });

        // Create challenge
        const challengeId = `duel_${Date.now()}_${challengerId}`;
        const challenge = {
            challengeId,
            challengerId,
            opponentId,
            stake,
            gameType,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min expiry
        };

        this.pendingChallenges.set(challengerId, challenge);

        logger.info(`[Duel] ${challengerId} challenged ${opponentId} to ${gameType} for ${stake} NRC`);

        return {
            success: true,
            challengeId,
            challenge
        };
    }

    /**
     * Accept a duel challenge
     * @param {string} opponentId - Opponent's user ID
     * @param {string} challengeId - Challenge ID
     * @returns {object} - Accept result
     */
    async acceptChallenge(opponentId, challengeId) {
        const db = getDatabase();

        // Find challenge
        let challenge = null;
        for (const [_, ch] of this.pendingChallenges.entries()) {
            if (ch.challengeId === challengeId && ch.opponentId === opponentId) {
                challenge = ch;
                break;
            }
        }

        if (!challenge) {
            throw new Error('Meydan okuma bulunamadı!');
        }

        if (challenge.status !== 'pending') {
            throw new Error('Bu meydan okuma artık geçerli değil!');
        }

        // Check if expired
        if (new Date() > new Date(challenge.expiresAt)) {
            // Refund challenger
            db.addNeuroCoin(challenge.challengerId, challenge.stake, 'duel_refund', { reason: 'expired' });
            this.pendingChallenges.delete(challenge.challengerId);
            throw new Error('Bu meydan okuma süresi dolmuş!');
        }

        // Check opponent balance
        const opponentBalance = db.getNeuroCoinBalance(opponentId);
        if (opponentBalance.wallet < challenge.stake) {
            throw new Error(`Yetersiz NRC! Gerekli: ${challenge.stake.toLocaleString()} NRC`);
        }

        // Hold opponent's stake
        db.addNeuroCoin(opponentId, -challenge.stake, 'duel_stake_hold', { 
            challengerId: challenge.challengerId, 
            stake: challenge.stake 
        });

        // Start duel
        const duelId = `duel_active_${Date.now()}`;
        const duel = {
            duelId,
            challengerId: challenge.challengerId,
            opponentId,
            stake: challenge.stake,
            gameType: challenge.gameType,
            totalPot: challenge.stake * 2,
            status: 'active',
            moves: {},
            startedAt: new Date().toISOString()
        };

        this.activeDuels.set(duelId, duel);
        this.pendingChallenges.delete(challenge.challengerId);

        // Track quest progress for both players
        const questTracker = getQuestProgressTracker();
        await questTracker.trackGamePlayed(challenge.challengerId, 'global');
        await questTracker.trackGamePlayed(opponentId, 'global');

        logger.info(`[Duel] ${opponentId} accepted challenge from ${challenge.challengerId}, duel ${duelId} started`);

        return {
            success: true,
            duelId,
            duel
        };
    }

    /**
     * Make a move in active duel
     * @param {string} userId - User ID
     * @param {string} duelId - Duel ID
     * @param {string} move - Move (rps: 'rock'|'paper'|'scissors', coinflip: 'heads'|'tails')
     * @returns {object} - Move result
     */
    async makeMove(userId, duelId, move) {
        const duel = this.activeDuels.get(duelId);

        if (!duel) {
            throw new Error('Düello bulunamadı!');
        }

        if (duel.status !== 'active') {
            throw new Error('Bu düello artık aktif değil!');
        }

        if (userId !== duel.challengerId && userId !== duel.opponentId) {
            throw new Error('Bu düelloda değilsiniz!');
        }

        if (duel.moves[userId]) {
            throw new Error('Zaten hamlenizi yaptınız!');
        }

        // Validate move based on game type
        if (duel.gameType === 'rps') {
            if (!['rock', 'paper', 'scissors'].includes(move)) {
                throw new Error('Geçersiz hamle! (rock, paper, scissors)');
            }
        } else if (duel.gameType === 'coinflip') {
            if (!['heads', 'tails'].includes(move)) {
                throw new Error('Geçersiz hamle! (heads, tails)');
            }
        }

        // Record move
        duel.moves[userId] = move;

        // Check if both players have moved
        if (Object.keys(duel.moves).length === 2) {
            return await this.resolveDuel(duelId);
        }

        return {
            success: true,
            waitingForOpponent: true
        };
    }

    /**
     * Resolve duel and determine winner
     * @param {string} duelId - Duel ID
     * @returns {object} - Resolution result
     */
    async resolveDuel(duelId) {
        const db = getDatabase();
        const duel = this.activeDuels.get(duelId);

        if (!duel) {
            throw new Error('Düello bulunamadı!');
        }

        const challengerMove = duel.moves[duel.challengerId];
        const opponentMove = duel.moves[duel.opponentId];

        let winnerId = null;
        let result = 'draw';

        if (duel.gameType === 'rps') {
            result = this.resolveRPS(challengerMove, opponentMove);
            
            if (result === 'challenger') {
                winnerId = duel.challengerId;
            } else if (result === 'opponent') {
                winnerId = duel.opponentId;
            }
        } else if (duel.gameType === 'coinflip') {
            // Random coin flip
            const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
            
            if (challengerMove === coinResult && opponentMove !== coinResult) {
                winnerId = duel.challengerId;
                result = 'challenger';
            } else if (opponentMove === coinResult && challengerMove !== coinResult) {
                winnerId = duel.opponentId;
                result = 'opponent';
            } else if (challengerMove === opponentMove) {
                result = 'draw';
            } else {
                // Both guessed wrong, random winner
                winnerId = Math.random() < 0.5 ? duel.challengerId : duel.opponentId;
                result = winnerId === duel.challengerId ? 'challenger' : 'opponent';
            }

            duel.coinFlipResult = coinResult;
        }

        // Calculate winnings
        const platformFee = Math.floor(duel.totalPot * this.PLATFORM_FEE);
        const winnings = duel.totalPot - platformFee;

        if (result === 'draw') {
            // Refund both players
            db.addNeuroCoin(duel.challengerId, duel.stake, 'duel_draw', { duelId });
            db.addNeuroCoin(duel.opponentId, duel.stake, 'duel_draw', { duelId });
        } else {
            // Award winner
            db.addNeuroCoin(winnerId, winnings, 'duel_win', {
                duelId,
                defeated: winnerId === duel.challengerId ? duel.opponentId : duel.challengerId,
                profit: winnings - duel.stake
            });

            // Update stats
            this.updateDuelStats(winnerId, true, winnings - duel.stake, 0);
            const loserId = winnerId === duel.challengerId ? duel.opponentId : duel.challengerId;
            this.updateDuelStats(loserId, false, 0, duel.stake);
        }

        duel.status = 'completed';
        duel.result = result;
        duel.winnerId = winnerId;
        duel.completedAt = new Date().toISOString();

        this.activeDuels.delete(duelId);

        logger.info(`[Duel] ${duelId} completed, winner: ${winnerId || 'draw'}`);

        return {
            success: true,
            result,
            winnerId,
            winnings: result !== 'draw' ? winnings : duel.stake,
            platformFee,
            challengerMove,
            opponentMove,
            coinFlipResult: duel.coinFlipResult,
            newBalance: winnerId ? db.getNeuroCoinBalance(winnerId) : null
        };
    }

    /**
     * Resolve Rock Paper Scissors
     * @param {string} move1 - First move
     * @param {string} move2 - Second move
     * @returns {string} - 'challenger' | 'opponent' | 'draw'
     */
    resolveRPS(move1, move2) {
        if (move1 === move2) return 'draw';
        
        const wins = {
            rock: 'scissors',
            scissors: 'paper',
            paper: 'rock'
        };

        return wins[move1] === move2 ? 'challenger' : 'opponent';
    }

    /**
     * Update duel statistics
     * @param {string} userId - User ID
     * @param {boolean} won - Did user win?
     * @param {number} profit - Profit amount
     * @param {number} loss - Loss amount
     */
    updateDuelStats(userId, won, profit, loss) {
        const db = getDatabase();

        if (!db.data.gameStats.has(userId)) {
            db.data.gameStats.set(userId, {
                totalGamesPlayed: 0,
                totalWins: 0,
                totalLosses: 0,
                biggestWin: 0,
                currentStreak: 0,
                favoriteGame: 'duel',
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
     * Cancel pending challenge
     * @param {string} challengerId - Challenger ID
     * @returns {object} - Cancel result
     */
    async cancelChallenge(challengerId) {
        const db = getDatabase();
        const challenge = this.pendingChallenges.get(challengerId);

        if (!challenge) {
            throw new Error('Bekleyen meydan okumanız yok!');
        }

        // Refund stake
        db.addNeuroCoin(challengerId, challenge.stake, 'duel_cancel', { challengeId: challenge.challengeId });

        this.pendingChallenges.delete(challengerId);

        logger.info(`[Duel] ${challengerId} cancelled challenge ${challenge.challengeId}`);

        return {
            success: true,
            refundedAmount: challenge.stake
        };
    }
}

// Singleton instance
let duelGameInstance = null;

function getDuelGame() {
    if (!duelGameInstance) {
        duelGameInstance = new DuelGame();
    }
    return duelGameInstance;
}

module.exports = { DuelGame, getDuelGame };

