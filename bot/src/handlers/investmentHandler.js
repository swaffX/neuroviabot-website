// ==========================================
// 💰 Investment Handler
// ==========================================
// Manages NRC investments with APY returns

const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class InvestmentHandler {
    constructor() {
        this.plans = {
            week: {
                id: 'week',
                name: '7 Günlük Plan',
                duration: 7,
                apy: 0.05, // 5% APY
                emoji: '📅',
                color: '#3498DB',
                minAmount: 100,
                earlyWithdrawalPenalty: 0.25 // 25% penalty
            },
            month: {
                id: 'month',
                name: '30 Günlük Plan',
                duration: 30,
                apy: 0.15, // 15% APY
                emoji: '📆',
                color: '#9B59B6',
                minAmount: 500,
                earlyWithdrawalPenalty: 0.25
            },
            quarter: {
                id: 'quarter',
                name: '90 Günlük Plan',
                duration: 90,
                apy: 0.35, // 35% APY
                emoji: '🗓️',
                color: '#F39C12',
                minAmount: 1000,
                earlyWithdrawalPenalty: 0.25
            }
        };
    }

    // Get all investment plans
    getAllPlans() {
        return Object.values(this.plans);
    }

    // Get specific plan
    getPlan(planId) {
        return this.plans[planId] || null;
    }

    // Calculate interest earned
    calculateInterest(amount, apy, durationDays, actualDays = null) {
        const days = actualDays || durationDays;
        const dailyRate = apy / 365;
        const interest = amount * dailyRate * days;
        return Math.floor(interest);
    }

    // Create investment
    async createInvestment(userId, planId, amount) {
        const db = getDatabase();
        const plan = this.getPlan(planId);

        if (!plan) {
            throw new Error('Geçersiz yatırım planı!');
        }

        if (amount < plan.minAmount) {
            throw new Error(`Minimum yatırım miktarı: ${plan.minAmount.toLocaleString()} NRC`);
        }

        // Check balance
        const balance = db.getNeuroCoinBalance(userId);
        if (balance.wallet < amount) {
            throw new Error(`Yetersiz NRC! Gerekli: ${amount.toLocaleString()} NRC, Mevcut: ${balance.wallet.toLocaleString()} NRC`);
        }

        // Deduct NRC from wallet
        db.addNeuroCoin(userId, -amount, 'investment_create', {
            plan: planId,
            amount
        });

        // Create investment
        const investmentId = `inv_${Date.now()}_${userId}`;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + (plan.duration * 24 * 60 * 60 * 1000));

        const investment = {
            investmentId,
            userId,
            plan: planId,
            amount,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            apy: plan.apy,
            status: 'active',
            earnedInterest: 0,
            createdAt: startDate.toISOString()
        };

        db.data.investments.set(investmentId, investment);
        db.saveData();

        // Track activity
        try {
            const { trackInvestment } = require('../utils/activityTracker');
            const client = global.discordClient;
            let username = `User${userId.substring(0, 8)}`;

            if (client) {
                try {
                    const user = await client.users.fetch(userId).catch(() => null);
                    if (user) username = user.username;
                } catch (e) {}
            }

            await trackInvestment({
                userId,
                username,
                amount,
                duration: plan.duration,
                apy: plan.apy
            });
        } catch (error) {
            logger.debug('[InvestmentHandler] Activity tracking failed:', error);
        }

        logger.info(`[InvestmentHandler] ${userId} created ${planId} investment: ${amount} NRC`);

        return {
            success: true,
            investment,
            plan,
            newBalance: db.getNeuroCoinBalance(userId)
        };
    }

    // Get user's investments
    getUserInvestments(userId, status = null) {
        const db = getDatabase();
        const investments = [];

        for (const [investmentId, investment] of db.data.investments.entries()) {
            if (investment.userId === userId) {
                if (status === null || investment.status === status) {
                    investments.push(investment);
                }
            }
        }

        // Sort by creation date (newest first)
        investments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return investments;
    }

    // Get investment by ID
    getInvestment(investmentId) {
        const db = getDatabase();
        return db.data.investments.get(investmentId);
    }

    // Calculate current interest for active investment
    getCurrentInterest(investment) {
        if (investment.status !== 'active') {
            return investment.earnedInterest || 0;
        }

        const now = new Date();
        const startDate = new Date(investment.startDate);
        const endDate = new Date(investment.endDate);
        
        const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
        const elapsedDays = Math.min(totalDays, (now - startDate) / (1000 * 60 * 60 * 24));

        return this.calculateInterest(investment.amount, investment.apy, totalDays, elapsedDays);
    }

    // Withdraw investment
    async withdrawInvestment(userId, investmentId, early = false) {
        const db = getDatabase();
        const investment = this.getInvestment(investmentId);

        if (!investment) {
            throw new Error('Yatırım bulunamadı!');
        }

        if (investment.userId !== userId) {
            throw new Error('Bu yatırım size ait değil!');
        }

        if (investment.status !== 'active') {
            throw new Error('Bu yatırım zaten tamamlanmış veya çekilmiş!');
        }

        const now = new Date();
        const endDate = new Date(investment.endDate);
        const isMatured = now >= endDate;

        // Calculate interest
        let earnedInterest = this.getCurrentInterest(investment);
        let penaltyAmount = 0;
        let totalReturn = investment.amount + earnedInterest;

        // Apply early withdrawal penalty if not matured
        if (!isMatured && early) {
            const plan = this.getPlan(investment.plan);
            penaltyAmount = Math.floor(investment.amount * plan.earlyWithdrawalPenalty);
            totalReturn = investment.amount - penaltyAmount;
            earnedInterest = 0; // Lose all interest on early withdrawal
            
            investment.status = 'withdrawn_early';
        } else if (isMatured) {
            investment.status = 'completed';
        } else {
            throw new Error('Yatırım henüz vade dolmadı! Erken çekmek için `early: true` parametresini kullanın.');
        }

        // Return NRC to wallet
        db.addNeuroCoin(userId, totalReturn, 'investment_withdraw', {
            investmentId,
            amount: investment.amount,
            interest: earnedInterest,
            penalty: penaltyAmount,
            status: investment.status
        });

        // Update investment
        investment.earnedInterest = earnedInterest;
        investment.withdrawnAt = now.toISOString();
        investment.penaltyAmount = penaltyAmount;
        db.data.investments.set(investmentId, investment);
        db.saveData();

        logger.info(`[InvestmentHandler] ${userId} withdrew investment ${investmentId}: ${totalReturn} NRC (${investment.status})`);

        return {
            success: true,
            investment,
            totalReturn,
            earnedInterest,
            penaltyAmount,
            isEarlyWithdrawal: !isMatured,
            newBalance: db.getNeuroCoinBalance(userId)
        };
    }

    // Process matured investments (called by cron job)
    async processMaturedInvestments() {
        const db = getDatabase();
        const now = new Date();
        let processedCount = 0;

        for (const [investmentId, investment] of db.data.investments.entries()) {
            if (investment.status !== 'active') continue;

            const endDate = new Date(investment.endDate);
            
            if (now >= endDate) {
                // Investment has matured, calculate final interest
                investment.earnedInterest = this.getCurrentInterest(investment);
                investment.status = 'matured';
                db.data.investments.set(investmentId, investment);
                processedCount++;

                logger.info(`[InvestmentHandler] Investment ${investmentId} matured: ${investment.amount + investment.earnedInterest} NRC`);
            }
        }

        if (processedCount > 0) {
            db.saveData();
        }

        return { processedCount };
    }

    // Create investment plans embed
    createPlansEmbed() {
        const embed = new EmbedBuilder()
            .setColor('#F39C12')
            .setTitle('💰 Yatırım Planları')
            .setDescription('NRC\'nizi yatırın ve faiz kazanın! Vadesi dolunca ana para + faiz cüzdanınıza eklenir.')
            .setTimestamp();

        for (const plan of Object.values(this.plans)) {
            const exampleAmount = plan.minAmount * 10;
            const exampleInterest = this.calculateInterest(exampleAmount, plan.apy, plan.duration);
            const exampleTotal = exampleAmount + exampleInterest;

            embed.addFields({
                name: `${plan.emoji} ${plan.name}`,
                value: [
                    `**APY:** ${(plan.apy * 100).toFixed(0)}%`,
                    `**Süre:** ${plan.duration} gün`,
                    `**Min. Tutar:** ${plan.minAmount.toLocaleString()} NRC`,
                    `**Erken Çekme Cezası:** ${(plan.earlyWithdrawalPenalty * 100).toFixed(0)}%`,
                    ``,
                    `📊 **Örnek:**`,
                    `└ Yatırım: ${exampleAmount.toLocaleString()} NRC`,
                    `└ Faiz: +${exampleInterest.toLocaleString()} NRC`,
                    `└ Toplam: **${exampleTotal.toLocaleString()} NRC**`
                ].join('\n'),
                inline: false
            });
        }

        embed.setFooter({ text: 'Yatırım yapmak için: /nrc yatırım yap' });

        return embed;
    }

    // Create user investments status embed
    createStatusEmbed(userId, username) {
        const investments = this.getUserInvestments(userId);

        const embed = new EmbedBuilder()
            .setColor('#F39C12')
            .setTitle(`💰 ${username} - Yatırım Portföyü`)
            .setTimestamp();

        if (investments.length === 0) {
            embed.setDescription('❌ Henüz hiç yatırımınız yok!\n\n`/nrc yatırım planlar` komutu ile planları görüntüleyin.');
            return embed;
        }

        // Calculate totals
        const activeInvestments = investments.filter(inv => inv.status === 'active');
        const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        const totalCurrentInterest = activeInvestments.reduce((sum, inv) => sum + this.getCurrentInterest(inv), 0);
        const totalCurrentValue = totalInvested + totalCurrentInterest;

        embed.setDescription(`**Aktif Yatırımlar:** ${activeInvestments.length}\n**Toplam Yatırılan:** ${totalInvested.toLocaleString()} NRC\n**Mevcut Değer:** ${totalCurrentValue.toLocaleString()} NRC (+${totalCurrentInterest.toLocaleString()} NRC)`);

        // Show active investments
        const activeList = activeInvestments.slice(0, 5);
        for (const investment of activeList) {
            const plan = this.getPlan(investment.plan);
            const currentInterest = this.getCurrentInterest(investment);
            const endDate = new Date(investment.endDate);
            const now = new Date();
            const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

            embed.addFields({
                name: `${plan.emoji} ${plan.name} - ${investment.amount.toLocaleString()} NRC`,
                value: [
                    `Faiz: +${currentInterest.toLocaleString()} NRC`,
                    `Vade: ${daysRemaining} gün kaldı`,
                    `Bitiş: <t:${Math.floor(endDate.getTime() / 1000)}:R>`,
                    `ID: \`${investment.investmentId}\``
                ].join('\n'),
                inline: true
            });
        }

        if (activeInvestments.length > 5) {
            embed.addFields({
                name: '\u200b',
                value: `...ve ${activeInvestments.length - 5} yatırım daha`,
                inline: false
            });
        }

        // Show matured investments ready to withdraw
        const maturedInvestments = investments.filter(inv => inv.status === 'matured');
        if (maturedInvestments.length > 0) {
            const maturedTotal = maturedInvestments.reduce((sum, inv) => sum + inv.amount + inv.earnedInterest, 0);
            embed.addFields({
                name: '✅ Vadesi Dolan Yatırımlar',
                value: `**${maturedInvestments.length}** yatırım çekilmeyi bekliyor!\nToplam: **${maturedTotal.toLocaleString()} NRC**\n\n\`/nrc yatırım çek\` komutu ile çekebilirsiniz.`,
                inline: false
            });
        }

        return embed;
    }
}

// Singleton instance
let investmentHandlerInstance = null;

function getInvestmentHandler() {
    if (!investmentHandlerInstance) {
        investmentHandlerInstance = new InvestmentHandler();
    }
    return investmentHandlerInstance;
}

module.exports = { InvestmentHandler, getInvestmentHandler };

