/**
 * Discord API Helper Functions
 */

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

/**
 * Fetch Discord user guilds (requires access token)
 */
export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch guilds');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Discord guilds:', error);
    throw error;
  }
}

/**
 * Fetch Discord user info (requires access token)
 */
export async function fetchUserInfo(accessToken: string): Promise<DiscordUser> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    throw error;
  }
}

/**
 * Check if bot is in guild
 */
export async function isBotInGuild(guildId: string, botToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get bot invite URL
 */
export function getBotInviteUrl(clientId: string, guildId?: string): string {
  const permissions = '8'; // Administrator
  const scopes = 'bot applications.commands';
  
  let url = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&permissions=${permissions}`;
  
  if (guildId) {
    url += `&guild_id=${guildId}`;
  }
  
  return url;
}

/**
 * Get Discord CDN avatar URL
 */
export function getDiscordAvatarUrl(userId: string, avatarHash: string | null, size: number = 128): string {
  if (!avatarHash) {
    const defaultAvatarNum = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
  }
  
  const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=${size}`;
}

/**
 * Get Discord CDN guild icon URL
 */
export function getDiscordGuildIconUrl(guildId: string, iconHash: string | null, size: number = 128): string {
  if (!iconHash) {
    return '/images/default-server.png';
  }
  
  const extension = iconHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${extension}?size=${size}`;
}
