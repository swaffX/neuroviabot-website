const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/simple-db');

// GET /api/cms - List all CMS sections
router.get('/api/cms', (req, res) => {
  try {
    const db = getDatabase();
    const sections = [];
    
    if (db.data.cmsContent) {
      db.data.cmsContent.forEach((value, key) => {
        sections.push({
          key,
          ...value,
          preview: JSON.stringify(value.content).substring(0, 100)
        });
      });
    }
    
    res.json({
      success: true,
      sections,
      total: sections.length
    });
  } catch (error) {
    console.error('[CMS] Error listing sections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list CMS sections'
    });
  }
});

// GET /api/cms/:section - Get specific section content
router.get('/api/cms/:section', (req, res) => {
  try {
    const { section } = req.params;
    const db = getDatabase();
    
    if (!db.data.cmsContent) {
      return res.status(404).json({
        success: false,
        error: 'CMS not initialized'
      });
    }
    
    const content = db.data.cmsContent.get(section);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }
    
    res.json({
      success: true,
      section,
      ...content
    });
  } catch (error) {
    console.error('[CMS] Error fetching section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch CMS content'
    });
  }
});

// PUT /api/cms/:section - Update section content
router.put('/api/cms/:section', (req, res) => {
  try {
    const { section } = req.params;
    const { content, updatedBy } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const db = getDatabase();
    
    if (!db.data.cmsContent) {
      db.data.cmsContent = new Map();
    }
    
    const cmsData = {
      content,
      lastUpdated: Date.now(),
      updatedBy: updatedBy || 'system'
    };
    
    db.data.cmsContent.set(section, cmsData);
    db.save();
    
    console.log(`[CMS] Section "${section}" updated by ${updatedBy}`);
    
    res.json({
      success: true,
      section,
      ...cmsData
    });
  } catch (error) {
    console.error('[CMS] Error updating section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update CMS content'
    });
  }
});

// DELETE /api/cms/:section - Delete section
router.delete('/api/cms/:section', (req, res) => {
  try {
    const { section } = req.params;
    const db = getDatabase();
    
    if (!db.data.cmsContent || !db.data.cmsContent.has(section)) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }
    
    db.data.cmsContent.delete(section);
    db.save();
    
    console.log(`[CMS] Section "${section}" deleted`);
    
    res.json({
      success: true,
      message: 'Section deleted'
    });
  } catch (error) {
    console.error('[CMS] Error deleting section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete CMS section'
    });
  }
});

module.exports = router;

