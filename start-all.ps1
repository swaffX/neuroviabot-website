# Discord Bot Full Stack Starter - PowerShell Version
Clear-Host

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DISCORD BOT FULL STACK STARTER"       -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Tüm sistemler başlatılıyor..." -ForegroundColor Green
Write-Host ""

# Kill existing processes
Write-Host "🔄 Eski processler temizleniyor..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Create logs directory if it doesn't exist
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host ""
Write-Host "🎯 Sistemler başlatılıyor:" -ForegroundColor Cyan
Write-Host "  • Database: SQLite (otomatik)" -ForegroundColor White
Write-Host "  • Backend API: http://localhost:3001" -ForegroundColor White  
Write-Host "  • Frontend Web: http://localhost:3002" -ForegroundColor White
Write-Host "  • Discord Bot: Online" -ForegroundColor White
Write-Host ""

# Start Backend (Bot + API + Socket.IO)
Write-Host "📡 Backend + Bot başlatılıyor..." -ForegroundColor Blue
$backendProcess = Start-Process -FilePath "cmd" -ArgumentList "/k", "title Discord Bot Backend && node index.js" -PassThru -WindowStyle Normal

# Wait for backend to initialize  
Write-Host "⏳ Backend hazırlanırken bekleniyor... (10 saniye)" -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start Frontend
Write-Host "🌐 Frontend başlatılıyor..." -ForegroundColor Blue
Set-Location "web\frontend"
$env:PORT = "3002"
$frontendProcess = Start-Process -FilePath "cmd" -ArgumentList "/k", "title Frontend Dashboard && set PORT=3002 && npm start" -PassThru -WindowStyle Normal
Set-Location "..\..\"

Write-Host ""
Write-Host "✅ TÜM SİSTEMLER BAŞLATILDI!" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 ERİŞİM LİNKLERİ:" -ForegroundColor Cyan
Write-Host "  • Web Panel: " -ForegroundColor White -NoNewline
Write-Host "http://localhost:3002" -ForegroundColor Blue
Write-Host "  • API Backend: " -ForegroundColor White -NoNewline
Write-Host "http://localhost:3001" -ForegroundColor Blue
Write-Host "  • Socket.IO: " -ForegroundColor White -NoNewline
Write-Host "ws://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 İPUÇLARI:" -ForegroundColor Yellow
Write-Host "  • Bot durumunu Discord'da kontrol edin" -ForegroundColor White
Write-Host "  • Web panel'de giriş yapmak için Discord hesabınızı kullanın" -ForegroundColor White
Write-Host "  • Hata logu için Backend penceresine bakın" -ForegroundColor White
Write-Host ""
Write-Host "🔧 KAPATMAK İÇİN:" -ForegroundColor Red
Write-Host "  • Bu pencereyi kapatın" -ForegroundColor White
Write-Host "  • Veya stop-all.ps1 çalıştırın" -ForegroundColor White
Write-Host ""

# Keep script running to monitor processes
Write-Host "Program devam ediyor... Bu pencereyi açık bırakın veya kapatın." -ForegroundColor Gray
Write-Host "Process ID'ler - Backend: $($backendProcess.Id), Frontend: $($frontendProcess.Id)" -ForegroundColor Gray

# Optional: Keep monitoring (uncomment if needed)
# while ($true) {
#     Start-Sleep -Seconds 30
#     if ($backendProcess.HasExited -or $frontendProcess.HasExited) {
#         Write-Host "⚠️  Bir process kapandı!" -ForegroundColor Red
#         break
#     }
# }

Read-Host "Çıkmak için Enter tuşuna basın"
