const express = require('express');
const router = express.Router();

// Bot features list
const BOT_FEATURES = [
  {
    id: 'nrc-economy',
    name: 'NeuroCoin Economy',
    description: 'Complete economy system with NRC currency',
    status: 'active',
    category: 'economy',
    commands: ['economy', 'shop']
  },
  {
    id: 'p2p-trading',
    name: 'P2P Trading',
    description: 'User-to-user trading with escrow system',
    status: 'active',
    category: 'economy',
    commands: ['trade']
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Cross-server marketplace with tax system',
    status: 'active',
    category: 'economy',
    commands: ['market-config']
  },
  {
    id: 'nrc-shop',
    name: 'NRC Shop',
    description: 'Shop system for items, boosts, and features',
    status: 'active',
    category: 'economy',
    commands: ['shop']
  },
  {
    id: 'staking',
    name: 'Investment & Staking',
    description: 'NRC staking and loan system',
    status: 'active',
    category: 'economy',
    commands: ['invest']
  },
  {
    id: 'auto-moderation',
    name: 'Auto-Moderation',
    description: 'Automated spam and content filtering',
    status: 'active',
    category: 'moderation',
    commands: ['automod', 'moderation']
  },
  {
    id: 'raid-protection',
    name: 'Raid Protection',
    description: 'Anti-raid and verification system',
    status: 'active',
    category: 'moderation',
    commands: ['guard']
  },
  {
    id: 'warning-system',
    name: 'Warning System',
    description: 'User warning and case management',
    status: 'active',
    category: 'moderation',
    commands: ['moderation']
  },
  {
    id: 'leveling',
    name: 'Leveling System',
    description: 'XP and level system with rewards',
    status: 'active',
    category: 'engagement',
    commands: ['level', 'leaderboard']
  },
  {
    id: 'quests',
    name: 'Quest System',
    description: 'Daily and weekly quests with rewards',
    status: 'active',
    category: 'engagement',
    commands: ['quest']
  },
  {
    id: 'achievements',
    name: 'Achievements',
    description: 'Achievement badges and rewards',
    status: 'active',
    category: 'engagement',
    commands: []
  },
  {
    id: 'tickets',
    name: 'Ticket System',
    description: 'Support ticket management',
    status: 'active',
    category: 'utility',
    commands: ['ticket']
  },
  {
    id: 'giveaways',
    name: 'Giveaways',
    description: 'Automated giveaway system',
    status: 'active',
    category: 'utility',
    commands: ['giveaway']
  },
  {
    id: 'reaction-roles',
    name: 'Reaction Roles',
    description: 'Role assignment via reactions',
    status: 'active',
    category: 'utility',
    commands: []
  },
  {
    id: 'custom-commands',
    name: 'Custom Commands',
    description: 'Create custom bot commands',
    status: 'active',
    category: 'utility',
    commands: ['custom']
  },
  {
    id: 'welcome-system',
    name: 'Welcome System',
    description: 'Customizable welcome messages',
    status: 'active',
    category: 'utility',
    commands: ['welcome']
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Server statistics and insights',
    status: 'active',
    category: 'analytics',
    commands: []
  }
];

// GET /api/bot/features - List all bot features
router.get('/api/bot/features', (req, res) => {
  try {
    const { category, status } = req.query;
    
    let features = BOT_FEATURES;
    
    // Filter by category
    if (category) {
      features = features.filter(f => f.category === category);
    }
    
    // Filter by status
    if (status) {
      features = features.filter(f => f.status === status);
    }
    
    // Group by category
    const grouped = features.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    }, {});
    
    res.json({
      success: true,
      features,
      grouped,
      total: features.length,
      categories: [...new Set(BOT_FEATURES.map(f => f.category))],
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Bot Features] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bot features'
    });
  }
});

// GET /api/bot/features/:id - Get specific feature details
router.get('/api/bot/features/:id', (req, res) => {
  try {
    const { id } = req.params;
    const feature = BOT_FEATURES.find(f => f.id === id);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }
    
    res.json({
      success: true,
      feature
    });
  } catch (error) {
    console.error('[Bot Features] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature'
    });
  }
});

module.exports = router;

