/**
 * API Client for NeuroViaBot Backend with enhanced error handling and retry logic
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

// API Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch with retry logic and error handling
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle successful response
      if (response.ok) {
        return response;
      }

      // Handle auth errors (don't retry)
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || 'Unauthorized',
          response.status,
          errorData
        );
      }

      // Check if we should retry
      const shouldRetry = 
        attempt < retryConfig.maxRetries &&
        retryConfig.retryableStatuses.includes(response.status);

      if (!shouldRetry) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }

      // Wait before retrying (exponential backoff)
      await sleep(retryConfig.retryDelay * Math.pow(2, attempt));
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      lastError = error as Error;
      
      // Network error - retry
      if (attempt < retryConfig.maxRetries) {
        await sleep(retryConfig.retryDelay * Math.pow(2, attempt));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  botPresent?: boolean;
  memberCount?: number;
}

export interface BotStats {
  guilds: number;
  users: number;
  commands: number;
  uptime: number;
  ping: number;
  memoryUsage: number;
  source?: string; // 'bot-server' | 'database'
  timestamp?: number;
  status?: string;
}

export interface GuildSettings {
  guildId: string;
  prefix: string;
  language: string;
  musicEnabled: boolean;
  moderationEnabled: boolean;
  economyEnabled: boolean;
  levelingEnabled: boolean;
  welcomeEnabled: boolean;
  welcomeChannel: string | null;
  welcomeMessage: string;
  [key: string]: any;
}

/**
 * Fetch user's guilds
 */
export async function fetchUserGuilds(accessToken: string): Promise<Guild[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/guilds/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });

  return await response.json();
}

/**
 * Check if bot is present in multiple guilds
 */
export async function checkBotInGuilds(guildIds: string[]): Promise<Record<string, boolean>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bot/check-guilds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to check guilds');
    }

    const data = await response.json();
    return data.results.reduce((acc: Record<string, boolean>, item: any) => {
      acc[item.guildId] = item.botPresent;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error checking guilds:', error);
    return {};
  }
}

/**
 * Get bot invite URL for a guild
 */
export async function getBotInviteUrl(guildId?: string): Promise<string> {
  try {
    const params = new URLSearchParams();
    if (guildId) params.append('guildId', guildId);

    const response = await fetch(`${API_BASE_URL}/api/guilds/invite-url?${params}`);
    const data = await response.json();
    return data.inviteUrl;
  } catch (error) {
    console.error('Error getting invite URL:', error);
    // Fallback URL
    const clientId = process.env.NEXT_PUBLIC_BOT_CLIENT_ID || '773539215098249246';
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands${guildId ? `&guild_id=${guildId}` : ''}`;
  }
}

/**
 * Fetch bot stats
 */
export async function fetchBotStats(): Promise<BotStats> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/bot/stats`, {
      method: 'GET',
      cache: 'no-store',
    }, {
      maxRetries: 2, // Fewer retries for stats
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching bot stats:', error);
    // Return fallback values
    return {
      guilds: 66,
      users: 59032,
      commands: 43,
      uptime: 0,
      ping: 0,
      memoryUsage: 0,
    };
  }
}

/**
 * Fetch guild settings
 */
export async function fetchGuildSettings(guildId: string): Promise<GuildSettings> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/guilds/${guildId}/settings`, {
    credentials: 'include',
  });

  return await response.json();
}

/**
 * Update guild settings
 */
export async function updateGuildSettings(
  guildId: string,
  settings: Partial<GuildSettings>
): Promise<{ success: boolean; settings: GuildSettings }> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/guilds/${guildId}/settings`,
    {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify(settings),
    },
    { maxRetries: 1 } // Don't retry mutations heavily
  );

  return await response.json();
}

/**
 * API object for easier imports
 */
export const api = {
  fetchUserGuilds,
  checkBotInGuilds,
  getBotInviteUrl,
  fetchBotStats,
  fetchGuildSettings: async (guildId: string) => await fetchGuildSettings(guildId),
  updateGuildSettings: async (guildId: string, settings: any) => await updateGuildSettings(guildId, settings),
  getGuildStats: async (guildId: string) => await fetchGuildStats(guildId),
};

/**
 * Fetch guild stats
 */
export async function fetchGuildStats(guildId: string): Promise<any> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/guilds/${guildId}/stats`, {
    credentials: 'include',
  });

  return await response.json();
}
