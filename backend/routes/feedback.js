const express = require('express');
const router = express.Router();

// Feedback form endpoint
router.post('/', async (req, res) => {
  try {
    const {
      discordUserId,
      discordUsername,
      discordAvatar,
      selectedGuildId,
      feedbackType,
      rating,
      experienceAreas,
      title,
      message
    } = req.body;

    // Validation
    if (!discordUserId || !discordUsername || !feedbackType || !rating || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm gerekli alanları doldurun.'
      });
    }

    // Rating validation
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz puan değeri.'
      });
    }

    // Feedback type validation
    const validTypes = ['positive', 'negative', 'suggestion', 'issue'];
    if (!validTypes.includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz geri bildirim türü.'
      });
    }

    // Log the feedback
    console.log('[FEEDBACK] New feedback submission:', {
      discordUserId,
      discordUsername,
      selectedGuildId,
      feedbackType,
      rating,
      experienceAreas: experienceAreas?.length || 0,
      title,
      timestamp: new Date().toISOString()
    });

    // Save to database
    const db = req.app.get('db');
    if (db) {
      if (!db.data.feedback) {
        db.data.feedback = new Map();
      }
      
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const feedbackData = {
        id: feedbackId,
        discordUserId,
        discordUsername,
        discordAvatar,
        selectedGuildId,
        feedbackType,
        rating,
        experienceAreas,
        title,
        message,
        timestamp: Date.now(),
        status: 'pending',
        source: 'web'
      };
      
      db.data.feedback.set(feedbackId, feedbackData);
      db.save();
      console.log('[FEEDBACK] Saved to database:', feedbackId);
    }

    // Example: Send to Discord webhook (optional)
    if (process.env.FEEDBACK_WEBHOOK_URL) {
      const typeEmojis = {
        positive: '😊',
        negative: '😕',
        suggestion: '💡',
        issue: '⚠️'
      };

      const ratingStars = '⭐'.repeat(rating);

      const webhookPayload = {
        embeds: [{
          title: `${typeEmojis[feedbackType]} Yeni Geri Bildirim`,
          color: feedbackType === 'positive' ? 0x43B581 : 
                 feedbackType === 'negative' ? 0xF04747 :
                 feedbackType === 'suggestion' ? 0xFAA61A : 0xFF9800,
          fields: [
            { name: 'Discord User', value: `${discordUsername} (${discordUserId})`, inline: true },
            { name: 'Sunucu ID', value: selectedGuildId || 'Belirtilmedi', inline: true },
            { name: 'Tür', value: feedbackType, inline: true },
            { name: 'Puan', value: ratingStars + ` (${rating}/5)`, inline: true },
            ...(experienceAreas && experienceAreas.length > 0 ? [{
              name: 'Alanlar',
              value: experienceAreas.join(', '),
              inline: false
            }] : []),
            { name: 'Başlık', value: title, inline: false },
            { name: 'Mesaj', value: message.substring(0, 1000), inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'NeuroViaBot Feedback System' }
        }]
      };

      try {
        const fetch = globalThis.fetch || require('node-fetch');
        await fetch(process.env.FEEDBACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        });
      } catch (webhookError) {
        console.error('[FEEDBACK] Webhook error:', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Geri bildiriminiz alındı. Değerli geri bildiriminiz için teşekkür ederiz!'
    });

  } catch (error) {
    console.error('[FEEDBACK] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// Get feedback list
router.get('/list', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    // Get database
    const db = req.app.get('db');
    
    if (!db || !db.data.feedback) {
      // Return empty list if no database
      return res.json({
        success: true,
        feedback: []
      });
    }
    
    let feedbackList = Array.from(db.data.feedback.values());
    
    // Filter by category if specified
    if (category && category !== 'all') {
      feedbackList = feedbackList.filter(f => f.category === category);
    }
    
    // Sort by date (newest first)
    feedbackList.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit results
    feedbackList = feedbackList.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      feedback: feedbackList,
      total: feedbackList.length
    });
    
  } catch (error) {
    console.error('[FEEDBACK] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback list'
    });
  }
});

// Get feedback statistics (optional)
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.get('db');
    
    if (!db || !db.data.feedback) {
      // Return mock data if no database
      return res.json({
        success: true,
        stats: {
          total: 0,
          implemented: 0,
          resolved: 0,
          byType: {
            positive: 0,
            negative: 0,
            suggestion: 0,
            issue: 0
          },
          averageRating: 0
        }
      });
    }
    
    const feedbackList = Array.from(db.data.feedback.values());
    
    const stats = {
      total: feedbackList.length,
      implemented: feedbackList.filter(f => f.status === 'implemented').length,
      resolved: feedbackList.filter(f => f.status === 'resolved').length,
      byType: {
        positive: feedbackList.filter(f => f.feedbackType === 'positive').length,
        negative: feedbackList.filter(f => f.feedbackType === 'negative').length,
        suggestion: feedbackList.filter(f => f.feedbackType === 'suggestion').length,
        issue: feedbackList.filter(f => f.feedbackType === 'issue').length
      },
      averageRating: feedbackList.length > 0 
        ? feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackList.length 
        : 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('[FEEDBACK] Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınamadı.'
    });
  }
});

module.exports = router;

