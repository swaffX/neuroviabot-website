# ==========================================
# 🚀 Manual Deploy Script for VPS (PowerShell)
# ==========================================
# Usage: .\scripts\manual-deploy.ps1 [bot|frontend|all]
# ==========================================

param(
    [string]$DeployType = "all"
)

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 Starting Manual Deployment" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Deploy Type: $DeployType" -ForegroundColor Yellow
Write-Host ""

# Pull latest code
Write-Host "📥 Pulling latest code from GitHub..." -ForegroundColor Cyan
git pull origin main
Write-Host "✅ Code updated" -ForegroundColor Green
Write-Host ""

# SSH to VPS and deploy
$VPS_HOST = $env:VPS_HOST
$VPS_USER = $env:VPS_USERNAME

if ($DeployType -eq "bot" -or $DeployType -eq "all") {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🤖 Deploying Discord Bot to VPS" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    ssh "$VPS_USER@$VPS_HOST" @"
        cd /root/neuroviabot/bot
        git pull origin main
        npm install --production
        pm2 restart neuroviabot --update-env
        pm2 save
        echo '✅ Bot deployed!'
"@
    
    Write-Host "✅ Bot deployed successfully!" -ForegroundColor Green
    Write-Host ""
}

if ($DeployType -eq "frontend" -or $DeployType -eq "all") {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🌐 Deploying Frontend to VPS" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    ssh "$VPS_USER@$VPS_HOST" @"
        cd /root/neuroviabot/bot/neuroviabot-frontend
        npm install
        npm run build
        pm2 restart neuroviabot-frontend --update-env
        echo '✅ Frontend deployed!'
"@
    
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 All done! Check VPS for service status." -ForegroundColor Green

