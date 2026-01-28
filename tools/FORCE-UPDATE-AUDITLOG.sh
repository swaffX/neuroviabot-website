#!/bin/bash

echo "🔧 FORCE UPDATE AuditLog.tsx - Infinite Loop Fix"
echo "================================================"

cd /root/neuroviabot-website/frontend

echo ""
echo "1️⃣ Mevcut AuditLog.tsx'i yedekle..."
cp components/dashboard/AuditLog.tsx components/dashboard/AuditLog.tsx.backup 2>/dev/null || echo "Yedek alınamadı veya dosya yok"

echo ""
echo "2️⃣ Git'ten zorla güncelle..."
git fetch origin main
git checkout origin/main -- components/dashboard/AuditLog.tsx

echo "✅ Git'ten çekildi"

echo ""
echo "3️⃣ Dosya içeriğini doğrula (useCallback olmalı)..."
if grep -q "const fetchLogs = useCallback" components/dashboard/AuditLog.tsx; then
    echo "✅ fetchLogs useCallback kullanıyor - DOĞRU"
else
    echo "❌ fetchLogs useCallback kullanmıyor - HATA!"
    echo "Dosyayı manuel olarak düzelteceğiz..."
fi

echo ""
echo "4️⃣ Dependency array kontrolü..."
if grep -q "filter.type, filter.userId" components/dashboard/AuditLog.tsx; then
    echo "✅ Primitive dependencies kullanılıyor - DOĞRU"
else
    echo "❌ Filter object dependency kullanılıyor - HATA!"
fi

echo ""
echo "5️⃣ PM2'yi durdurup rebuild yapılıyor..."
pm2 delete neuroviabot-frontend 2>/dev/null || true

echo ""
echo "6️⃣ .next klasörünü temizle..."
rm -rf .next

echo ""
echo "7️⃣ Build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build başarısız!"
    exit 1
fi

echo ""
echo "✅ Build başarılı!"

echo ""
echo "8️⃣ Frontend başlat..."
pm2 start npm --name "neuroviabot-frontend" -- start -- -p 3001

echo ""
echo "9️⃣ PM2 kaydet..."
pm2 save

echo ""
echo "🎉 İŞLEM TAMAMLANDI!"
echo ""
pm2 status

echo ""
echo "Lütfen tarayıcıda HARD REFRESH yap (Ctrl+Shift+R veya Ctrl+F5)"
echo "Sonra Denetim Günlüğü sayfasını tekrar aç"

