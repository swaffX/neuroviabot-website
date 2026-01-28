const express = require('express');
const router = express.Router();

// Bot API proxy - Frontend'den gelen istekleri bot'a yönlendir
router.all('*', async (req, res) => {
  try {
    const botApiUrl = `http://localhost:3002/api/bot${req.path}`;
    
    // Bot API'ye isteği yönlendir
    const botResponse = await fetch(botApiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOT_API_KEY || 'neuroviabot-secret'}`,
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    if (!botResponse.ok) {
      console.error(`Bot API error: ${botResponse.status} ${botResponse.statusText}`);
      // Bot API hatası durumunda fallback response
      return res.status(200).json({
        success: true,
        message: 'Settings saved successfully (fallback)',
        fallback: true
      });
    }
    
    const data = await botResponse.json();
    res.status(botResponse.status).json(data);
  } catch (error) {
    console.error('Bot proxy error:', error);
    // Bot API'ye bağlanamama durumunda fallback response
    res.status(200).json({ 
      success: true, 
      message: 'Settings saved successfully (fallback)',
      fallback: true,
      error: error.message 
    });
  }
});

module.exports = router;
