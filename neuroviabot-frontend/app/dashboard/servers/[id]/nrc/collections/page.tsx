'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import './collections.scss';

interface NFTItem {
    id: string;
    name: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    price: number;
    description?: string;
}

interface NFTCollection {
    id: string;
    name: string;
    type: string;
    items: NFTItem[];
    totalSupply: number;
}

interface UserCollection {
    ownedItems: Array<{
        collectionId: string;
        itemId: string;
        acquiredAt: string;
    }>;
    favoriteItem: string | null;
    totalValue: number;
}

export default function NFTCollections() {
    const params = useParams();
    const serverId = params?.id as string;

    const [collections, setCollections] = useState<NFTCollection[]>([]);
    const [userCollection, setUserCollection] = useState<UserCollection | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'browse' | 'inventory'>('browse');

    useEffect(() => {
        fetchCollections();
        fetchUserCollection();
    }, [serverId]);

    const fetchCollections = async () => {
        try {
            const response = await fetch('/api/nrc/collections');
            if (response.ok) {
                const data = await response.json();
                setCollections(data.collections || []);
                if (data.collections && data.collections.length > 0) {
                    setSelectedCollection(data.collections[0]);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching collections:', error);
            setLoading(false);
        }
    };

    const fetchUserCollection = async () => {
        try {
            // This would use actual user ID
            const userId = 'USER_ID_HERE';
            const response = await fetch(`/api/nrc/collections/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserCollection(data.collection);
            }
        } catch (error) {
            console.error('Error fetching user collection:', error);
        }
    };

    const getRarityColor = (rarity: string) => {
        const colors = {
            common: '#95A5A6',
            rare: '#3498DB',
            epic: '#9B59B6',
            legendary: '#FFD700'
        };
        return colors[rarity as keyof typeof colors] || colors.common;
    };

    const getRarityEmoji = (rarity: string) => {
        const emojis = {
            common: '⚪',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };
        return emojis[rarity as keyof typeof emojis] || '⚪';
    };

    const handlePurchase = async (collectionId: string, itemId: string) => {
        try {
            const response = await fetch('/api/nrc/collections/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'USER_ID_HERE',
                    collectionId,
                    itemId
                })
            });

            if (response.ok) {
                alert('NFT başarıyla satın alındı!');
                fetchUserCollection();
            } else {
                const data = await response.json();
                alert(`Hata: ${data.error}`);
            }
        } catch (error) {
            console.error('Error purchasing NFT:', error);
            alert('Satın alma sırasında bir hata oluştu!');
        }
    };

    if (loading) {
        return (
            <div className="nft-collections">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>NFT Koleksiyonları Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="nft-collections">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>🎨 NFT Koleksiyonları</h1>
                <p>Özel dijital koleksiyonlar keşfedin ve satın alın</p>
            </motion.div>

            <div className="tab-buttons">
                <button
                    className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
                    onClick={() => setActiveTab('browse')}
                >
                    🔍 Koleksiyonlar
                </button>
                <button
                    className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    🎒 Envanter
                </button>
            </div>

            {activeTab === 'browse' && (
                <div className="browse-section">
                    <div className="collection-selector">
                        {collections.map((collection) => (
                            <button
                                key={collection.id}
                                className={`collection-button ${selectedCollection?.id === collection.id ? 'active' : ''}`}
                                onClick={() => setSelectedCollection(collection)}
                            >
                                {collection.name}
                                <span className="collection-count">({collection.items.length})</span>
                            </button>
                        ))}
                    </div>

                    {selectedCollection && (
                        <motion.div
                            className="items-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={selectedCollection.id}
                        >
                            {selectedCollection.items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    className="nft-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    style={{ borderColor: getRarityColor(item.rarity) }}
                                >
                                    <div className="nft-rarity">
                                        {getRarityEmoji(item.rarity)} {item.rarity.toUpperCase()}
                                    </div>
                                    <h3 className="nft-name">{item.name}</h3>
                                    {item.description && (
                                        <p className="nft-description">{item.description}</p>
                                    )}
                                    <div className="nft-footer">
                                        <div className="nft-price">
                                            💰 {item.price.toLocaleString()} NRC
                                        </div>
                                        <button
                                            className="purchase-button"
                                            onClick={() => handlePurchase(selectedCollection.id, item.id)}
                                        >
                                            Satın Al
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {collections.length === 0 && (
                        <div className="empty-state">
                            <p>Henüz NFT koleksiyonu bulunmuyor.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="inventory-section">
                    {userCollection && userCollection.ownedItems.length > 0 ? (
                        <>
                            <div className="inventory-stats">
                                <div className="stat-card">
                                    <span className="stat-label">Sahip Olunan NFT</span>
                                    <span className="stat-value">{userCollection.ownedItems.length}</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Toplam Değer</span>
                                    <span className="stat-value">{userCollection.totalValue.toLocaleString()} NRC</span>
                                </div>
                            </div>

                            <div className="owned-items-grid">
                                {userCollection.ownedItems.map((ownedItem, index) => (
                                    <motion.div
                                        key={`${ownedItem.collectionId}_${ownedItem.itemId}`}
                                        className="owned-item-card"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="owned-item-header">
                                            <h4>{ownedItem.itemId}</h4>
                                            {ownedItem.itemId === userCollection.favoriteItem && (
                                                <span className="favorite-badge">⭐</span>
                                            )}
                                        </div>
                                        <p className="acquired-date">
                                            Edinme: {new Date(ownedItem.acquiredAt).toLocaleDateString('tr-TR')}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>Henüz NFT'niz yok.</p>
                            <button onClick={() => setActiveTab('browse')}>
                                Koleksiyonlara Göz At
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

