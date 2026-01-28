// ==========================================
// 🛒 Marketplace Handler
// ==========================================
// Manages marketplace listings, offers, and purchases

const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');
const { getEscrowManager } = require('../utils/escrowManager');
const { getNFTHandler } = require('./nftHandler');
const { getQuestProgressTracker } = require('../utils/questProgressTracker');

class MarketHandler {
    constructor() {
        this.escrowManager = getEscrowManager();
        this.nftHandler = getNFTHandler();
    }

    /**
     * Get all active marketplace listings
     * @param {object} filters - { type, rarity, minPrice, maxPrice }
     * @returns {Array} - Filtered listings
     */
    getListings(filters = {}) {
        const db = getDatabase();
        let listings = [];

        // Get all active listings
        for (const [listingId, listing] of db.data.marketplaceListings.entries()) {
            if (listing.status === 'active') {
                listings.push(listing);
            }
        }

        // Apply filters
        if (filters.type) {
            listings = listings.filter(l => l.itemType === filters.type);
        }

        if (filters.rarity) {
            listings = listings.filter(l => l.rarity === filters.rarity);
        }

        if (filters.minPrice !== undefined) {
            listings = listings.filter(l => l.price >= filters.minPrice);
        }

        if (filters.maxPrice !== undefined) {
            listings = listings.filter(l => l.price <= filters.maxPrice);
        }

        // Sort by price (ascending by default)
        listings.sort((a, b) => a.price - b.price);

        return listings;
    }

    /**
     * Get listing by ID
     * @param {string} listingId - Listing ID
     * @returns {object} - Listing data
     */
    getListing(listingId) {
        const db = getDatabase();
        return db.data.marketplaceListings.get(listingId);
    }

    /**
     * Purchase NFT from marketplace with escrow protection
     * @param {string} buyerId - Buyer's user ID
     * @param {string} listingId - Listing ID
     * @returns {object} - Purchase result
     */
    async purchaseListing(buyerId, listingId) {
        return await this.escrowManager.completePurchase(buyerId, listingId);
    }

    /**
     * Cancel a marketplace listing
     * @param {string} userId - User ID (must be seller)
     * @param {string} listingId - Listing ID
     * @returns {object} - Cancellation result
     */
    async cancelListing(userId, listingId) {
        const db = getDatabase();
        const listing = this.getListing(listingId);

        if (!listing) {
            throw new Error('Listing bulunamadı!');
        }

        if (listing.sellerId !== userId) {
            throw new Error('Bu listing size ait değil!');
        }

        if (listing.status !== 'active') {
            throw new Error('Bu listing zaten aktif değil!');
        }

        // Mark as cancelled
        listing.status = 'cancelled';
        listing.cancelledAt = new Date().toISOString();
        db.data.marketplaceListings.set(listingId, listing);

        // Also remove from nftListings
        db.data.nftListings.delete(listingId);

        db.saveData();

        logger.info(`[Marketplace] Listing ${listingId} cancelled by ${userId}`);

        return {
            success: true,
            listing
        };
    }

