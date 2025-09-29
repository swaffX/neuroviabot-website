# NeuroVia Bot API - Vercel Edge Functions

⚡ Lightning-fast Discord OAuth API powered by Vercel Edge Functions

## 🚀 Architecture

**Frontend:** GitHub Pages (`https://swaffx.github.io/neuroviabot-website/`)
**API:** Vercel Edge Functions (global CDN)

## 📁 Project Structure

```
vercel-api/
├── api/
│   └── auth/
│       └── callback.js     # Discord OAuth callback (Edge Function)
├── package.json
├── vercel.json            # Vercel configuration
├── .env.example           # Environment variables template
└── README.md
```

## 🌐 Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `DISCORD_CLIENT_SECRET`
   - `DISCORD_REDIRECT_URI`

## 🔧 Environment Variables

```env
DISCORD_CLIENT_ID=1294392725863514122
DISCORD_CLIENT_SECRET=your_secret_here
DISCORD_REDIRECT_URI=https://your-project.vercel.app/api/auth/callback
```

## 🎯 Endpoints

- `GET /api/auth/callback` - Discord OAuth callback handler

## ⚡ Edge Functions Benefits

- 🌍 **Global CDN** - Deployed to 100+ edge locations
- 🚀 **Zero Cold Start** - Instant execution
- 📦 **Zero Configuration** - No server management
- 💰 **Cost Effective** - Pay per request
- 🔒 **Secure** - Built-in HTTPS and security