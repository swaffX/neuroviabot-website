// ==========================================
// 🔒 Escrow Manager
// ==========================================
// Manages secure transactions with escrow protection

const { getDatabase } = require('../database/simple-db');
const { logger } = require('./logger');
const { getQuestProgressTracker } = require('./questProgressTracker');
const PremiumCheck = require('../middleware/premiumCheck');

class EscrowManager {
    constructor() {
        this.PLATFORM_FEE_RATE = 0.05; // 5% base fee
    }

    /**
     * Calculate platform fee with premium discount
     * @param {string} sellerId - Seller's user ID
     * @param {number} price - Sale price
     * @returns {object} - Fee breakdown
     */
    calculateFee(sellerId, price) {
        const feeCalc = PremiumCheck.calculateMarketplaceFee(sellerId, price);
        
        return {
            price,
            baseFee: Math.floor(price * this.PLATFORM_FEE_RATE),
            discount: feeCalc.discount,
            actualFee: feeCalc.fee,
            sellerReceives: feeCalc.netAmount,
            discountPercentage: feeCalc.discountPercentage
        };
    }

    /**
     * Hold funds in escrow for NFT purchase
     * @param {string} buyerId - Buyer's user ID
     * @param {string} listingId - Marketplace listing ID
     * @param {number} price - Purchase price
     * @returns {object} - Escrow transaction details
     */
    async holdFunds(buyerId, listingId, price) {
        const db = getDatabase();

        // Check buyer balance
        const balance = db.getNeuroCoinBalance(buyerId);
        if (balance.wallet < price) {
            throw new Error(`Yetersiz NRC! Gerekli: ${price.toLocaleString()} NRC, Mevcut: ${balance.wallet.toLocaleString()} NRC`);
        }

        // Deduct from buyer's wallet (held in escrow)
        db.addNeuroCoin(buyerId, -price, 'escrow_hold', {
            listingId,
            price,
            timestamp: new Date().toISOString()
        });

        logger.info(`[Escrow] Held ${price} NRC from ${buyerId} for listing ${listingId}`);

        return {
            success: true,
            buyerId,
            listingId,
            amount: price,
            heldAt: new Date().toISOString()
        };
    }

    /**
     * Release funds from escrow to seller (after successful transfer)
     * @param {string} sellerId - Seller's user ID
     * @param {string} buyerId - Buyer's user ID
     * @param {string} listingId - Listing ID
     * @param {number} price - Sale price
     * @returns {object} - Release details
     */
    async releaseFunds(sellerId, buyerId, listingId, price) {
        const db = getDatabase();

        // Calculate fee
        const feeCalc = this.calculateFee(sellerId, price);

        // Add net amount to seller's wallet
        db.addNeuroCoin(sellerId, feeCalc.sellerReceives, 'escrow_release', {
            listingId,
            buyerId,
            price,
            fee: feeCalc.actualFee,
            discount: feeCalc.discount
        });

        // Record trade in history
        const tradeId = `trade_${Date.now()}_${buyerId}`;
        db.data.tradeHistory.set(tradeId, {
            tradeId,
            buyerId,
            sellerId,
            listingId,
            price,
            platformFee: feeCalc.actualFee,
            platformFeeDiscount: feeCalc.discount,
            sellerReceived: feeCalc.sellerReceives,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });

        db.saveData();

        // Track quest progress for both buyer and seller
        const questTracker = getQuestProgressTracker();
        await questTracker.trackTrade(buyerId, 'global');
        await questTracker.trackTrade(sellerId, 'global');

        // Track marketplace trade activity
        try {
            const { trackMarketplaceTrade } = require('./activityTracker');
            const client = global.discordClient;
            let buyerName = `User${buyerId.substring(0, 8)}`;
            let sellerName = `User${sellerId.substring(0, 8)}`;

            if (client) {
                try {
                    const buyer = await client.users.fetch(buyerId).catch(() => null);
                    const seller = await client.users.fetch(sellerId).catch(() => null);
                    if (buyer) buyerName = buyer.username;
                    if (seller) sellerName = seller.username;
                } catch (e) {}
            }

            await trackMarketplaceTrade({
                buyerId,
                buyerName,
                sellerId,
                sellerName,
                serverId: null,
                serverName: null,
                itemName: listingId,
                price
            });
        } catch (error) {
            // Silent fail
        }

        logger.info(`[Escrow] Released ${feeCalc.sellerReceives} NRC to ${sellerId} (fee: ${feeCalc.actualFee} NRC)`);

        return {
            success: true,
            tradeId,
            sellerReceived: feeCalc.sellerReceives,
            fee: feeCalc.actualFee,
            discount: feeCalc.discount
        };
    }

