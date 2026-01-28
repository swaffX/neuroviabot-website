#!/bin/bash

echo "================================================"
echo "🔐 SSH KEY KONTROLÜ"
echo "================================================"

# Public key var mı?
if [ -f ~/.ssh/id_rsa.pub ]; then
    echo "✅ Public key bulundu: ~/.ssh/id_rsa.pub"
    echo ""
    echo "Public Key İçeriği:"
    echo "-------------------"
    cat ~/.ssh/id_rsa.pub
    echo ""
else
    echo "❌ Public key bulunamadı!"
fi

# Private key var mı?
if [ -f ~/.ssh/id_rsa ]; then
    echo "✅ Private key bulundu: ~/.ssh/id_rsa"
    echo ""
    echo "Private Key İlk Satırı (kontrol için):"
    echo "---------------------------------------"
    head -n 1 ~/.ssh/id_rsa
    echo ""
else
    echo "❌ Private key bulunamadı!"
fi

# authorized_keys kontrolü
echo "================================================"
echo "📋 AUTHORIZED_KEYS KONTROLÜ"
echo "================================================"

if [ -f ~/.ssh/authorized_keys ]; then
    echo "✅ authorized_keys bulundu"
    echo ""
    echo "İçeriği:"
    echo "--------"
    cat ~/.ssh/authorized_keys
    echo ""
else
    echo "❌ authorized_keys bulunamadı!"
fi

# SSH dizin izinleri
echo "================================================"
echo "🔒 SSH DİZİN İZİNLERİ"
echo "================================================"
ls -la ~/.ssh/

echo ""
echo "================================================"
echo "✅ Kontrol tamamlandı!"
echo "================================================"
