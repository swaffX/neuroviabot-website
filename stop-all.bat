@echo off
cls
echo ========================================
echo   DISCORD BOT SYSTEM SHUTDOWN
echo ========================================
echo.
echo 🛑 Tum sistemler kapatiliyor...
echo.

REM Kill all node processes
echo 🔄 Node.js processleri kapatiliyor...
taskkill /F /IM node.exe 2>nul >nul

REM Kill cmd processes with specific titles (if any)
echo 🔄 Backend ve Frontend pencerelerini kapatiliyor...
taskkill /FI "WINDOWTITLE eq Discord Bot Backend" /F 2>nul >nul
taskkill /FI "WINDOWTITLE eq Frontend Dashboard" /F 2>nul >nul

REM Wait a moment
timeout /t 2 /nobreak >nul

echo.
echo ✅ TUM SISTEMLER KAPATILDI!
echo.
echo 📊 KAPATILAN SISTEMLER:
echo   • Discord Bot
echo   • Backend API
echo   • Frontend Web Panel
echo   • Socket.IO
echo.
echo 💡 Tekrar baslatmak icin start-all.bat calistirin
echo.
pause
