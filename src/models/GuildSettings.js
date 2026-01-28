const mongoose = require('mongoose');

const GuildSettingsSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Music Settings
  music: {
    enabled: { type: Boolean, default: true },
    defaultVolume: { type: Number, default: 50, min: 0, max: 100 },
    maxQueueSize: { type: Number, default: 100, min: 1, max: 1000 },
    djRoleId: { type: String, default: null },
    allowFilters: { type: Boolean, default: true },
    twentyFourSeven: { type: Boolean, default: false },
  },
  
  // Moderation Settings
  moderation: {
    enabled: { type: Boolean, default: true },
    autoMod: { type: Boolean, default: true },
    spamProtection: { type: Boolean, default: true },
    antiInvite: { type: Boolean, default: false },
    antiLink: { type: Boolean, default: false },
    logChannelId: { type: String, default: null },
    muteRoleId: { type: String, default: null },
    bannedWords: { type: [String], default: [] },
    maxWarnings: { type: Number, default: 3 },
  },
  
  // Economy Settings
  economy: {
    enabled: { type: Boolean, default: true },
    startingBalance: { type: Number, default: 1000, min: 0 },
    dailyReward: { type: Number, default: 100, min: 0 },
    workReward: { type: Number, default: 50, min: 0 },
    robEnabled: { type: Boolean, default: true },
    gamblingEnabled: { type: Boolean, default: true },
  },
  
  // Leveling Settings
  leveling: {
    enabled: { type: Boolean, default: true },
    xpPerMessage: { type: Number, default: 15, min: 1, max: 100 },
    xpCooldown: { type: Number, default: 60, min: 0 }, // seconds
    levelUpMessage: { type: Boolean, default: true },
    levelUpChannelId: { type: String, default: null },
    levelRoles: { type: Map, of: String, default: new Map() }, // level -> roleId
    ignoredChannels: { type: [String], default: [] },
  },
  
  // Welcome Settings
  welcome: {
    enabled: { type: Boolean, default: true },
    channelId: { type: String, default: null },
    message: { 
      type: String, 
      default: 'Hoş geldin {user}! Sunucumuza katıldığın için teşekkürler! 🎉' 
    },
    embedEnabled: { type: Boolean, default: false },
    embedColor: { type: String, default: '#5865F2' },
    imageEnabled: { type: Boolean, default: false },
    dmEnabled: { type: Boolean, default: false },
  },
  
  // Leave Settings
  leave: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: '{user} sunucudan ayrıldı. Görüşmek üzere! 👋' },
  },
  
  // Auto-role Settings
  autoRole: {
    enabled: { type: Boolean, default: false },
    roleIds: { type: [String], default: [] },
    botRoleId: { type: String, default: null }, // Auto-role for bots
  },
  
  // General Settings
  general: {
    prefix: { type: String, default: '!' },
    language: { type: String, default: 'tr', enum: ['tr', 'en'] },
    timezone: { type: String, default: 'Europe/Istanbul' },
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Indexes for better query performance
GuildSettingsSchema.index({ 'music.enabled': 1 });
GuildSettingsSchema.index({ 'moderation.enabled': 1 });
GuildSettingsSchema.index({ 'economy.enabled': 1 });
GuildSettingsSchema.index({ 'leveling.enabled': 1 });

// Methods
GuildSettingsSchema.methods.updateCategory = async function(category, updates) {
  this[category] = { ...this[category], ...updates };
  this.updatedAt = Date.now();
  return await this.save();
};

GuildSettingsSchema.methods.resetToDefaults = async function() {
  const defaults = new this.constructor();
  Object.assign(this, defaults.toObject());
  this.guildId = this.guildId; // Preserve guild ID
  return await this.save();
};

// Statics
GuildSettingsSchema.statics.findOrCreate = async function(guildId) {
  let settings = await this.findOne({ guildId });
  if (!settings) {
    settings = await this.create({ guildId });
  }
  return settings;
};

module.exports = mongoose.model('GuildSettings', GuildSettingsSchema);

