// ==========================================
// 🤖 NeuroViaBot - Simple JSON Database
// ==========================================

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class SimpleDatabase {
    constructor() {
        this.dataDir = path.join(__dirname, '..', '..', 'data');
        this.dbPath = path.join(this.dataDir, 'database.json');
        this.backupPath = path.join(this.dataDir, 'database-backup.json');

        this.data = {
            users: new Map(),
            guilds: new Map(),
            guildMembers: new Map(),
            userEconomy: new Map(), // Legacy economy (to be migrated)
            neuroCoinBalances: new Map(), // New: userId -> { wallet, bank, total, lastDaily, lastWork }
            neuroCoinTransactions: new Map(), // New: txId -> transaction details
            marketplaceListings: new Map(), // New: listingId -> item details
            userInventory: new Map(), // New: userId -> [items]
            achievements: new Map(), // New: userId -> [achievements]
            dailyStreaks: new Map(), // New: userId -> streak data
            questProgress: new Map(), // New: userId -> quest data
            serverMarketConfig: new Map(), // New: guildId -> market settings
            activityRewards: new Map(), // New: userId -> last reward timestamp
            userProfiles: new Map(), // New: userId -> profile data (bio, color, badges)
            userStats: new Map(), // New: userId -> stats (messages, voiceTime, gameWins, winStreak)
            userPremium: new Map(), // New: userId -> { plan, expiresAt, features }
            guildPremium: new Map(), // New: guildId -> { plan, expiresAt, features }
            auditLogs: new Map(), // New: guildId -> Array<AuditEntry>
            guildTreasury: new Map(), // New: guildId -> { balance, totalEarned, transactions }
            stakingPositions: new Map(), // New: stakingId -> staking position
            stakingPools: new Map(), // New: poolId -> staking pool data
            loans: new Map(), // New: loanId -> loan details

            // NRC Expansion - Phase 2
            nftCollections: new Map(), // collectionId -> { name, type, items, totalSupply }
            userCollections: new Map(), // userId -> { ownedItems, favoriteItem, totalValue }
            nftListings: new Map(), // listingId -> NFT marketplace listing
            investments: new Map(), // investmentId -> { userId, amount, startDate, endDate, apy, status }
            questTemplates: new Map(), // questId -> { name, description, type, objectives, reward }
            gameStats: new Map(), // userId -> { totalGamesPlayed, wins, losses, biggestWin, streak }
            tournamentHistory: new Map(), // tournamentId -> { gametype, participants, winner, prizePool }
            tradeHistory: new Map(), // tradeId -> { buyerId, sellerId, itemId, price, platformFee, timestamp }

            // NRC Live Activity Feed
            activityFeed: new Map(), // activityId -> { type, userId, username, avatar, serverId, serverName, serverIcon, details, amount, timestamp, visibility }

            warnings: new Map(),
            tickets: new Map(),
            giveaways: new Map(),
            customCommands: new Map(),
            settings: new Map(),
            cmsContent: new Map(), // New: section -> { content, lastUpdated, updatedBy }
            automodSettings: new Map(), // New: guildId -> automod config
            automodViolations: new Map(), // New: violationId -> violation data
            reactionRoles: new Map(), // New: messageId -> reaction role setup
            tempBans: new Map() // New: userId_guildId -> { userId, guildId, expiresAt, reason, createdAt }
        };

        this.ensureDirectory();
        this.loadData();

        // Otomatik kaydetme (her 5 dakikada)
        setInterval(() => this.saveData(), 5 * 60 * 1000);
    }

    ensureDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    // Veriyi diskten yükle
    loadData() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const rawData = fs.readFileSync(this.dbPath, 'utf8');
                const jsonData = JSON.parse(rawData);

                // JSON objelerini Map'lere dönüştür
                for (const [key, value] of Object.entries(jsonData)) {
                    if (this.data.hasOwnProperty(key)) {
                        this.data[key] = new Map(Object.entries(value || {}));
                    }
                }

                logger.success('Database JSON dosyasından yüklendi');
            } else {
                logger.info('Yeni database oluşturuluyor');
                this.saveData();
            }
        } catch (error) {
            logger.error('Database yükleme hatası', error);

            // Backup'tan geri yüklemeyi dene
            if (fs.existsSync(this.backupPath)) {
                try {
                    const backupData = fs.readFileSync(this.backupPath, 'utf8');
                    const jsonBackup = JSON.parse(backupData);

                    for (const [key, value] of Object.entries(jsonBackup)) {
                        if (this.data.hasOwnProperty(key)) {
                            this.data[key] = new Map(Object.entries(value || {}));
                        }
                    }

                    logger.warn('Database backup\'tan geri yüklendi');
                } catch (backupError) {
                    logger.error('Backup geri yükleme hatası', backupError);
                }
            }
        }
    }

    // Veriyi diske kaydet
    saveData() {
        const now = Date.now();
        // Sadece 30 saniyede bir veya manuel zorunlu durumlarda diske yaz
        if (this.lastSave && (now - this.lastSave < 30000)) {
            return;
        }

        try {
            this.lastSave = now;
            // Backup oluştur
            if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, this.backupPath);
            }

            // Map'leri JSON objelerine dönüştür
            const jsonData = {};
            for (const [key, mapValue] of Object.entries(this.data)) {
                jsonData[key] = Object.fromEntries(mapValue);
            }

            // Dosyaya yaz
            // OPTIMIZATION: Use async write if possible or throttled synchronous write
            fs.writeFileSync(this.dbPath, JSON.stringify(jsonData, null, 2), 'utf8');
            logger.debug('Database disk üzerine kaydedildi (Throttled)');

        } catch (error) {
            logger.error('Database kaydetme hatası', { error: error.message, stack: error.stack });
        }
    }


    // User işlemleri
    getUser(userId) {
        return this.data.users.get(userId) || null;
    }

    createUser(userId, userData = {}) {
        const user = {
            id: userId,
            username: userData.username || 'Unknown',
            discriminator: userData.discriminator || '0000',
            globalName: userData.globalName || null,
            avatar: userData.avatar || null,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            ...userData
        };

        this.data.users.set(userId, user);
        return user;
    }

    getOrCreateUser(userId, userData = {}) {
        let user = this.getUser(userId);
        if (!user) {
            user = this.createUser(userId, userData);
        } else {
            // Güncelle
            if (userData.username) user.username = userData.username;
            if (userData.discriminator) user.discriminator = userData.discriminator;
            if (userData.globalName !== undefined) user.globalName = userData.globalName;
            if (userData.avatar !== undefined) user.avatar = userData.avatar;
            user.lastSeen = new Date().toISOString();
            this.data.users.set(userId, user);
        }
        return user;
    }

    // Guild işlemleri
    getGuild(guildId) {
        return this.data.guilds.get(guildId) || null;
    }

    createGuild(guildId, guildData = {}) {
        const guild = {
            id: guildId,
            name: guildData.name || 'Unknown Guild',
            createdAt: new Date().toISOString(),
            ...guildData
        };

        this.data.guilds.set(guildId, guild);
        return guild;
    }

    getOrCreateGuild(guildId, guildData = {}) {
        let guild = this.getGuild(guildId);
        if (!guild) {
            guild = this.createGuild(guildId, guildData);
        } else {
            if (guildData.name) guild.name = guildData.name;
            this.data.guilds.set(guildId, guild);
        }
        return guild;
    }

    // Economy işlemleri
    getUserEconomy(userId) {
        return this.data.userEconomy.get(userId) || {
            userId,
            balance: 0,
            bank: 0,
            lastDaily: null,
            lastWork: null,
            lastCrime: null,
            inventory: [],
            createdAt: new Date().toISOString()
        };
    }

    updateUserEconomy(userId, economyData) {
        const current = this.getUserEconomy(userId);
        const updated = { ...current, ...economyData };
        this.data.userEconomy.set(userId, updated);
        return updated;
    }

    // Settings işlemleri
    getGuildSettings(guildId) {
        return this.data.settings.get(guildId) || {
            guildId,
            prefix: '!',
            welcomeChannel: null,
            leaveChannel: null,
            autoRole: null,
            modRole: null,
            muteRole: null,
            logChannel: null,
            features: {
                music: true,
                economy: true,
                moderation: true,
                leveling: true,
                tickets: true,
                giveaways: true
            }
        };
    }

    updateGuildSettings(guildId, settings) {
        const current = this.getGuildSettings(guildId);
        const updated = { ...current, ...settings };
        this.data.settings.set(guildId, updated);
        // Persist immediately so audit logs survive reloads
        this.saveData();
        return updated;
    }

    // Guild Features yönetimi (guild-specific)
    isGuildFeatureEnabled(guildId, feature) {
        const settings = this.getGuildSettings(guildId);
        return settings.features?.[feature] === true;
    }

    updateGuildFeature(guildId, feature, enabled) {
        const settings = this.getGuildSettings(guildId);
        if (!settings.features) {
            settings.features = {};
        }
        settings.features[feature] = enabled;
        this.updateGuildSettings(guildId, settings);
        this.saveData();
        return true;
    }

    getGuildFeatures(guildId) {
        const settings = this.getGuildSettings(guildId);
        return settings.features || {};
    }

    // Warning işlemleri
    addWarning(userId, guildId, moderatorId, reason) {
        const warningId = Date.now().toString();
        const warning = {
            id: warningId,
            userId,
            guildId,
            moderatorId,
            reason,
            createdAt: new Date().toISOString(),
            active: true
        };

        this.data.warnings.set(warningId, warning);
        return warning;
    }

    getUserWarnings(userId, guildId) {
        const warnings = [];
        for (const [id, warning] of this.data.warnings) {
            if (warning.userId === userId && warning.guildId === guildId && warning.active) {
                warnings.push(warning);
            }
        }
        return warnings;
    }

    removeWarning(warningId) {
        const warning = this.data.warnings.get(warningId);
        if (warning) {
            warning.active = false;
            this.data.warnings.set(warningId, warning);
            return true;
        }
        return false;
    }

    // ==========================================
    // NeuroCoin Economy Methods
    // ==========================================

    getNeuroCoinBalance(userId) {
        if (!this.data.neuroCoinBalances.has(userId)) {
            this.data.neuroCoinBalances.set(userId, {
                wallet: 0,
                bank: 0,
                total: 0,
                lastDaily: null,
                lastWork: null
            });
        }
        return this.data.neuroCoinBalances.get(userId);
    }

    updateNeuroCoinBalance(userId, amount, type = 'wallet') {
        const balance = this.getNeuroCoinBalance(userId);

        if (type === 'wallet') {
            balance.wallet += amount;
        } else if (type === 'bank') {
            balance.bank += amount;
        }

        balance.total = balance.wallet + balance.bank;
        this.data.neuroCoinBalances.set(userId, balance);
        this.saveData();

        return balance;
    }

    transferNeuroCoin(fromUserId, toUserId, amount) {
        const fromBalance = this.getNeuroCoinBalance(fromUserId);
        const toBalance = this.getNeuroCoinBalance(toUserId);

        if (fromBalance.wallet < amount) {
            return { success: false, error: 'Yetersiz bakiye' };
        }

        fromBalance.wallet -= amount;
        fromBalance.total = fromBalance.wallet + fromBalance.bank;

        toBalance.wallet += amount;
        toBalance.total = toBalance.wallet + toBalance.bank;

        this.data.neuroCoinBalances.set(fromUserId, fromBalance);
        this.data.neuroCoinBalances.set(toUserId, toBalance);

        // Record transaction
        const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.recordTransaction(fromUserId, toUserId, amount, 'transfer', { txId });

        this.saveData();
        return { success: true, txId };
    }

    recordTransaction(from, to, amount, type, metadata = {}) {
        const txId = metadata.txId || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const transaction = {
            id: txId,
            from,
            to,
            amount,
            type, // 'transfer', 'activity', 'daily', 'work', 'game', 'marketplace'
            metadata,
            timestamp: new Date().toISOString()
        };

        this.data.neuroCoinTransactions.set(txId, transaction);
        this.saveData();

        return transaction;
    }

    getUserTransactions(userId, limit = 50) {
        const transactions = [];
        for (const [id, tx] of this.data.neuroCoinTransactions) {
            if (tx.from === userId || tx.to === userId) {
                transactions.push(tx);
            }
        }

        // Sort by timestamp descending
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return transactions.slice(0, limit);
    }

    // ==========================================
    // Marketplace Methods
    // ==========================================

    createListing(userId, item, price, guildId = 'global') {
        const listingId = `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const listing = {
            id: listingId,
            seller: userId,
            item,
            price,
            guildId,
            listed: new Date().toISOString(),
            active: true
        };

        this.data.marketplaceListings.set(listingId, listing);
        this.saveData();

        return listing;
    }

    purchaseListing(listingId, buyerId) {
        const listing = this.data.marketplaceListings.get(listingId);
        if (!listing || !listing.active) {
            return { success: false, error: 'Liste bulunamadı veya aktif değil' };
        }

        const buyerBalance = this.getNeuroCoinBalance(buyerId);
        if (buyerBalance.wallet < listing.price) {
            return { success: false, error: 'Yetersiz bakiye' };
        }

        // Transfer NRC
        const transfer = this.transferNeuroCoin(buyerId, listing.seller, listing.price);
        if (!transfer.success) {
            return transfer;
        }

        // Add item to buyer inventory
        const inventory = this.data.userInventory.get(buyerId) || [];
        inventory.push({
            ...listing.item,
            purchasedAt: new Date().toISOString(),
            purchasedFrom: listing.seller
        });
        this.data.userInventory.set(buyerId, inventory);

        // Mark listing as sold
        listing.active = false;
        listing.soldTo = buyerId;
        listing.soldAt = new Date().toISOString();
        this.data.marketplaceListings.set(listingId, listing);

        this.saveData();
        return { success: true, listing };
    }

    getMarketplaceListings(guildId, filters = {}) {
        const listings = [];
        for (const [id, listing] of this.data.marketplaceListings) {
            if (listing.active && (guildId === 'global' || listing.guildId === guildId || listing.guildId === 'global')) {
                listings.push(listing);
            }
        }
        return listings;
    }

    getServerMarketConfig(guildId) {
        if (!this.data.serverMarketConfig.has(guildId)) {
            this.data.serverMarketConfig.set(guildId, {
                enabled: true,
                tax: 0,
                allowGlobal: true,
                customItems: [],
                featured: [],
                blacklist: []
            });
        }
        return this.data.serverMarketConfig.get(guildId);
    }

    updateServerMarketConfig(guildId, config) {
        const currentConfig = this.getServerMarketConfig(guildId);
        const newConfig = { ...currentConfig, ...config };
        this.data.serverMarketConfig.set(guildId, newConfig);
        this.saveData();
        return newConfig;
    }

    // ==========================================
    // Activity Rewards
    // ==========================================

    getLastActivityReward(userId) {
        return this.data.activityRewards.get(userId) || 0;
    }

    setLastActivityReward(userId, timestamp = Date.now()) {
        this.data.activityRewards.set(userId, timestamp);
        this.saveData();
    }

    // ==========================================
    // Investment & Staking System
    // ==========================================

    getNRCBalance(userId) {
        // Alias for getNeuroCoinBalance - returns total
        const balance = this.getNeuroCoinBalance(userId);
        return balance.wallet;
    }

    updateNRCBalance(userId, amount, reason = 'manual') {
        // Alias for updateNeuroCoinBalance
        this.updateNeuroCoinBalance(userId, amount, 'wallet');

        // Record transaction
        if (amount > 0) {
            this.recordTransaction('system', userId, amount, reason, {});
        } else if (amount < 0) {
            this.recordTransaction(userId, 'system', Math.abs(amount), reason, {});
        }

        this.saveData();
    }

    createStakingPosition(userId, amount, duration) {
        const balance = this.getNeuroCoinBalance(userId);

        if (balance.bank < amount) {
            return { success: false, error: 'Yetersiz banka bakiyesi' };
        }

        // APY rates based on duration (days)
        const apyRates = {
            7: 5,    // 7 days = 5% APY
            30: 10,  // 30 days = 10% APY
            90: 15,  // 90 days = 15% APY
            365: 20  // 365 days = 20% APY
        };

        const apy = apyRates[duration] || 5;
        const stakingId = `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const endsAt = Date.now() + (duration * 24 * 60 * 60 * 1000);

        // Calculate expected reward
        const yearlyReward = amount * (apy / 100);
        const dailyReward = yearlyReward / 365;
        const totalReward = Math.floor(dailyReward * duration);

        const stakingPosition = {
            id: stakingId,
            userId,
            amount,
            duration,
            apy,
            startedAt: Date.now(),
            endsAt,
            totalReward,
            claimed: false,
            earlyWithdraw: false
        };

        // Deduct from bank
        this.updateNeuroCoinBalance(userId, -amount, 'bank');

        // Store staking position
        if (!this.data.stakingPositions) {
            this.data.stakingPositions = new Map();
        }
        this.data.stakingPositions.set(stakingId, stakingPosition);

        this.recordTransaction(userId, 'staking', amount, 'stake_created', {
            stakingId,
            duration,
            apy,
            expectedReward: totalReward
        });

        this.saveData();

        return { success: true, staking: stakingPosition };
    }

    getUserStakingPositions(userId) {
        if (!this.data.stakingPositions) {
            this.data.stakingPositions = new Map();
        }

        const positions = [];
        for (const [id, pos] of this.data.stakingPositions) {
            if (pos.userId === userId && !pos.claimed) {
                positions.push(pos);
            }
        }
        return positions;
    }

    claimStaking(stakingId, userId) {
        if (!this.data.stakingPositions) {
            return { success: false, error: 'Staking bulunamadı' };
        }

        const position = this.data.stakingPositions.get(stakingId);

        if (!position) {
            return { success: false, error: 'Staking pozisyonu bulunamadı' };
        }

        if (position.userId !== userId) {
            return { success: false, error: 'Bu staking size ait değil' };
        }

        if (position.claimed) {
            return { success: false, error: 'Bu staking zaten talep edilmiş' };
        }

        const now = Date.now();
        const isEarly = now < position.endsAt;

        let returnAmount = position.amount;
        let reward = 0;

        if (isEarly) {
            // Early withdrawal penalty: 20% of principal
            const penalty = Math.floor(position.amount * 0.2);
            returnAmount = position.amount - penalty;

            position.earlyWithdraw = true;
            position.penalty = penalty;
        } else {
            // Full reward
            reward = position.totalReward;
            returnAmount = position.amount + reward;
        }

        // Return to bank
        this.updateNeuroCoinBalance(userId, returnAmount, 'bank');

        // Mark as claimed
        position.claimed = true;
        position.claimedAt = now;
        this.data.stakingPositions.set(stakingId, position);

        this.recordTransaction('staking', userId, returnAmount, 'stake_claimed', {
            stakingId,
            isEarly,
            penalty: position.penalty || 0,
            reward
        });

        this.saveData();

        return {
            success: true,
            returnAmount,
            reward,
            isEarly,
            penalty: position.penalty || 0
        };
    }

    // ==========================================
    // Loan System
    // ==========================================

    createLoan(userId, amount, durationDays, collateral = null) {
        const balance = this.getNeuroCoinBalance(userId);
        const userSettings = this.getUserSettings(userId) || {};

        // Check credit score
        const creditScore = userSettings.creditScore || 100; // 0-100

        if (creditScore < 30) {
            return { success: false, error: 'Kredi skorunuz çok düşük' };
        }

        // Interest rate based on credit score and duration
        const baseRate = 10; // 10% base
        const creditAdjustment = (100 - creditScore) / 10; // Lower score = higher rate
        const durationAdjustment = durationDays / 30; // Longer = higher rate
        const interestRate = baseRate + creditAdjustment + durationAdjustment;

        const loanId = `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const dueDate = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        const interestAmount = Math.floor(amount * (interestRate / 100));
        const totalRepayment = amount + interestAmount;

        const loan = {
            id: loanId,
            userId,
            amount,
            interestRate,
            interestAmount,
            totalRepayment,
            durationDays,
            createdAt: Date.now(),
            dueDate,
            status: 'active',
            collateral,
            repaid: false
        };

        // Initialize loans map if not exists
        if (!this.data.loans) {
            this.data.loans = new Map();
        }

        // Give loan to user (to wallet)
        this.updateNeuroCoinBalance(userId, amount, 'wallet');

        this.data.loans.set(loanId, loan);

        this.recordTransaction('loan_system', userId, amount, 'loan_taken', {
            loanId,
            interestRate,
            dueDate: new Date(dueDate).toISOString()
        });

        this.saveData();

        return { success: true, loan };
    }

    getUserLoans(userId) {
        if (!this.data.loans) {
            this.data.loans = new Map();
        }

        const loans = [];
        for (const [id, loan] of this.data.loans) {
            if (loan.userId === userId && loan.status === 'active') {
                loans.push(loan);
            }
        }
        return loans;
    }

    repayLoan(loanId, userId, amount = null) {
        if (!this.data.loans) {
            return { success: false, error: 'Kredi bulunamadı' };
        }

        const loan = this.data.loans.get(loanId);

        if (!loan) {
            return { success: false, error: 'Kredi bulunamadı' };
        }

        if (loan.userId !== userId) {
            return { success: false, error: 'Bu kredi size ait değil' };
        }

        if (loan.status !== 'active') {
            return { success: false, error: 'Bu kredi aktif değil' };
        }

        const repayAmount = amount || loan.totalRepayment;
        const balance = this.getNeuroCoinBalance(userId);

        if (balance.wallet < repayAmount) {
            return { success: false, error: 'Yetersiz bakiye' };
        }

        // Deduct from wallet
        this.updateNeuroCoinBalance(userId, -repayAmount, 'wallet');

        // Update loan status
        loan.status = 'repaid';
        loan.repaid = true;
        loan.repaidAt = Date.now();
        loan.repaidAmount = repayAmount;
        this.data.loans.set(loanId, loan);

        // Update credit score (improve on successful repayment)
        const userSettings = this.getUserSettings(userId) || {};
        if (!userSettings.creditScore) {
            userSettings.creditScore = 100;
        }

        const isOnTime = Date.now() <= loan.dueDate;
        if (isOnTime) {
            userSettings.creditScore = Math.min(100, userSettings.creditScore + 5);
        }

        this.setUserSettings(userId, userSettings);

        this.recordTransaction(userId, 'loan_system', repayAmount, 'loan_repaid', {
            loanId,
            onTime: isOnTime
        });

        this.saveData();

        return { success: true, loan };
    }

    // Statistics
    getStats() {
        return {
            users: this.data.users.size,
            guilds: this.data.guilds.size,
            guildMembers: this.data.guildMembers.size,
            userEconomy: this.data.userEconomy.size,
            neuroCoinBalances: this.data.neuroCoinBalances.size,
            neuroCoinTransactions: this.data.neuroCoinTransactions.size,
            marketplaceListings: this.data.marketplaceListings.size,
            warnings: this.data.warnings.size,
            tickets: this.data.tickets.size,
            giveaways: this.data.giveaways.size,
            customCommands: this.data.customCommands.size,
            settings: this.data.settings.size
        };
    }

    // Backup ve maintenance
    createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.dataDir, `backup-${timestamp}.json`);

            fs.copyFileSync(this.dbPath, backupFile);
            logger.success(`Backup oluşturuldu: ${backupFile}`);
            return backupFile;
        } catch (error) {
            logger.error('Backup oluşturma hatası', error);
            return null;
        }
    }

    cleanOldBackups() {
        try {
            const files = fs.readdirSync(this.dataDir);
            const backupFiles = files.filter(f => f.startsWith('backup-'));
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            backupFiles.forEach(file => {
                const filePath = path.join(this.dataDir, file);
                const stats = fs.statSync(filePath);

                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlinkSync(filePath);
                    logger.info(`Eski backup silindi: ${file}`);
                }
            });
        } catch (error) {
            logger.error('Backup temizleme hatası', error);
        }
    }

    // ==========================================
    // Premium
    // ==========================================

    getUserPremium(userId) {
        return this.data.userPremium.get(userId) || {
            plan: 'free',
            expiresAt: null,
            features: []
        };
    }

    setUserPremium(userId, premiumData) {
        this.data.userPremium.set(userId, premiumData);
        this.saveData();
    }

    isUserPremium(userId) {
        const premium = this.getUserPremium(userId);
        if (premium.plan === 'free') return false;
        if (!premium.expiresAt) return true;
        return new Date(premium.expiresAt) > new Date();
    }

    getGuildPremium(guildId) {
        return this.data.guildPremium.get(guildId) || {
            plan: 'free',
            expiresAt: null,
            features: []
        };
    }

    setGuildPremium(guildId, premiumData) {
        this.data.guildPremium.set(guildId, premiumData);
        this.saveData();
    }

    isGuildPremium(guildId) {
        const premium = this.getGuildPremium(guildId);
        if (premium.plan === 'free') return false;
        if (!premium.expiresAt) return true;
        return new Date(premium.expiresAt) > new Date();
    }

    // ==========================================
    // Audit Logs
    // ==========================================

    addAuditLog(guildId, entry) {
        if (!this.data.auditLogs.has(guildId)) {
            this.data.auditLogs.set(guildId, []);
        }
        const logs = this.data.auditLogs.get(guildId);
        logs.unshift(entry); // Add to beginning

        // Keep only last 1000 entries per guild
        if (logs.length > 1000) {
            logs.splice(1000);
        }

        this.data.auditLogs.set(guildId, logs);
        this.saveData();
    }

    getAuditLogs(guildId, filters = {}) {
        // First try to get from new location (in settings)
        const settings = this.getGuildSettings(guildId);
        let logs = settings.auditLogs || [];

        // Then merge with old location (audit logs map)
        if (this.data.auditLogs.has(guildId)) {
            const oldLogs = this.data.auditLogs.get(guildId) || [];
            // Merge and deduplicate by ID
            const logsMap = new Map();
            [...logs, ...oldLogs].forEach(log => {
                if (log && log.id) {
                    logsMap.set(log.id, log);
                }
            });
            logs = Array.from(logsMap.values());
        }

        let filtered = [...logs];

        // Apply filters
        if (filters.type) {
            filtered = filtered.filter(log => log.action === filters.type || log.type === filters.type);
        }
        if (filters.userId) {
            filtered = filtered.filter(log => {
                const executorId = log.executor?.id || log.userId;
                return executorId === filters.userId;
            });
        }
        if (filters.startDate) {
            filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Pagination
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 50;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        return {
            logs: filtered.slice(startIndex, endIndex),
            total: filtered.length,
            page,
            limit,
            totalPages: Math.ceil(filtered.length / limit)
        };
    }

    cleanupOldAuditLogs(cutoffDate) {
        for (const [guildId, logs] of this.data.auditLogs) {
            const filtered = logs.filter(log => new Date(log.timestamp) > cutoffDate);
            this.data.auditLogs.set(guildId, filtered);
        }
        this.saveData();
    }
}

// Singleton instance
const db = new SimpleDatabase();

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Database kaydediliyor...');
    db.saveData();
});

process.on('SIGTERM', () => {
    logger.info('Database kaydediliyor...');
    db.saveData();
});

// Export both the instance and a getter function for compatibility
module.exports = db;
module.exports.getDatabase = () => db;
