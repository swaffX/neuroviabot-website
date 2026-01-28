'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0b0f] via-[#13151f] to-[#1a1c2e]">
      {/* Hero Header */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Gizlilik Politikası
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            Son Güncelleme: 2 Ekim 2025
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6"
          >
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ana Sayfaya Dön
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12"
        >
          <div className="prose prose-invert prose-blue max-w-none">
            {/* Giriş */}
            <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <p className="text-gray-300 leading-relaxed mb-0">
                Neurovia olarak, gizliliğinizi ciddiye alıyoruz. Bu Gizlilik Politikası, Discord botumuz aracılığıyla 
                hangi verileri topladığımızı, bunları nasıl kullandığımızı ve koruduğumuzu açıklar.
              </p>
            </div>

            {/* 1. Toplanan Veriler */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">📊</span>
              1. Toplanan Veriler
            </h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.1 Kullanıcı Verileri</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Bot kullandığınızda, aşağıdaki bilgileri Discord API'si aracılığıyla topluyoruz:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li><strong>Kullanıcı ID:</strong> Discord kullanıcı kimliğiniz</li>
              <li><strong>Kullanıcı Adı:</strong> Discord kullanıcı adınız ve etiketiniz</li>
              <li><strong>Avatar:</strong> Profil resminiz (varsa)</li>
              <li><strong>Sunucu Üyelikleri:</strong> Botun bulunduğu sunuculardaki üyelikleriniz</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.2 Sunucu Verileri</h3>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li><strong>Sunucu ID:</strong> Discord sunucu kimliği</li>
              <li><strong>Sunucu Adı:</strong> Sunucu ismi ve simgesi</li>
              <li><strong>Kanal Bilgileri:</strong> Botun aktif olduğu kanallar</li>
              <li><strong>Rol Bilgileri:</strong> Sunucudaki roller ve izinler</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.3 Kullanım Verileri</h3>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li><strong>Komut Kullanımı:</strong> Hangi komutları kullandığınız</li>
              <li><strong>Mesaj İçeriği:</strong> Sadece bot komutları (diğer mesajlar saklanmaz)</li>
              <li><strong>XP ve Seviye:</strong> Seviye sistemi için aktivite puanları</li>
              <li><strong>Ekonomi Verileri:</strong> Sanal para ve işlem geçmişi</li>
              <li><strong>Oynatılan Müzikler:</strong> Müzik komutları ve playlist geçmişi</li>
            </ul>

            {/* 2. Verilerin Kullanımı */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🔧</span>
              2. Verilerin Kullanımı
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Topladığımız verileri şu amaçlarla kullanırız:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li>Bot özelliklerinin çalışmasını sağlamak (müzik, moderasyon, ekonomi vb.)</li>
              <li>Kullanıcı deneyimini kişiselleştirmek</li>
              <li>İstatistikler ve analizler oluşturmak</li>
              <li>Hizmet iyileştirmeleri yapmak</li>
              <li>Kötüye kullanımı tespit etmek ve önlemek</li>
              <li>Destek talepleri için kullanıcıları tanımlamak</li>
            </ul>

            {/* 3. Veri Saklama */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">💾</span>
              3. Veri Saklama ve Güvenlik
            </h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.1 Saklama Süresi</h3>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li><strong>Aktif Kullanıcılar:</strong> Veriler bot kullanıldığı sürece saklanır</li>
              <li><strong>İnaktif Kullanıcılar:</strong> 90 gün aktivite olmadığında otomatik silinir</li>
              <li><strong>Sunucu Verileri:</strong> Bot sunucudan kaldırıldığında 30 gün içinde silinir</li>
              <li><strong>Log Kayıtları:</strong> 30 gün sonra otomatik silinir</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.2 Güvenlik Önlemleri</h3>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li>Veriler şifrelenmiş veritabanlarında saklanır</li>
              <li>Erişim, yalnızca yetkili geliştiricilerle sınırlıdır</li>
              <li>Düzenli güvenlik denetimleri yapılır</li>
              <li>SSL/TLS şifreleme ile veri transferi korunur</li>
            </ul>

            {/* 4. Veri Paylaşımı */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🤝</span>
              4. Veri Paylaşımı
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Verilerinizi aşağıdaki durumlar dışında üçüncü taraflarla <strong>paylaşmayız</strong>:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li><strong>Discord:</strong> Discord API'si üzerinden zorunlu veri alışverişi</li>
              <li><strong>Yasal Gereklilikler:</strong> Mahkeme kararı veya yasal yükümlülük durumunda</li>
              <li><strong>Hizmet Sağlayıcılar:</strong> Hosting ve veritabanı hizmetleri (gizlilik anlaşmalı)</li>
            </ul>
            <p className="text-gray-300 mb-6 leading-relaxed">
              <strong>NOT:</strong> Verilerinizi asla reklam veya pazarlama amaçlı satmıyoruz veya kiralamaız.
            </p>

            {/* 5. Çerezler */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🍪</span>
              5. Çerezler ve Tracking
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Web panelimizde (neuroviabot.xyz) aşağıdaki amaçlarla çerezler kullanırız:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li><strong>Oturum Çerezleri:</strong> Giriş durumunuzu korumak için</li>
              <li><strong>Tercih Çerezleri:</strong> Dil ve tema tercihleriniz için</li>
              <li><strong>Analitik Çerezler:</strong> Site kullanım istatistikleri için (anonim)</li>
            </ul>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Tarayıcı ayarlarınızdan çerezleri reddedebilir veya silebilirsiniz.
            </p>

            {/* 6. Kullanıcı Hakları */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">⚖️</span>
              6. Kullanıcı Hakları (KVKK/GDPR)
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Verileriniz üzerinde aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li><strong>Erişim Hakkı:</strong> Hangi verilerimizin tutulduğunu öğrenebilirsiniz</li>
              <li><strong>Düzeltme Hakkı:</strong> Yanlış verilerin düzeltilmesini talep edebilirsiniz</li>
              <li><strong>Silme Hakkı:</strong> Verilerinizin silinmesini isteyebilirsiniz</li>
              <li><strong>İtiraz Hakkı:</strong> Veri işlemeye itiraz edebilirsiniz</li>
              <li><strong>Taşınabilirlik Hakkı:</strong> Verilerinizin bir kopyasını isteyebilirsiniz</li>
            </ul>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bu haklarınızı kullanmak için Discord sunucumuz üzerinden veya website üzerinden bizimle iletişime geçin.
            </p>

            {/* 7. Çocukların Gizliliği */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">👶</span>
              7. Çocukların Gizliliği
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Botumuz Discord'un Hizmet Şartlarına uygun olarak 13 yaş altı kullanıcılar için tasarlanmamıştır. 
              13 yaş altı bir kullanıcıya ait veri topladığımızı fark edersek, bu verileri derhal sileriz.
            </p>

            {/* 8. Üçüncü Taraf Hizmetler */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🔗</span>
              8. Üçüncü Taraf Hizmetler
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Botumuz aşağıdaki üçüncü taraf hizmetlerini kullanır:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li><strong>Discord API:</strong> Bot işlevselliği için</li>
              <li><strong>YouTube API:</strong> Müzik çalmak için</li>
              <li><strong>Spotify API:</strong> Spotify entegrasyonu için</li>
              <li><strong>Twitch API:</strong> Canlı yayın bildirimleri için</li>
            </ul>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bu hizmetlerin kendi gizlilik politikaları vardır ve onların şartlarına da tabi olursunuz.
            </p>

            {/* 9. Veri İhlali */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🚨</span>
              9. Veri İhlali Bildirimi
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bir veri ihlali durumunda, etkilenen kullanıcıları 72 saat içinde Discord sunucumuz veya 
              e-posta yoluyla bilgilendireceğiz ve gerekli önlemleri alacağız.
            </p>

            {/* 10. Değişiklikler */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🔄</span>
              10. Politika Değişiklikleri
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler için 
              Discord sunucumuz üzerinden duyuru yapacağız. "Son Güncelleme" tarihini kontrol ederek 
              en güncel sürümü görebilirsiniz.
            </p>

            {/* 11. İletişim */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">📧</span>
              11. İletişim
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Gizlilik ile ilgili sorularınız veya veri talepleriniz için:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2">
              <li><strong>Discord Sunucusu:</strong> <a href="https://discord.gg/neurovia" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">discord.gg/neurovia</a></li>
              <li><strong>Website:</strong> <a href="https://neuroviabot.xyz" className="text-blue-400 hover:text-blue-300 underline">neuroviabot.xyz</a></li>
              <li><strong>Veri Silme:</strong> Discord sunucumuzda <code className="px-2 py-1 bg-white/10 rounded">/deletedata</code> komutunu kullanın</li>
            </ul>

            {/* Footer Note */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm italic">
                Bu Gizlilik Politikası, KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR 
                (General Data Protection Regulation) uyumludur.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

