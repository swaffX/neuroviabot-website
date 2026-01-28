'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSocket } from '@/hooks/useSocket';

// Types
interface PriceData {
  current: number;
  change24h: number;
  changePercent: number;
}

interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

interface MarketData {
  volume24h: number;
  totalTrades: number;
  circulation: number;
  marketCap: number;
  activeTraders: number;
}

interface UserStats {
  balance: number;
  todayEarnings: number;
  totalTrades: number;
  rank: number;
  level: number;
}

interface NRCContextType {
  // Price data
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent: number;
  priceHistory: PriceHistoryPoint[];
  
  // Market data
  marketData: MarketData | null;
  
  // User data
  userBalance: number;
  userStats: UserStats | null;
  
  // Loading states
  isLoading: boolean;
  
  // Functions
  refreshPrice: () => Promise<void>;
  refreshUserBalance: () => Promise<void>;
  refreshMarketData: () => Promise<void>;
}

const NRCContext = createContext<NRCContextType | undefined>(undefined);

// Provider Props
interface NRCProviderProps {
  children: ReactNode;
}

export function NRCProvider({ children }: NRCProviderProps) {
  // State
  const [currentPrice, setCurrentPrice] = useState<number>(1.0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Socket connection
  const socket = useSocket();

  // Fetch current price
  const refreshPrice = async () => {
    try {
      const response = await fetch('/api/nrc/price/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentPrice(data.price || 1.0);
        setPriceChange24h(data.change24h || 0);
        setPriceChangePercent(data.changePercent || 0);
      }
    } catch (error) {
      console.error('[NRC] Failed to fetch price:', error);
    }
  };

  // Fetch price history
  const fetchPriceHistory = async (period: '24h' | '7d' | '30d' = '24h') => {
    try {
      const response = await fetch(`/api/nrc/price/history?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setPriceHistory(data.history || []);
      }
    } catch (error) {
      console.error('[NRC] Failed to fetch price history:', error);
    }
  };

  // Fetch market data
  const refreshMarketData = async () => {
    try {
      const response = await fetch('/api/nrc/price/stats');
      if (response.ok) {
        const data = await response.json();
        setMarketData({
          volume24h: data.volume24h || 0,
          totalTrades: data.totalTrades || 0,
          circulation: data.circulation || 0,
          marketCap: data.marketCap || 0,
          activeTraders: data.activeTraders || 0,
        });
      }
    } catch (error) {
      console.error('[NRC] Failed to fetch market data:', error);
    }
  };

  // Fetch user balance
  const refreshUserBalance = async () => {
    try {
      // This would fetch from your user API endpoint
      // For now, using placeholder
      const response = await fetch('/api/user/balance');
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.nrcBalance || 0);
        
        if (data.stats) {
          setUserStats({
            balance: data.nrcBalance || 0,
            todayEarnings: data.stats.todayEarnings || 0,
            totalTrades: data.stats.totalTrades || 0,
            rank: data.stats.rank || 0,
            level: data.stats.level || 1,
          });
        }
      }
    } catch (error) {
      console.error('[NRC] Failed to fetch user balance:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([
        refreshPrice(),
        fetchPriceHistory('24h'),
        refreshMarketData(),
        refreshUserBalance(),
      ]);
      setIsLoading(false);
    };

    initializeData();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for price updates
    socket.on('nrc_price_updated', (data: { price: number; change24h: number; changePercent: number }) => {
      console.log('[NRC] Price updated:', data);
      setCurrentPrice(data.price);
      setPriceChange24h(data.change24h);
      setPriceChangePercent(data.changePercent);
    });

    // Listen for balance updates
    socket.on('nrc_balance_updated', (data: { balance: number }) => {
      console.log('[NRC] Balance updated:', data);
      setUserBalance(data.balance);
      
      // Update user stats balance
      setUserStats(prev => prev ? { ...prev, balance: data.balance } : null);
    });

    // Listen for market data updates
    socket.on('nrc_market_updated', (data: MarketData) => {
      console.log('[NRC] Market data updated:', data);
      setMarketData(data);
    });

    // Cleanup
    return () => {
      socket.off('nrc_price_updated');
      socket.off('nrc_balance_updated');
      socket.off('nrc_market_updated');
    };
  }, [socket]);

  // Context value
  const value: NRCContextType = {
    currentPrice,
    priceChange24h,
    priceChangePercent,
    priceHistory,
    marketData,
    userBalance,
    userStats,
    isLoading,
    refreshPrice,
    refreshUserBalance,
    refreshMarketData,
  };

  return <NRCContext.Provider value={value}>{children}</NRCContext.Provider>;
}

// Custom hooks for consuming context
export function useNRC() {
  const context = useContext(NRCContext);
  if (context === undefined) {
    throw new Error('useNRC must be used within an NRCProvider');
  }
  return context;
}

// Specific hooks for different data
export function useNRCPrice() {
  const { currentPrice, priceChange24h, priceChangePercent, refreshPrice } = useNRC();
  return { currentPrice, priceChange24h, priceChangePercent, refreshPrice };
}

export function useNRCBalance() {
  const { userBalance, refreshUserBalance } = useNRC();
  return { userBalance, refreshUserBalance };
}

export function useNRCStats() {
  const { marketData, userStats, refreshMarketData } = useNRC();
  return { marketData, userStats, refreshMarketData };
}

// Alias for compatibility
export const useNRCCoin = useNRC;

