#!/bin/bash
# Test Frontend Build Script
# Quick test to check if frontend builds successfully

set -e

echo "🧪 Testing Frontend Build..."

cd neuroviabot-frontend

echo "📦 Installing dependencies..."
npm install --silent

echo "🔨 Running type check..."
npx tsc --noEmit || echo "⚠️  Type check failed (continuing...)"

echo "🛠️  Building for production..."
npm run build

echo "✅ Build test complete!"

