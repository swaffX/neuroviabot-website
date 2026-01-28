const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';

// Auth middleware (developer only)
const requireDeveloper = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];
  if (!DEVELOPER_IDS.includes(req.session.user.id)) {
    return res.status(403).json({ error: 'Forbidden - Developer access only' });
  }

  next();
};

// GET /api/cms/:section - Get content for a section
router.get('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    
    const response = await axios.get(`${BOT_API_URL}/api/cms/${section}`, {
      timeout: 5000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[CMS] Error fetching content:', error.message);
    
    // Return default content if CMS unavailable
    res.json({
      success: true,
      section,
      content: getDefaultContent(section),
      isDefault: true
    });
  }
});

// PUT /api/cms/:section - Update content (developer only)
router.put('/:section', requireDeveloper, async (req, res) => {
  try {
    const { section } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const response = await axios.put(
      `${BOT_API_URL}/api/cms/${section}`,
      {
        content,
        updatedBy: req.session.user.id
      },
      { timeout: 5000 }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[CMS] Error updating content:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update content'
    });
  }
});

// GET /api/cms - List all sections
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${BOT_API_URL}/api/cms`, {
      timeout: 5000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[CMS] Error fetching sections:', error.message);
    res.json({
      success: true,
      sections: getDefaultSections(),
      isDefault: true
    });
  }
});

// Default content fallback
function getDefaultContent(section) {
  const defaults = {
    homepage_hero: {
      title: 'Discord Sunucunuzu Güçlendirin',
      subtitle: 'NeuroViaBot ile sunucunuzu yönetin, topluluğunuzu büyütün',
      cta: 'Hemen Başla'
    },
    features_intro: {
      title: 'Güçlü Özellikler',
      description: 'Her ihtiyacınız için kapsamlı araçlar'
    },
    about_text: {
      title: 'Hakkımızda',
      content: 'NeuroViaBot, Discord sunucularını güçlendirmek için tasarlanmış kapsamlı bir bot platformudur.'
    }
  };
  
  return defaults[section] || { text: 'Content not available' };
}

function getDefaultSections() {
  return [
    { key: 'homepage_hero', name: 'Homepage Hero', type: 'object' },
    { key: 'features_intro', name: 'Features Intro', type: 'object' },
    { key: 'about_text', name: 'About Text', type: 'object' }
  ];
}

module.exports = router;

