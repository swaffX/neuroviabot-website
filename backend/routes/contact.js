const express = require('express');
const router = express.Router();

// Contact form endpoint
router.post('/', async (req, res) => {
  try {
    const { discordUserId, discordUsername, discordAvatar, reason, subject, message } = req.body;

    // Validation
    if (!discordUserId || !discordUsername || !reason || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm gerekli alanları doldurun.'
      });
    }

    // Log the contact request
    console.log('[CONTACT] New contact form submission:', {
      discordUserId,
      discordUsername,
      reason,
      subject,
      timestamp: new Date().toISOString()
    });

    // Here you can add:
    // 1. Save to database
    // 2. Send email notification
    // 3. Send Discord webhook notification
    // 4. Create a ticket in your support system

    // Example: Send to Discord webhook (optional)
    if (process.env.CONTACT_WEBHOOK_URL) {
      const webhookPayload = {
        embeds: [{
          title: '📨 Yeni İletişim Formu',
          color: 0x5865F2,
          fields: [
            { name: 'Discord User', value: `${discordUsername} (${discordUserId})`, inline: true },
            { name: 'Neden', value: reason, inline: false },
            { name: 'Konu', value: subject, inline: false },
            { name: 'Mesaj', value: message.substring(0, 1000), inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'NeuroViaBot Contact Form' }
        }]
      };

      try {
        const fetch = globalThis.fetch || require('node-fetch');
        await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        });
      } catch (webhookError) {
        console.error('[CONTACT] Webhook error:', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'
    });

  } catch (error) {
    console.error('[CONTACT] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

module.exports = router;

