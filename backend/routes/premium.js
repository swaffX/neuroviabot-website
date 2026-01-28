const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

// Premium plans configuration
const PREMIUM_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'lifetime',
    features: [
      'Basic moderation commands',
      'Welcome messages',
      'Auto-moderation (basic)',
      'Up to 10 custom commands',
      'Economy system',
      'Leveling system',
      'NeuroCoin rewards'
    ],
    limits: {
      customCommands: 10,
      autoModRules: 5,
      giveaways: 3
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4.99,
    interval: 'monthly',
    popular: true,
    features: [
      'Everything in Free',
      'Advanced moderation tools',
      'Custom reaction roles',
      'Unlimited custom commands',
      'Advanced auto-moderation',
      'Unlimited giveaways',
      'Premium support',
      '2x NeuroCoin rewards',
      'Custom bot status',
      'Advanced analytics'
    ],
    limits: {
      customCommands: -1, // unlimited
      autoModRules: -1,
      giveaways: -1
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9.99,
    interval: 'monthly',
    features: [
      'Everything in Pro',
      'Priority bot response',
      'Custom bot branding',
      'Dedicated support team',
      '5x NeuroCoin rewards',
      'Advanced security features',
      'Custom integrations',
      'White-label dashboard',
      'SLA guarantee',
      'Early access to new features'
    ],
    limits: {
      customCommands: -1,
      autoModRules: -1,
      giveaways: -1
    }
  }
];

// GET /api/premium/plans - List all premium plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: PREMIUM_PLANS
  });
});

// GET /api/premium/user/:userId - Get user's premium status
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/premium/user/${userId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Premium] Error fetching user premium:', error.message);
    // Return free plan as default
    res.json({
      success: true,
      premium: {
        plan: 'free',
        expiresAt: null,
        features: PREMIUM_PLANS[0].features
      }
    });
  }
});

// GET /api/premium/guild/:guildId - Get guild's premium status
router.get('/guild/:guildId', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/premium/guild/${guildId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Premium] Error fetching guild premium:', error.message);
    res.json({
      success: true,
      premium: {
        plan: 'free',
        expiresAt: null,
        features: PREMIUM_PLANS[0].features
      }
    });
  }
});

// POST /api/premium/purchase - Purchase premium (mock for now)
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const { planId, targetType, targetId } = req.body;
    
    // Validate plan
    const plan = PREMIUM_PLANS.find(p => p.id === planId);
    if (!plan) {
      return res.status(400).json({ success: false, error: 'Invalid plan' });
    }
    
    // Mock purchase - in production, integrate with payment provider
    console.log(`[Premium] Mock purchase: ${plan.name} for ${targetType}:${targetId}`);
    
    res.json({
      success: true,
      message: 'Premium purchase successful (mock)',
      premium: {
        plan: planId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        features: plan.features
      }
    });
  } catch (error) {
    console.error('[Premium] Error purchasing:', error.message);
    res.status(500).json({ success: false, error: 'Failed to purchase premium' });
  }
});

// POST /api/premium/cancel - Cancel subscription (mock)
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    
    console.log(`[Premium] Mock cancel for ${targetType}:${targetId}`);
    
    res.json({
      success: true,
      message: 'Premium cancelled successfully (mock)'
    });
  } catch (error) {
    console.error('[Premium] Error cancelling:', error.message);
    res.status(500).json({ success: false, error: 'Failed to cancel premium' });
  }
});

module.exports = router;

