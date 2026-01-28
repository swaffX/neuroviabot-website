/**
 * Settings Mapper - Frontend (flat) ↔ Backend (nested) dönüşümü
 */

// Backend nested schema → Frontend flat fields
export function backendToFrontend(backendSettings: any): any {
  if (!backendSettings) return {};
  
  return {
    // Welcome & Leave
    welcomeEnabled: backendSettings.welcome?.enabled ?? false,
    welcomeChannel: backendSettings.welcome?.channelId ?? null,
    welcomeMessage: backendSettings.welcome?.message ?? 'Hoş geldin {user}!',
    welcomeEmbed: backendSettings.welcome?.embedEnabled ?? false,
    welcomeImage: backendSettings.welcome?.imageUrl ?? '',
    leaveEnabled: backendSettings.leave?.enabled ?? false,
    leaveChannel: backendSettings.leave?.channelId ?? null,
    leaveMessage: backendSettings.leave?.message ?? '{user} ayrıldı',
    autoRole: backendSettings.autorole?.roleIds?.[0] ?? null,
    
    // Moderation
    autoModEnabled: backendSettings.moderation?.autoMod ?? false,
    antiSpam: backendSettings.moderation?.spamProtection ?? false,
    antiLink: backendSettings.moderation?.antiLink ?? false,
    antiInvite: backendSettings.moderation?.antiInvite ?? false,
    badWords: Array.isArray(backendSettings.moderation?.bannedWords) 
      ? backendSettings.moderation.bannedWords.join(', ')
      : backendSettings.moderation?.bannedWords ?? '',
    modLogChannel: backendSettings.moderation?.logChannelId ?? null,
    warningSystem: backendSettings.moderation?.enabled ?? false,
    maxWarnings: backendSettings.moderation?.maxWarnings ?? 3,
    warningPunishment: 'Sustur', // Default
    
    // Leveling
    levelingEnabled: backendSettings.leveling?.enabled ?? false,
    xpPerMessage: backendSettings.leveling?.xpPerMessage ?? 15,
    xpCooldown: backendSettings.leveling?.xpCooldown ?? 60,
    levelUpMessage: typeof backendSettings.leveling?.levelUpMessage === 'boolean'
      ? (backendSettings.leveling.levelUpMessage ? 'Tebrikler {user}!' : '')
      : backendSettings.leveling?.levelUpMessage ?? 'Tebrikler {user}!',
    levelUpChannel: backendSettings.leveling?.levelUpChannelId ?? null,
    noXpChannels: '',
    noXpRoles: '',
    stackRoles: false,
    
    // Music
    musicEnabled: backendSettings.features?.music ?? true,
    djRole: null,
    maxQueueSize: 100,
    defaultVolume: 50,
    autoLeave: false,
    autoLeaveTime: 300,
    allowFilters: true,
    allowPlaylists: true,
    
    // Economy
    economyEnabled: backendSettings.features?.economy ?? true,
    currencyName: 'Coin',
    currencySymbol: '💰',
    dailyAmount: 100,
    workAmount: 50,
    startBalance: 1000,
    shopEnabled: true,
    gamblingEnabled: true,
    
    // Tickets
    ticketEnabled: backendSettings.features?.tickets ?? false,
    ticketCategory: null,
    ticketMessage: 'Destek talebiniz oluşturuldu',
    supportRole: null,
    ticketLogChannel: null,
    maxTickets: 1,
    autoClose: false,
    autoCloseTime: 24,
    
    // Autorole
    autoRoleEnabled: backendSettings.autorole?.enabled ?? false,
    autoRoleIds: Array.isArray(backendSettings.autorole?.roleIds)
      ? backendSettings.autorole.roleIds.join(', ')
      : '',
    autoRoleDelay: 0,
    botAutoRole: null,
    reactionRoleEnabled: false,
    
    // Logging
    loggingEnabled: backendSettings.loggingEnabled ?? false,
    messageLogChannel: backendSettings.messageLogChannel ?? null,
    serverLogChannel: backendSettings.serverLogChannel ?? null,
    joinLeaveLog: backendSettings.loggingEnabled ?? false,
    roleChangeLog: backendSettings.loggingEnabled ?? false,
    channelLog: backendSettings.loggingEnabled ?? false,
    voiceLog: backendSettings.loggingEnabled ?? false,
    
    // Giveaways
    giveawayEnabled: backendSettings.features?.giveaways ?? false,
    giveawayRole: null,
    giveawayPingEveryone: false,
    giveawayChannel: null,
    
    // General
    prefix: backendSettings.general?.prefix ?? backendSettings.prefix ?? '!',
    language: backendSettings.general?.language ?? 'tr',
    timezone: 'Europe/Istanbul',
    embedColor: '#5865F2',
    commandCooldown: 3,
    adminRole: null,
    modRole: null,
  };
}

