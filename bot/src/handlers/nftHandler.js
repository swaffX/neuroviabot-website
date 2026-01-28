// ==========================================
// 🎨 NFT/Collection Handler
// ==========================================
// Manages NFT collections, purchases, and user inventories

const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class NFTHandler {
    constructor() {
        this.rarityColors = {
            common: '#95A5A6',
            rare: '#3498DB',
            epic: '#9B59B6',
            legendary: '#F39C12'
        };

        this.rarityMultipliers = {
            common: 1,
            rare: 2.5,
            epic: 5,
            legendary: 10
        };

        // Initialize default collections
        this.initializeCollections();
    }

    // Initialize default NFT collections
    initializeCollections() {
        const db = getDatabase();

        // Avatar Frames Collection
        if (!db.data.nftCollections.has('avatar_frames_01')) {
            db.data.nftCollections.set('avatar_frames_01', {
                id: 'avatar_frames_01',
                name: 'Avatar Çerçeveleri - Sezon 1',
                type: 'avatar_frame',
                description: 'Özel avatar çerçeveleri koleksiyonu',
                items: [
                    { id: 'frame_neon_blue', name: 'Neon Mavi Çerçeve', rarity: 'common', price: 100, emoji: '🔵' },
                    { id: 'frame_cyber_purple', name: 'Cyber Mor Çerçeve', rarity: 'rare', price: 500, emoji: '🟣' },
                    { id: 'frame_golden_aura', name: 'Altın Aura Çerçeve', rarity: 'epic', price: 2000, emoji: '🟡' },
                    { id: 'frame_legendary_fire', name: 'Efsanevi Ateş Çerçevesi', rarity: 'legendary', price: 5000, emoji: '🔥' }
                ],
                totalSupply: 1000,
                currentSupply: 0
            });
        }

        // Trading Cards Collection
        if (!db.data.nftCollections.has('trading_cards_01')) {
            db.data.nftCollections.set('trading_cards_01', {
                id: 'trading_cards_01',
                name: 'NeuroBot Trading Cards - Sezon 1',
                type: 'card',
                description: 'Koleksiyonluk bot karakterleri',
                items: [
                    { id: 'card_moderator', name: 'Moderator Bot', rarity: 'common', price: 50, emoji: '🛡️' },
                    { id: 'card_developer', name: 'Developer Bot', rarity: 'rare', price: 300, emoji: '💻' },
                    { id: 'card_premium', name: 'Premium Elite Bot', rarity: 'epic', price: 1500, emoji: '👑' },
                    { id: 'card_founder', name: 'Founder Edition Bot', rarity: 'legendary', price: 10000, emoji: '⭐' }
                ],
                totalSupply: 500,
                currentSupply: 0
            });
        }

        // Badges Collection
        if (!db.data.nftCollections.has('badges_achievements')) {
            db.data.nftCollections.set('badges_achievements', {
                id: 'badges_achievements',
                name: 'Achievement Rozetleri',
                type: 'badge',
                description: 'Özel başarı rozetleri',
                items: [
                    { id: 'badge_first_purchase', name: 'İlk Alışveriş Rozeti', rarity: 'common', price: 0, emoji: '🛒', unlockCondition: 'first_nft_purchase' },
                    { id: 'badge_collector', name: 'Koleksiyoncu Rozeti', rarity: 'rare', price: 0, emoji: '📚', unlockCondition: 'own_10_nfts' },
                    { id: 'badge_whale', name: 'Whale Rozeti', rarity: 'epic', price: 0, emoji: '🐋', unlockCondition: 'spend_50000_nrc' },
                    { id: 'badge_legendary_trader', name: 'Efsanevi Tüccar', rarity: 'legendary', price: 0, emoji: '💎', unlockCondition: 'own_legendary_nft' }
                ],
                totalSupply: -1, // Unlimited for achievements
                currentSupply: 0
            });
        }

        // Profile Items Collection
        if (!db.data.nftCollections.has('profile_items_01')) {
            db.data.nftCollections.set('profile_items_01', {
                id: 'profile_items_01',
                name: 'Profil Özelleştirme',
                type: 'profile_item',
                description: 'Profil görünümünü özelleştir',
                items: [
                    { id: 'theme_dark_purple', name: 'Koyu Mor Tema', rarity: 'common', price: 200, emoji: '🎨' },
                    { id: 'theme_cyber_neon', name: 'Cyber Neon Tema', rarity: 'rare', price: 750, emoji: '✨' },
                    { id: 'theme_galaxy', name: 'Galaksi Teması', rarity: 'epic', price: 3000, emoji: '🌌' },
                    { id: 'theme_ultimate', name: 'Ultimate Premium Tema', rarity: 'legendary', price: 8000, emoji: '🌟' }
                ],
                totalSupply: 2000,
                currentSupply: 0
            });
        }

        db.saveData();
        logger.success('[NFTHandler] Default collections initialized');
    }

    // Get all collections
    getAllCollections() {
        const db = getDatabase();
        return Array.from(db.data.nftCollections.values());
    }

    // Get collection by ID
    getCollection(collectionId) {
        const db = getDatabase();
        return db.data.nftCollections.get(collectionId);
    }

    // Get user's collection
    getUserCollection(userId) {
        const db = getDatabase();
        
        if (!db.data.userCollections.has(userId)) {
            db.data.userCollections.set(userId, {
                ownedItems: [],
                favoriteItem: null,
                totalValue: 0,
                totalPurchases: 0
            });
            db.saveData();
        }

        return db.data.userCollections.get(userId);
    }

    // Purchase NFT
    async purchaseNFT(userId, collectionId, itemId) {
        const db = getDatabase();
        const collection = this.getCollection(collectionId);

        if (!collection) {
            throw new Error('Koleksiyon bulunamadı!');
        }

        const item = collection.items.find(i => i.id === itemId);
        if (!item) {
            throw new Error('Item bulunamadı!');
        }

        // Check if it's an achievement badge (price 0, unlockCondition required)
        if (item.price === 0 && item.unlockCondition) {
            throw new Error('Bu rozet satın alınamaz! Özel koşulları tamamlayarak kazanılır.');
        }

        // Check supply limit
        if (collection.totalSupply > 0 && collection.currentSupply >= collection.totalSupply) {
            throw new Error('Bu koleksiyonun stoğu tükenmiş!');
        }

        // Check user balance
        const balance = db.getNeuroCoinBalance(userId);
        if (balance.wallet < item.price) {
            throw new Error(`Yetersiz NRC! Gerekli: ${item.price} NRC, Mevcut: ${balance.wallet} NRC`);
        }

        // Check if user already owns this item
        const userCollection = this.getUserCollection(userId);
        const alreadyOwned = userCollection.ownedItems.some(
            owned => owned.collectionId === collectionId && owned.itemId === itemId
        );

        if (alreadyOwned) {
            throw new Error('Bu NFT\'ye zaten sahipsiniz!');
        }

        // Deduct NRC
        db.addNeuroCoin(userId, -item.price, 'nft_purchase', {
            collectionId,
            itemId,
            itemName: item.name,
            rarity: item.rarity
        });

        // Add to user's collection
        userCollection.ownedItems.push({
            collectionId,
            itemId,
            itemName: item.name,
            rarity: item.rarity,
            purchasePrice: item.price,
            acquiredAt: new Date().toISOString(),
            acquiredMethod: 'purchase'
        });

        userCollection.totalValue += item.price;
        userCollection.totalPurchases += 1;

        // Update collection supply
        collection.currentSupply += 1;

        db.saveData();

        // Track activity
        try {
            const { trackNFTPurchase } = require('../utils/activityTracker');
            // Get user and server info from Discord client if available
            const client = global.discordClient;
            let username = `User${userId.substring(0, 8)}`;
            let serverId = null;
            let serverName = null;

            if (client) {
                try {
                    const user = await client.users.fetch(userId).catch(() => null);
                    if (user) username = user.username;
                } catch (e) {}
            }

            await trackNFTPurchase({
                userId,
                username,
                serverId,
                serverName,
                itemName: item.name,
                itemType: collection.type,
                amount: item.price,
                rarity: item.rarity
            });
        } catch (error) {
            // Silent fail for activity tracking
            logger.debug('[NFTHandler] Activity tracking failed:', error);
        }

        // Check for achievement unlocks
        await this.checkAchievementUnlocks(userId, userCollection);

        logger.info(`[NFTHandler] ${userId} purchased ${item.name} for ${item.price} NRC`);

        return {
            success: true,
            item,
            newBalance: db.getNeuroCoinBalance(userId)
        };
    }

    // Check and unlock achievement badges
    async checkAchievementUnlocks(userId, userCollection) {
        const db = getDatabase();
        const badgesCollection = this.getCollection('badges_achievements');

        if (!badgesCollection) return;

        for (const badge of badgesCollection.items) {
            // Check if already owned
            const alreadyOwned = userCollection.ownedItems.some(
                owned => owned.collectionId === 'badges_achievements' && owned.itemId === badge.id
            );

            if (alreadyOwned) continue;

            let unlocked = false;

            // Check unlock conditions
            switch (badge.unlockCondition) {
                case 'first_nft_purchase':
                    unlocked = userCollection.totalPurchases >= 1;
                    break;
                    
                case 'own_10_nfts':
                    unlocked = userCollection.ownedItems.length >= 10;
                    break;
                    
                case 'spend_50000_nrc':
                    unlocked = userCollection.totalValue >= 50000;
                    break;
                    
                case 'own_legendary_nft':
                    unlocked = userCollection.ownedItems.some(item => item.rarity === 'legendary');
                    break;
            }

            // Grant badge
            if (unlocked) {
                userCollection.ownedItems.push({
                    collectionId: 'badges_achievements',
                    itemId: badge.id,
                    itemName: badge.name,
                    rarity: badge.rarity,
                    purchasePrice: 0,
                    acquiredAt: new Date().toISOString(),
                    acquiredMethod: 'achievement'
                });

                logger.info(`[NFTHandler] ${userId} unlocked achievement badge: ${badge.name}`);
            }
        }

        db.saveData();
    }

    // List NFT on marketplace
    async listNFTForSale(userId, collectionId, itemId, price) {
        const db = getDatabase();
        const userCollection = this.getUserCollection(userId);

        // Check ownership
        const ownedItem = userCollection.ownedItems.find(
            item => item.collectionId === collectionId && item.itemId === itemId
        );

        if (!ownedItem) {
            throw new Error('Bu NFT\'ye sahip değilsiniz!');
        }

        // Check if already listed
        const existingListing = Array.from(db.data.nftListings.values()).find(
            listing => listing.sellerId === userId && 
                      listing.collectionId === collectionId && 
                      listing.itemId === itemId &&
                      listing.status === 'active'
        );

        if (existingListing) {
            throw new Error('Bu NFT zaten satışta!');
        }

        // Create listing
        const listingId = `nft_${Date.now()}_${userId}`;
        db.data.nftListings.set(listingId, {
            listingId,
            sellerId: userId,
            itemType: 'nft',
            collectionId,
            itemId,
            itemName: ownedItem.itemName,
            rarity: ownedItem.rarity,
            price,
            listedAt: new Date().toISOString(),
            status: 'active'
        });

        db.saveData();

        logger.info(`[NFTHandler] ${userId} listed ${ownedItem.itemName} for ${price} NRC`);

        return { success: true, listingId };
    }

    // Get rarity color
    getRarityColor(rarity) {
        return this.rarityColors[rarity] || '#95A5A6';
    }

    // Get rarity emoji
    getRarityEmoji(rarity) {
        const emojis = {
            common: '⚪',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };
        return emojis[rarity] || '⚪';
    }

    // Format collection embed
    createCollectionEmbed(collection) {
        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`${collection.name}`)
            .setDescription(collection.description)
            .setTimestamp();

        if (collection.totalSupply > 0) {
            embed.addFields({
                name: '📦 Stok',
                value: `${collection.currentSupply}/${collection.totalSupply}`,
                inline: true
            });
        }

        // Group items by rarity
        const itemsByRarity = {
            common: [],
            rare: [],
            epic: [],
            legendary: []
        };

        collection.items.forEach(item => {
            itemsByRarity[item.rarity].push(item);
        });

        // Add fields for each rarity
        for (const [rarity, items] of Object.entries(itemsByRarity)) {
            if (items.length > 0) {
                const rarityEmoji = this.getRarityEmoji(rarity);
                const itemList = items.map(item => {
                    const priceText = item.price > 0 ? `${item.price.toLocaleString()} NRC` : 'Achievement';
                    return `${item.emoji} **${item.name}** - ${priceText}`;
                }).join('\n');

                embed.addFields({
                    name: `${rarityEmoji} ${rarity.toUpperCase()}`,
                    value: itemList,
                    inline: false
                });
            }
        }

        return embed;
    }

    // Format user inventory embed
    createInventoryEmbed(userId, username) {
        const userCollection = this.getUserCollection(userId);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`${username} - NFT Koleksiyonu`)
            .setTimestamp();

        if (userCollection.ownedItems.length === 0) {
            embed.setDescription('❌ Henüz NFT koleksiyonunuz yok!\n`/nrc koleksiyon liste` komutuyla koleksiyonlara göz atın.');
            return embed;
        }

        // Stats
        embed.addFields({
            name: '📊 İstatistikler',
            value: [
                `📦 Toplam NFT: **${userCollection.ownedItems.length}**`,
                `💰 Toplam Değer: **${userCollection.totalValue.toLocaleString()} NRC**`,
                `🛒 Satın Alma: **${userCollection.totalPurchases}**`
            ].join('\n'),
            inline: false
        });

        // Group by rarity
        const byRarity = {
            legendary: 0,
            epic: 0,
            rare: 0,
            common: 0
        };

        userCollection.ownedItems.forEach(item => {
            byRarity[item.rarity]++;
        });

        const rarityText = Object.entries(byRarity)
            .filter(([_, count]) => count > 0)
            .map(([rarity, count]) => `${this.getRarityEmoji(rarity)} ${rarity}: ${count}`)
            .join('\n');

        if (rarityText) {
            embed.addFields({
                name: '🎨 Nadirliklere Göre',
                value: rarityText,
                inline: true
            });
        }

        // Show last 5 acquired items
        const recentItems = userCollection.ownedItems.slice(-5).reverse();
        const recentText = recentItems.map(item => 
            `${this.getRarityEmoji(item.rarity)} ${item.itemName}`
        ).join('\n');

        embed.addFields({
            name: '🆕 Son Kazanılanlar',
            value: recentText || 'Yok',
            inline: true
        });

        return embed;
    }
}

// Singleton instance
let nftHandlerInstance = null;

function getNFTHandler() {
    if (!nftHandlerInstance) {
        nftHandlerInstance = new NFTHandler();
    }
    return nftHandlerInstance;
}

module.exports = { NFTHandler, getNFTHandler };

