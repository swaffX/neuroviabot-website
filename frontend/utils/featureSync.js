import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

// Frontend feature list (hardcoded for comparison)
const FRONTEND_FEATURES = [
  { id: 'nrc-economy', name: 'NeuroCoin Economy', category: 'economy' },
  { id: 'p2p-trading', name: 'P2P Trading', category: 'economy' },
  { id: 'marketplace', name: 'Marketplace', category: 'economy' },
  { id: 'nrc-shop', name: 'NRC Shop', category: 'economy' },
  { id: 'staking', name: 'Investment & Staking', category: 'economy' },
  { id: 'auto-moderation', name: 'Auto-Moderation', category: 'moderation' },
  { id: 'raid-protection', name: 'Raid Protection', category: 'moderation' },
  { id: 'warning-system', name: 'Warning System', category: 'moderation' },
  { id: 'leveling', name: 'Leveling System', category: 'engagement' },
  { id: 'quests', name: 'Quest System', category: 'engagement' },
  { id: 'achievements', name: 'Achievements', category: 'engagement' },
  { id: 'tickets', name: 'Ticket System', category: 'utility' },
  { id: 'giveaways', name: 'Giveaways', category: 'utility' },
  { id: 'reaction-roles', name: 'Reaction Roles', category: 'utility' },
  { id: 'custom-commands', name: 'Custom Commands', category: 'utility' },
  { id: 'welcome-system', name: 'Welcome System', category: 'utility' },
  { id: 'analytics', name: 'Analytics Dashboard', category: 'analytics' },
];

/**
 * Fetch bot features from API
 */
async function fetchBotFeatures() {
  try {
    const response = await axios.get(`${API_URL}/api/bot/features`, {
      timeout: 5000
    });
    return response.data.features || [];
  } catch (error) {
    console.error('[FeatureSync] Failed to fetch bot features:', error.message);
    return [];
  }
}

/**
 * Fetch bot commands from API
 */
async function fetchBotCommands() {
  try {
    const response = await axios.get(`${API_URL}/api/bot-commands/list`, {
      timeout: 5000
    });
    return response.data.commands || [];
  } catch (error) {
    console.error('[FeatureSync] Failed to fetch bot commands:', error.message);
    return [];
  }
}

/**
 * Compare frontend features with bot features
 */
function compareFeatures(botFeatures) {
  const frontendIds = new Set(FRONTEND_FEATURES.map(f => f.id));
  const botIds = new Set(botFeatures.map(f => f.id));

  const missing = []; // Features on bot but not frontend
  const deprecated = []; // Features on frontend but not on bot

  // Find missing features
  botFeatures.forEach(botFeature => {
    if (!frontendIds.has(botFeature.id)) {
      missing.push(botFeature);
    }
  });

  // Find deprecated features
  FRONTEND_FEATURES.forEach(frontendFeature => {
    if (!botIds.has(frontendFeature.id)) {
      deprecated.push(frontendFeature);
    }
  });

  return { missing, deprecated };
}

/**
 * Generate sync report
 */
export async function generateSyncReport() {
  try {
    console.log('[FeatureSync] Generating sync report...');

    const [botFeatures, botCommands] = await Promise.all([
      fetchBotFeatures(),
      fetchBotCommands()
    ]);

    const { missing, deprecated } = compareFeatures(botFeatures);

    const synced = missing.length === 0 && deprecated.length === 0;

    const report = {
      synced,
      lastCheck: new Date().toISOString(),
      botFeatures: {
        total: botFeatures.length,
        list: botFeatures
      },
      frontendFeatures: {
        total: FRONTEND_FEATURES.length,
        list: FRONTEND_FEATURES
      },
      discrepancies: {
        missing: {
          count: missing.length,
          items: missing
        },
        deprecated: {
          count: deprecated.length,
          items: deprecated
        }
      },
      commands: {
        total: botCommands.length,
        byCategory: groupByCategory(botCommands)
      }
    };

    console.log('[FeatureSync] Sync report generated:', {
      synced,
      missing: missing.length,
      deprecated: deprecated.length
    });

    return report;
  } catch (error) {
    console.error('[FeatureSync] Error generating sync report:', error);
    throw error;
  }
}

/**
 * Group commands by category
 */
function groupByCategory(commands) {
  return commands.reduce((acc, cmd) => {
    const category = cmd.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cmd);
    return acc;
  }, {});
}

/**
 * Check if sync is needed
 */
export async function checkSyncStatus() {
  try {
    const report = await generateSyncReport();
    return {
      needsSync: !report.synced,
      missingCount: report.discrepancies.missing.count,
      deprecatedCount: report.discrepancies.deprecated.count,
      lastCheck: report.lastCheck
    };
  } catch (error) {
    console.error('[FeatureSync] Error checking sync status:', error);
    return {
      needsSync: false,
      missingCount: 0,
      deprecatedCount: 0,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Get frontend features list
 */
export function getFrontendFeatures() {
  return FRONTEND_FEATURES;
}