    /**
     * Refund buyer if transaction fails
     * @param {string} buyerId - Buyer's user ID
     * @param {string} listingId - Listing ID
     * @param {number} price - Amount to refund
     * @param {string} reason - Refund reason
     * @returns {object} - Refund details
     */
    async refundBuyer(buyerId, listingId, price, reason = 'Transaction cancelled') {
        const db = getDatabase();

        // Return funds to buyer
        db.addNeuroCoin(buyerId, price, 'escrow_refund', {
            listingId,
            price,
            reason,
            timestamp: new Date().toISOString()
        });

        logger.warn(`[Escrow] Refunded ${price} NRC to ${buyerId}: ${reason}`);

        return {
            success: true,
            buyerId,
            amount: price,
            reason,
            refundedAt: new Date().toISOString()
        };
    }

    /**
     * Complete NFT purchase with escrow protection
     * @param {string} buyerId - Buyer's user ID
     * @param {string} listingId - Marketplace listing ID
     * @returns {object} - Transaction result
     */
    async completePurchase(buyerId, listingId) {
        const db = getDatabase();
        const listing = db.data.marketplaceListings.get(listingId);

        if (!listing) {
            throw new Error('Listing bulunamadı!');
        }

        if (listing.status !== 'active') {
            throw new Error('Bu listing artık aktif değil!');
        }

        if (listing.sellerId === buyerId) {
            throw new Error('Kendi listinginizi satın alamazsınız!');
        }

        try {
            // Step 1: Hold funds in escrow
            await this.holdFunds(buyerId, listingId, listing.price);

            // Step 2: Transfer NFT from seller to buyer (using nftHandler)
            const { getNFTHandler } = require('../handlers/nftHandler');
            const nftHandler = getNFTHandler();
            
            // Remove NFT from seller
            const sellerCollection = nftHandler.getUserCollection(listing.sellerId);
            const nftIndex = sellerCollection.ownedItems.findIndex(
                item => item.collectionId === listing.collectionId && 
                        item.itemId === listing.itemId
            );

            if (nftIndex === -1) {
                // Seller no longer has the NFT, refund buyer
                await this.refundBuyer(buyerId, listingId, listing.price, 'Seller no longer owns NFT');
                throw new Error('Satıcı artık bu NFT\'ye sahip değil!');
            }

            const nftItem = sellerCollection.ownedItems[nftIndex];
            sellerCollection.ownedItems.splice(nftIndex, 1);
            sellerCollection.totalValue -= listing.price;

            // Add NFT to buyer
            const buyerCollection = nftHandler.getUserCollection(buyerId);
            buyerCollection.ownedItems.push({
                ...nftItem,
                purchasePrice: listing.price,
                acquiredAt: new Date().toISOString(),
                acquiredMethod: 'marketplace_purchase',
                previousOwner: listing.sellerId
            });
            buyerCollection.totalValue += listing.price;
            buyerCollection.totalPurchases += 1;

            // Step 3: Release funds to seller
            const releaseResult = await this.releaseFunds(
                listing.sellerId,
                buyerId,
                listingId,
                listing.price
            );

            // Step 4: Mark listing as sold
            listing.status = 'sold';
            listing.soldTo = buyerId;
            listing.soldAt = new Date().toISOString();
            listing.tradeId = releaseResult.tradeId;
            db.data.marketplaceListings.set(listingId, listing);

            // Step 5: Remove from nftListings (since it's sold)
            db.data.nftListings.delete(listingId);

            db.saveData();

            logger.info(`[Escrow] Purchase complete: ${listingId} sold to ${buyerId}`);

            return {
                success: true,
                listing,
                tradeId: releaseResult.tradeId,
                nftTransferred: true,
                fundsReleased: true,
                fee: releaseResult.fee,
                discount: releaseResult.discount
            };

        } catch (error) {
            logger.error(`[Escrow] Purchase failed for ${listingId}:`, error);
            throw error;
        }
    }

    /**
     * Get user's trade history
     * @param {string} userId - User ID
     * @param {string} type - 'buy' | 'sell' | 'all'
     * @returns {Array} - Trade history
     */
    getUserTradeHistory(userId, type = 'all') {
        const db = getDatabase();
        const trades = [];

        for (const [tradeId, trade] of db.data.tradeHistory.entries()) {
            if (type === 'all' || 
                (type === 'buy' && trade.buyerId === userId) ||
                (type === 'sell' && trade.sellerId === userId)) {
                trades.push(trade);
            }
        }

        // Sort by timestamp (newest first)
        trades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return trades;
    }

    /**
     * Get platform statistics
     * @returns {object} - Platform stats
     */
    getPlatformStats() {
        const db = getDatabase();
        
        let totalTrades = 0;
        let totalVolume = 0;
        let totalFees = 0;

        for (const trade of db.data.tradeHistory.values()) {
            if (trade.status === 'completed') {
                totalTrades++;
                totalVolume += trade.price;
                totalFees += trade.platformFee;
            }
        }

        return {
            totalTrades,
            totalVolume,
            totalFeesCollected: totalFees,
            averageTradePrice: totalTrades > 0 ? Math.floor(totalVolume / totalTrades) : 0
        };
    }
}

// Singleton instance
let escrowManagerInstance = null;

function getEscrowManager() {
    if (!escrowManagerInstance) {
        escrowManagerInstance = new EscrowManager();
    }
    return escrowManagerInstance;
}

module.exports = { EscrowManager, getEscrowManager };

