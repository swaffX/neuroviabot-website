// ==========================================
// USER & AUTH TYPES
// ==========================================

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
  premium?: boolean;
  createdAt: string;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// ==========================================
// DISCORD GUILD TYPES
// ==========================================

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  memberCount?: number;
  onlineCount?: number;
  botJoined: boolean;
}

export interface GuildSettings {
  guildId: string;
  prefix?: string;
  language?: string;
  timezone?: string;
  welcomeEnabled?: boolean;
  welcomeChannel?: string;
  welcomeMessage?: string;
  moderationEnabled?: boolean;
  moderationLogChannel?: string;
  economyEnabled?: boolean;
  levelingEnabled?: boolean;
  musicEnabled?: boolean;
  autoRole?: string | null;
  verifyRole?: string | null;
}

// ==========================================
// BOT STATS TYPES
// ==========================================

export interface BotStats {
  guilds: number;
  users: number;
  commands: number;
  uptime: number;
  memoryUsage: number;
  ping: number;
  shards?: number;
}

export interface BotStatus {
  online: boolean;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  activities: Activity[];
}

export interface Activity {
  name: string;
  type: number;
  url?: string;
}

// ==========================================
// COMMAND TYPES
// ==========================================

export interface Command {
  name: string;
  description: string;
  category: string;
  usage: string;
  cooldown: number;
  permissions: string[];
  guildOnly: boolean;
}

export interface CommandExecution {
  id: string;
  commandName: string;
  userId: string;
  username: string;
  guildId: string;
  guildName: string;
  timestamp: string;
  success: boolean;
  executionTime: number;
}

export interface CommandStats {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  topCommands: {
    name: string;
    count: number;
  }[];
  executionsByDay: {
    date: string;
    count: number;
  }[];
}

// ==========================================
// ECONOMY TYPES
// ==========================================

export interface UserEconomy {
  userId: string;
  guildId: string;
  balance: number;
  bank: number;
  lastDaily?: string;
  lastWeekly?: string;
  lastWork?: string;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  itemId: string;
  name: string;
  quantity: number;
  emoji?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji?: string;
  role?: string;
  type: 'role' | 'item' | 'custom';
}

// ==========================================
// LEVELING TYPES
// ==========================================

export interface UserLevel {
  userId: string;
  guildId: string;
  level: number;
  xp: number;
  totalXp: number;
  lastMessage?: string;
  rank?: number;
}

export interface LevelReward {
  level: number;
  roleId: string;
  roleName: string;
}

// ==========================================
// MODERATION TYPES
// ==========================================

export interface ModerationCase {
  id: string;
  guildId: string;
  userId: string;
  moderatorId: string;
  type: 'warn' | 'mute' | 'kick' | 'ban' | 'unban';
  reason: string;
  duration?: number;
  timestamp: string;
  active: boolean;
}

export interface Warning {
  id: string;
  userId: string;
  guildId: string;
  reason: string;
  moderatorId: string;
  timestamp: string;
}

// ==========================================
// MUSIC TYPES
// ==========================================

export interface MusicQueue {
  guildId: string;
  playing: boolean;
  paused: boolean;
  volume: number;
  loop: 'off' | 'track' | 'queue';
  currentTrack: Track | null;
  queue: Track[];
}

export interface Track {
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  url: string;
  requestedBy: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

// ==========================================
// ANALYTICS TYPES
// ==========================================

export interface Analytics {
  guildId: string;
  period: '7d' | '30d' | '90d';
  memberGrowth: {
    date: string;
    joins: number;
    leaves: number;
    total: number;
  }[];
  commandUsage: {
    date: string;
    count: number;
  }[];
  activeUsers: {
    date: string;
    count: number;
  }[];
  messageActivity: {
    date: string;
    count: number;
  }[];
}

// ==========================================
// REAL-TIME EVENT TYPES
// ==========================================

export interface RealtimeEvent {
  id: string;
  type: 'command' | 'member' | 'message' | 'music' | 'moderation';
  guildId: string;
  data: any;
  timestamp: string;
}

export interface CommandEvent extends RealtimeEvent {
  type: 'command';
  data: {
    commandName: string;
    userId: string;
    username: string;
    success: boolean;
  };
}

export interface MemberEvent extends RealtimeEvent {
  type: 'member';
  data: {
    action: 'join' | 'leave' | 'update';
    userId: string;
    username: string;
  };
}

export interface MusicEvent extends RealtimeEvent {
  type: 'music';
  data: {
    action: 'play' | 'pause' | 'skip' | 'stop';
    track?: Track;
  };
}

// ==========================================
// UI COMPONENT TYPES
// ==========================================

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
