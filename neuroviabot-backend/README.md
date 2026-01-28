# 🔥 NeuroViaBot Backend API

Express.js backend API for NeuroViaBot dashboard.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

## 📡 API Endpoints

### Authentication
- `GET /api/auth/discord` - Start Discord OAuth
- `GET /api/auth/discord/callback` - OAuth callback
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Bot
- `GET /api/bot/stats` - Get bot statistics
- `GET /api/bot/status` - Get bot status

### Guilds
- `GET /api/guilds/user` - Get user guilds
- `GET /api/guilds/:id/settings` - Get guild settings
- `PATCH /api/guilds/:id/settings` - Update guild settings
- `GET /api/guilds/:id/stats` - Get guild stats
- `GET /api/guilds/:id/members` - Get guild members

### Health
- `GET /api/health` - Health check

## 🛠️ Tech Stack

- **Express.js** - Web framework
- **Passport.js** - Discord OAuth
- **Axios** - HTTP client
- **CORS** - Cross-origin requests
- **Express Session** - Session management

## 🔧 Environment Variables

See `.env.example` for required variables.

## 📝 Development

Backend automatically starts with frontend when you run:
```bash
cd neuroviabot-frontend
npm run dev
```

This runs both frontend (port 3001) and backend (port 5000) concurrently.