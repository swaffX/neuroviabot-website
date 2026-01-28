#!/bin/bash

# NeuroViaBot - Critical Fixes Deployment Script
# Bu script VPS'te çalıştırılacak

echo "🚀 NeuroViaBot Critical Fixes Deployment Started..."

# Proje dizinine git
cd /root/neuroviabot/bot

# Git pull yap
echo "📥 Pulling latest changes..."
git pull origin main

# PM2 servislerini durdur
echo "⏹️ Stopping PM2 services..."
pm2 stop neuroviabot
pm2 stop neuroviabot-backend
pm2 stop neuroviabot-frontend

# Node modules'ları güncelle
echo "📦 Updating dependencies..."
npm install

# Backend dependencies
cd /root/neuroviabot/bot/neuroviabot-backend
npm install

# Frontend dependencies
cd /root/neuroviabot/bot/neuroviabot-frontend
npm install

# Ana dizine dön
cd /root/neuroviabot/bot

# PM2 servislerini başlat
echo "▶️ Starting PM2 services..."
pm2 start neuroviabot-backend
pm2 start neuroviabot-frontend
pm2 start neuroviabot

# PM2 durumunu kontrol et
echo "📊 PM2 Status:"
pm2 status

# Logları kontrol et
echo "📋 Recent logs:"
pm2 logs neuroviabot --lines 20
pm2 logs neuroviabot-backend --lines 10
pm2 logs neuroviabot-frontend --lines 10

echo "✅ Deployment completed!"
echo "🔍 Check logs with: pm2 logs neuroviabot --lines 0 -f"
