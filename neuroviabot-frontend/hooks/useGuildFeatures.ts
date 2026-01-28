'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export interface GuildFeatures {
  // Core Features
  welcome: {
    enabled: boolean;
    configured: boolean;
  };
  moderation: {
    enabled: boolean;
    autoMod: boolean;
    warnings: boolean;
  };
  leveling: {
    enabled: boolean;
    xpSystem: boolean;
    roleRewards: boolean;
  };
  economy: {
    enabled: boolean;
    nrcCoins: boolean;
    serverCurrency: boolean;
  };
  // Advanced Features
  serverStats: {
    enabled: boolean;
    channelsCreated: boolean;
    autoUpdate: boolean;
  };
  auditLog: {
    enabled: boolean;
    logChannel: string | null;
  };
  reactionRoles: {
    enabled: boolean;
    panels: number;
  };
  automation: {
    enabled: boolean;
    autoRole: boolean;
    scheduled: boolean;
  };
  backup: {
    enabled: boolean;
    backupCount: number;
  };
  security: {
    enabled: boolean;
    guard: boolean;
    verification: boolean;
  };
  premium: {
    active: boolean;
    tier: string | null;
    features: string[];
  };
}

interface UseGuildFeaturesReturn {
  features: GuildFeatures | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isFeatureEnabled: (featurePath: string) => boolean;
}

const defaultFeatures: GuildFeatures = {
  welcome: { enabled: false, configured: false },
  moderation: { enabled: false, autoMod: false, warnings: false },
  leveling: { enabled: false, xpSystem: false, roleRewards: false },
  economy: { enabled: false, nrcCoins: false, serverCurrency: false },
  serverStats: { enabled: false, channelsCreated: false, autoUpdate: false },
  auditLog: { enabled: false, logChannel: null },
  reactionRoles: { enabled: false, panels: 0 },
  automation: { enabled: false, autoRole: false, scheduled: false },
  backup: { enabled: false, backupCount: 0 },
  security: { enabled: false, guard: false, verification: false },
  premium: { active: false, tier: null, features: [] },
};

/**
 * useGuildFeatures Hook
 * 
 * Automatically detects and monitors all enabled features for a guild.
 * Real-time updates via Socket.IO when features are toggled.
 * 
 * @param guildId - Discord Guild ID
 * @returns { features, loading, error, refresh, isFeatureEnabled }
 */
export function useGuildFeatures(guildId: string): UseGuildFeaturesReturn {
  const [features, setFeatures] = useState<GuildFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, on, off } = useSocket();

  const fetchFeatures = useCallback(async () => {
    if (!guildId) {
      setError('No guild ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/guilds/${guildId}/features`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch features: ${response.statusText}`);
      }

      const data = await response.json();
      setFeatures(data.features || defaultFeatures);
    } catch (err) {
      console.error('[useGuildFeatures] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set default features on error
      setFeatures(defaultFeatures);
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  // Initial fetch
  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket || !guildId) return;

    const handleFeatureToggled = (data: any) => {
      if (data.guildId === guildId) {
        console.log('[useGuildFeatures] Feature toggled:', data);
        // Refresh features
        fetchFeatures();
      }
    };

    const handleSettingsUpdated = (data: any) => {
      if (data.guildId === guildId) {
        console.log('[useGuildFeatures] Settings updated:', data);
        // Refresh features
        fetchFeatures();
      }
    };

    // Join guild room for real-time updates
    socket.emit('join_guild', guildId);

    // Listen to feature updates
    on('feature_toggled', handleFeatureToggled);
    on('settings_updated', handleSettingsUpdated);
    on('server_stats_toggled', handleFeatureToggled);
    on('server_stats_settings_updated', handleSettingsUpdated);

    return () => {
      socket.emit('leave_guild', guildId);
      off('feature_toggled', handleFeatureToggled);
      off('settings_updated', handleSettingsUpdated);
      off('server_stats_toggled', handleFeatureToggled);
      off('server_stats_settings_updated', handleSettingsUpdated);
    };
  }, [socket, guildId, on, off, fetchFeatures]);

  /**
   * Check if a specific feature is enabled
   * @param featurePath - Dot notation path (e.g., "serverStats.enabled", "moderation.autoMod")
   */
  const isFeatureEnabled = useCallback((featurePath: string): boolean => {
    if (!features) return false;

    const keys = featurePath.split('.');
    let current: any = features;

    for (const key of keys) {
      if (current[key] === undefined) return false;
      current = current[key];
    }

    return Boolean(current);
  }, [features]);

  return {
    features,
    loading,
    error,
    refresh: fetchFeatures,
    isFeatureEnabled,
  };
}
