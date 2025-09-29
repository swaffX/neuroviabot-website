@echo off
cls
echo ========================================
echo   DISCORD BOT FULL STACK STARTER
echo ========================================
echo.
echo 🚀 Tum sistemler baslatiliyor...
echo.

REM Kill existing processes
echo 🔄 Eski processleri temizleniyor...
taskkill /F /IM node.exe 2>nul >nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

echo.
echo 🎯 Sistemler baslatiliyor:
echo   • Database: SQLite (otomatik)
echo   • Backend API: http://localhost:3001
echo   • Frontend Web: http://localhost:3002  
echo   • Discord Bot: Online
echo.

REM Start Backend (Bot + API + Socket.IO)
echo 📡 Backend + Bot baslatiliyor...
start "Discord Bot Backend" cmd /k "title Discord Bot Backend && node index.js"

REM Wait for backend to initialize
echo ⏳ Backend hazirlanirken bekleniyor... (10 saniye)
timeout /t 10 /nobreak >nul

REM Start Frontend
echo 🌐 Frontend baslatiliyor...
cd web\frontend
start "Frontend Dashboard" cmd /k "title Frontend Dashboard && set PORT=3002 && npm start"
cd ..\..

echo.
echo ✅ TUM SISTEMLER BASLATILDI!
echo.
echo 🌍 ERISIM LINKLERI:
echo   • Web Panel: http://localhost:3002
echo   • API Backend: http://localhost:3001  
echo   • Socket.IO: ws://localhost:3001
echo.
echo 💡 IPUCLARI:
echo   • Bot durumunu Discord'da kontrol edin
echo   • Web panel'de giris yapmak icin Discord hesabinizi kullanin
echo   • Hata logu icin Backend penceresine bakin
echo.
echo 🔧 KAPATMAK ICIN:
echo   • Bu pencereyi kapatin
echo   • Veya stop-all.bat calistirin
echo.
echo Program devam ediyor... Pencereyi kapatabilirsiniz.
pause
