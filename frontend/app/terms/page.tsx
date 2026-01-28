'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0b0f] via-[#13151f] to-[#1a1c2e]">
      {/* Hero Header */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Kullanım Şartları
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
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
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
          <div className="prose prose-invert prose-purple max-w-none">
            {/* 1. Kabul */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">📜</span>
              1. Şartların Kabulü
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Neurovia Discord botunu ("Bot") kullanarak, bu Kullanım Şartlarını kabul etmiş sayılırsınız. 
              Şartları kabul etmiyorsanız, lütfen botu kullanmayın.
            </p>

            {/* 2. Hizmet Açıklaması */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🤖</span>
              2. Hizmet Açıklaması
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Neurovia, Discord sunucuları için aşağıdaki hizmetleri sunan bir Discord botudur:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li>Müzik çalma ve ses yönetimi</li>
              <li>Moderasyon ve sunucu yönetimi</li>
              <li>Ekonomi ve sanal para sistemi</li>
              <li>Seviye ve XP sistemi</li>
              <li>Sosyal medya bildirimleri</li>
              <li>Özelleştirilebilir komutlar ve özellikler</li>
            </ul>

            {/* 3. Kullanıcı Sorumlulukları */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">👤</span>
              3. Kullanıcı Sorumlulukları
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Botu kullanırken aşağıdaki kurallara uymayı kabul edersiniz:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li>Discord'un Hizmet Şartlarına ve Topluluk Kurallarına uymak</li>
              <li>Botu kötüye kullanmamak veya spam amaçlı kullanmamak</li>
              <li>Botu kullanarak yasadışı faaliyetler yürütmemek</li>
              <li>Diğer kullanıcıları taciz etmemek veya rahatsız etmemek</li>
              <li>Botun güvenlik açıklarını istismar etmeye çalışmamak</li>
            </ul>

            {/* 4. Yasaklı Kullanımlar */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">⛔</span>
              4. Yasaklı Kullanımlar
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Aşağıdaki eylemler kesinlikle yasaktır:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li>Botu DDoS veya diğer saldırılar için kullanmak</li>
              <li>Botun kaynak kodunu tersine mühendislik yapmaya çalışmak</li>
              <li>Botu rate limit'leri aşacak şekilde kullanmak</li>
              <li>Telif hakkı ihlali içeren içerikler paylaşmak</li>
              <li>Botun API'sini izinsiz kullanmak veya erişmeye çalışmak</li>
            </ul>

            {/* 5. Veri Toplama */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">💾</span>
              5. Veri Toplama ve Kullanım
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bot, işlevselliğini sağlamak için belirli verileri toplar ve saklar. 
              Detaylı bilgi için lütfen <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">Gizlilik Politikamızı</Link> inceleyin.
            </p>

            {/* 6. Hizmet Kesintileri */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">⚠️</span>
              6. Hizmet Kesintileri ve Değişiklikler
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Herhangi bir zamanda, önceden haber vermeksizin hizmeti değiştirme, askıya alma veya sonlandırma hakkını saklı tutarız. 
              Bakım, güncellemeler veya teknik sorunlar nedeniyle geçici kesintiler yaşanabilir.
            </p>

            {/* 7. Premium Hizmetler */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">👑</span>
              7. Premium Hizmetler
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Premium abonelik satın alırken:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
              <li>Tüm ödemeler Discord veya üçüncü taraf ödeme sağlayıcıları üzerinden yapılır</li>
              <li>Premium özellikler abonelik süresi boyunca geçerlidir</li>
              <li>İade politikası, ödeme sağlayıcısının şartlarına tabidir</li>
              <li>Kötüye kullanım durumunda abonelik iptal edilebilir ve iade yapılmaz</li>
            </ul>

            {/* 8. Fikri Mülkiyet */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">©️</span>
              8. Fikri Mülkiyet Hakları
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bot ve tüm içeriği (logo, tasarım, kod, dokümantasyon) Neurovia'nın mülkiyetindedir 
              ve telif hakkı yasalarıyla korunmaktadır. Yazılı izin olmadan kopyalanamaz, çoğaltılamaz veya dağıtılamaz.
            </p>

            {/* 9. Sorumluluk Reddi */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🛡️</span>
              9. Sorumluluk Reddi
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bot "olduğu gibi" sunulmaktadır. Hizmetin kesintisiz, hatasız veya güvenli olacağına dair garanti vermiyoruz. 
              Botun kullanımından kaynaklanan herhangi bir doğrudan veya dolaylı zarardan sorumlu değiliz.
            </p>

            {/* 10. Hesap Askıya Alma */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🚫</span>
              10. Hesap Askıya Alma ve Sonlandırma
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bu şartları ihlal ederseniz, önceden haber vermeksizin botun hizmetlerine erişiminizi askıya alma 
              veya kalıcı olarak sonlandırma hakkını saklı tutarız.
            </p>

            {/* 11. Değişiklikler */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">🔄</span>
              11. Şartlarda Değişiklikler
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Bu Kullanım Şartlarını istediğimiz zaman güncelleyebiliriz. Değişiklikler bu sayfada yayınlanacak 
              ve "Son Güncelleme" tarihi değiştirilecektir. Devam eden kullanım, güncellenmiş şartları kabul ettiğiniz anlamına gelir.
            </p>

            {/* 12. İletişim */}
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 mt-8">
              <span className="text-3xl">📧</span>
              12. İletişim
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Bu Kullanım Şartları hakkında sorularınız varsa, bizimle iletişime geçin:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2">
              <li><strong>Discord Sunucusu:</strong> <a href="https://discord.gg/neurovia" className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">discord.gg/neurovia</a></li>
              <li><strong>Website:</strong> <a href="https://neuroviabot.xyz" className="text-purple-400 hover:text-purple-300 underline">neuroviabot.xyz</a></li>
            </ul>

            {/* Footer Note */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm italic">
                Bu Kullanım Şartlarını kullanarak, yukarıdaki tüm şart ve koşulları okuduğunuzu, 
                anladığınızı ve kabul ettiğinizi beyan edersiniz.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