    /**
     * Make an offer on a listing
     * @param {string} buyerId - Buyer's user ID
     * @param {string} listingId - Listing ID
     * @param {number} offerAmount - Offer amount
     * @returns {object} - Offer result
     */
    async makeOffer(buyerId, listingId, offerAmount) {
        const db = getDatabase();
        const listing = this.getListing(listingId);

        if (!listing) {
            throw new Error('Listing bulunamadı!');
        }

        if (listing.status !== 'active') {
            throw new Error('Bu listing artık aktif değil!');
        }

        if (listing.sellerId === buyerId) {
            throw new Error('Kendi listinginize teklif veremezsiniz!');
        }

        if (offerAmount >= listing.price) {
            throw new Error(`Teklif miktarı satış fiyatından düşük olmalı! (Max: ${(listing.price - 1).toLocaleString()} NRC)`);
        }

        if (offerAmount < listing.price * 0.5) {
            throw new Error(`Teklif çok düşük! Minimum: ${Math.floor(listing.price * 0.5).toLocaleString()} NRC (fiyatın %50'si)`);
        }

        // Check if user already made an offer
        if (!listing.offers) {
            listing.offers = [];
        }

        const existingOfferIndex = listing.offers.findIndex(o => o.buyerId === buyerId && o.status === 'pending');
        
        if (existingOfferIndex !== -1) {
            // Update existing offer
            listing.offers[existingOfferIndex].amount = offerAmount;
            listing.offers[existingOfferIndex].updatedAt = new Date().toISOString();
        } else {
            // Create new offer
            listing.offers.push({
                offerId: `offer_${Date.now()}_${buyerId}`,
                buyerId,
                amount: offerAmount,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
        }

        db.data.marketplaceListings.set(listingId, listing);
        db.saveData();

        logger.info(`[Marketplace] Offer made: ${buyerId} offered ${offerAmount} NRC for ${listingId}`);

        return {
            success: true,
            offer: listing.offers[listing.offers.length - 1]
        };
    }

    /**
     * Accept an offer (seller only)
     * @param {string} sellerId - Seller's user ID
     * @param {string} listingId - Listing ID
     * @param {string} offerId - Offer ID
     * @returns {object} - Accept result
     */
    async acceptOffer(sellerId, listingId, offerId) {
        const db = getDatabase();
        const listing = this.getListing(listingId);

        if (!listing) {
            throw new Error('Listing bulunamadı!');
        }

        if (listing.sellerId !== sellerId) {
            throw new Error('Bu listing size ait değil!');
        }

        if (listing.status !== 'active') {
            throw new Error('Bu listing artık aktif değil!');
        }

        const offer = listing.offers?.find(o => o.offerId === offerId);

        if (!offer) {
            throw new Error('Teklif bulunamadı!');
        }

        if (offer.status !== 'pending') {
            throw new Error('Bu teklif artık geçerli değil!');
        }

        // Update listing price to offer amount
        listing.price = offer.amount;
        offer.status = 'accepted';
        offer.acceptedAt = new Date().toISOString();

        db.data.marketplaceListings.set(listingId, listing);
        db.saveData();

        // Complete purchase at offer price
        const purchaseResult = await this.purchaseListing(offer.buyerId, listingId);

        logger.info(`[Marketplace] Offer accepted: ${listingId} sold to ${offer.buyerId} for ${offer.amount} NRC`);

        return {
            success: true,
            purchaseResult,
            offer
        };
    }

    /**
     * Reject an offer (seller only)
     * @param {string} sellerId - Seller's user ID
     * @param {string} listingId - Listing ID
     * @param {string} offerId - Offer ID
     * @returns {object} - Reject result
     */
    async rejectOffer(sellerId, listingId, offerId) {
        const db = getDatabase();
        const listing = this.getListing(listingId);

        if (!listing) {
            throw new Error('Listing bulunamadı!');
        }

        if (listing.sellerId !== sellerId) {
            throw new Error('Bu listing size ait değil!');
        }

        const offer = listing.offers?.find(o => o.offerId === offerId);

        if (!offer) {
            throw new Error('Teklif bulunamadı!');
        }

        offer.status = 'rejected';
        offer.rejectedAt = new Date().toISOString();

        db.data.marketplaceListings.set(listingId, listing);
        db.saveData();

        logger.info(`[Marketplace] Offer rejected: ${offerId} for listing ${listingId}`);

        return {
            success: true,
            offer
        };
    }

    /**
     * Get user's marketplace listings
     * @param {string} userId - User ID
     * @param {string} status - 'active' | 'sold' | 'cancelled' | 'all'
     * @returns {Array} - User's listings
     */
    getUserListings(userId, status = 'all') {
        const db = getDatabase();
        const listings = [];

        for (const listing of db.data.marketplaceListings.values()) {
            if (listing.sellerId === userId) {
                if (status === 'all' || listing.status === status) {
                    listings.push(listing);
                }
            }
        }

        // Sort by creation date (newest first)
        listings.sort((a, b) => new Date(b.listedAt) - new Date(a.listedAt));

        return listings;
    }

    /**
     * Create marketplace browse embed
     * @param {Array} listings - Listings to display
     * @param {number} page - Page number (for pagination)
     * @returns {EmbedBuilder} - Embed
     */
    createBrowseEmbed(listings, page = 0) {
        const itemsPerPage = 10;
        const startIndex = page * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageListings = listings.slice(startIndex, endIndex);
        const totalPages = Math.ceil(listings.length / itemsPerPage);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🛒 Marketplace')
            .setDescription(`Toplam **${listings.length}** NFT satışta!`)
            .setTimestamp();

        if (pageListings.length === 0) {
            embed.setDescription('❌ Aktif listing bulunamadı!');
            return embed;
        }

        for (const listing of pageListings) {
            const rarityEmoji = this.nftHandler.getRarityEmoji(listing.rarity);
            
            embed.addFields({
                name: `${rarityEmoji} ${listing.itemName}`,
                value: [
                    `💰 **${listing.price.toLocaleString()} NRC**`,
                    `🎨 ${listing.rarity.toUpperCase()}`,
                    `👤 Satıcı: <@${listing.sellerId}>`,
                    `🆔 \`${listing.listingId}\``,
                    listing.offers && listing.offers.length > 0 
                        ? `📬 ${listing.offers.filter(o => o.status === 'pending').length} teklif`
                        : ''
                ].filter(Boolean).join('\n'),
                inline: true
            });
        }

        if (totalPages > 1) {
            embed.setFooter({ 
                text: `Sayfa ${page + 1}/${totalPages} • Satın almak için: /nrc market satın-al` 
            });
        } else {
            embed.setFooter({ text: 'Satın almak için: /nrc market satın-al' });
        }

        return embed;
    }
}

// Singleton instance
let marketHandlerInstance = null;

function getMarketHandler() {
    if (!marketHandlerInstance) {
        marketHandlerInstance = new MarketHandler();
    }
    return marketHandlerInstance;
}

module.exports = { MarketHandler, getMarketHandler };

