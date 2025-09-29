# Discord Bot System Shutdown - PowerShell Version
Clear-Host

Write-Host "========================================" -ForegroundColor Red
Write-Host "   DISCORD BOT SYSTEM SHUTDOWN"         -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "🛑 Tüm sistemler kapatılıyor..." -ForegroundColor Yellow
Write-Host ""

# Kill all node processes
Write-Host "🔄 Node.js processleri kapatılıyor..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ $($nodeProcesses.Count) Node.js process kapatıldı" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Aktif Node.js process bulunamadı" -ForegroundColor Gray
}

# Kill cmd processes with specific titles
Write-Host "🔄 Backend ve Frontend pencerelerini kapatılıyor..." -ForegroundColor Yellow

try {
    # Try to kill processes by window title (if available)
    Get-Process | Where-Object { $_.MainWindowTitle -like "*Discord Bot Backend*" -or $_.MainWindowTitle -like "*Frontend Dashboard*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Özel pencereler kapatıldı" -ForegroundColor Green
} catch {
    Write-Host "   ℹ️  Özel pencere bulunamadı" -ForegroundColor Gray
}

# Wait a moment
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ TÜM SİSTEMLER KAPATILDI!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 KAPATILAN SİSTEMLER:" -ForegroundColor Cyan
Write-Host "  • Discord Bot" -ForegroundColor White
Write-Host "  • Backend API" -ForegroundColor White
Write-Host "  • Frontend Web Panel" -ForegroundColor White
Write-Host "  • Socket.IO" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tekrar başlatmak için " -ForegroundColor Yellow -NoNewline
Write-Host "start-all.ps1" -ForegroundColor Blue -NoNewline
Write-Host " çalıştırın" -ForegroundColor Yellow
Write-Host ""

Read-Host "Çıkmak için Enter tuşuna basın"
