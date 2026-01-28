#!/bin/bash

# ==========================================
# 🧹 NeuroViaBot Cleanup Script
# ==========================================
# Deployment öncesi temizlik

set -e

echo "🧹 Starting cleanup..."

# Clean frontend
if [ -d "frontend" ]; then
    echo "🗑️ Cleaning frontend..."
    cd frontend
    rm -rf .next out node_modules .turbo
    rm -f package-lock.json
    cd ..
fi

# Clean backend
if [ -d "backend" ]; then
    echo "🗑️ Cleaning backend..."
    cd backend
    rm -rf node_modules
    rm -f package-lock.json
    cd ..
fi

# Clean bot
echo "🗑️ Cleaning bot..."
rm -rf node_modules
rm -f package-lock.json

# Clean old logs (30+ days)
if [ -d "logs" ]; then
    echo "🗑️ Cleaning old logs..."
    find logs/ -name "*.log" -mtime +30 -delete 2>/dev/null || true
fi

# Clean old backups (10+ backups)
if [ -d "data" ]; then
    echo "💾 Cleaning old backups..."
    ls -t data/database-backup-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
fi

echo "✅ Cleanup completed!"