// Frontend flat fields → Backend nested schema
export function frontendToBackend(frontendSettings: any): any {
  // Dönüştürmeden sadece nested yapıya dönüştür
  const backend: any = {
    // Welcome
    welcome: {
      enabled: frontendSettings.welcomeEnabled ?? false,
      channelId: frontendSettings.welcomeChannel ?? null,
      message: frontendSettings.welcomeMessage ?? 'Hoş geldin {user}!',
      embedEnabled: frontendSettings.welcomeEmbed ?? false,
      imageUrl: frontendSettings.welcomeImage ?? '',
    },
    
    // Leave
    leave: {
      enabled: frontendSettings.leaveEnabled ?? false,
      channelId: frontendSettings.leaveChannel ?? null,
      message: frontendSettings.leaveMessage ?? '{user} ayrıldı',
    },
    
    // Moderation
    moderation: {
      enabled: frontendSettings.warningSystem ?? true,
      autoMod: frontendSettings.autoModEnabled ?? false,
      spamProtection: frontendSettings.antiSpam ?? false,
      antiInvite: frontendSettings.antiInvite ?? false,
      antiLink: frontendSettings.antiLink ?? false,
      bannedWords: typeof frontendSettings.badWords === 'string'
        ? frontendSettings.badWords.split(',').map((w: string) => w.trim()).filter(Boolean)
        : Array.isArray(frontendSettings.badWords) ? frontendSettings.badWords : [],
      logChannelId: frontendSettings.modLogChannel ?? null,
      muteRoleId: null,
      maxWarnings: frontendSettings.maxWarnings ?? 3,
    },
    
    // Leveling
    leveling: {
      enabled: frontendSettings.levelingEnabled ?? false,
      xpPerMessage: frontendSettings.xpPerMessage ?? 15,
      xpCooldown: frontendSettings.xpCooldown ?? 60,
      levelUpMessage: frontendSettings.levelUpMessage || 'Tebrikler {user}! {level}. seviyeye ulaştın! 🎉', // String (backend expects string)
      levelUpChannelId: frontendSettings.levelUpChannel ?? null,
      levelRoles: {}, // Empty object for now
    },
    
    // Autorole
    autorole: {
      enabled: frontendSettings.autoRoleEnabled ?? false,
      roleIds: typeof frontendSettings.autoRoleIds === 'string'
        ? frontendSettings.autoRoleIds.split(',').map((r: string) => r.trim()).filter(Boolean)
        : Array.isArray(frontendSettings.autoRoleIds) ? frontendSettings.autoRoleIds : [],
    },
    
    // Features
    features: {
      music: frontendSettings.musicEnabled ?? true,
      economy: frontendSettings.economyEnabled ?? true,
      moderation: frontendSettings.autoModEnabled ?? true,
      leveling: frontendSettings.levelingEnabled ?? true,
      tickets: frontendSettings.ticketEnabled ?? false,
      giveaways: frontendSettings.giveawayEnabled ?? false,
      welcome: frontendSettings.welcomeEnabled ?? true,
      autorole: frontendSettings.autoRoleEnabled ?? false,
    },
    
    // General
    general: {
      prefix: frontendSettings.prefix ?? '!',
      language: frontendSettings.language ?? 'tr',
    },
    
    // Logging (flat fields)
    loggingEnabled: frontendSettings.loggingEnabled ?? false,
    messageLogChannel: frontendSettings.messageLogChannel ?? null,
    serverLogChannel: frontendSettings.serverLogChannel ?? null,
  };
  
  return backend;
}

