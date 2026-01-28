// ==========================================
// 🚀 PM2 Ecosystem Configuration
// ==========================================
// VPS'te tüm servisleri tek komutla başlatmak için:
// pm2 start PM2-ECOSYSTEM.config.js

module.exports = {
  apps: [
    // Discord Bot
    {
      name: 'neuroviabot',
      script: './index.js',
      cwd: '/root/neuroviabot/bot',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },

    // Backend API
    {
      name: 'neuroviabot-backend',
      script: './index.js',
      cwd: '/root/neuroviabot/bot/neuroviabot-backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },

    // Frontend (Next.js)
    {
      name: 'neuroviabot-frontend',
      script: './node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/root/neuroviabot/bot/neuroviabot-frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },

    // Webhook Deploy Server
    {
      name: 'webhook-deploy',
      script: './webhook-deploy.js',
      cwd: '/root/neuroviabot/bot',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: 9000,
      },
      error_file: './logs/webhook-error.log',
      out_file: './logs/webhook-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_VPS_IP',
      ref: 'origin/main',
      repo: 'git@github.com:kxrk0/neuroviabot-discord.git',
      path: '/root/neuroviabot',
      'post-deploy': 'npm install && pm2 reload PM2-ECOSYSTEM.config.js --env production',
    },
  },
};
