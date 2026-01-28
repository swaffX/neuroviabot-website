'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  QuestionMarkCircleIcon, 
  ChatBubbleLeftRightIcon, 
  BookOpenIcon,
  LifebuoyIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const faqs = [
  {
    question: 'Botu nasıl eklerim?',
    answer: 'Ana sayfadaki "Discord\'a Ekle" butonuna tıklayarak Discord yetkilendirme sayfasına yönlendirileceksiniz. Sunucunuzu seçin ve gerekli izinleri vererek botu ekleyebilirsiniz.',
    category: 'Başlangıç'
  },
  {
    question: 'Premium özellikleri nelerdir?',
    answer: 'Premium üyelikle gelişmiş analitik, özel komutlar, öncelikli destek, reklamsız deneyim, özel roller ve daha fazla özelleştirilmiş bot deneyimine erişebilirsiniz.',
    category: 'Premium'
  },
  {
    question: 'Moderasyon komutları nasıl kullanılır?',
    answer: 'Moderasyon komutlarını kullanmak için sunucunuzda yeterli yetkilere sahip olmanız gerekir. /ban, /kick, /mute gibi komutlarla moderasyon yapabilir, /automod ile otomatik moderasyon kuralları ayarlayabilirsiniz.',
    category: 'Moderasyon'
  },
  {
    question: 'Seviye sistemi nasıl çalışır?',
    answer: 'Kullanıcılar sunucuda mesaj gönderdikçe XP kazanır ve seviye atlar. /level komutuyla mevcut seviyenizi, /leaderboard ile sunucu lider tablosunu görüntüleyebilirsiniz. Sunucu sahipleri /levelconfig ile seviye sistemini özelleştirebilir.',
    category: 'Seviye Sistemi'
  },
  {
    question: 'Ticket sistemi nasıl kullanılır?',
    answer: 'Ticket sistemi ile kullanıcılar özel destek kanalları açabilir. /ticket komutu ile ayarları yapılandırabilir, kullanıcılar panel üzerinden ticket oluşturabilir. Her ticket özel bir kanal olarak açılır.',
    category: 'Destek'
  },
  {
    question: 'Çekiliş sistemi nasıl çalışır?',
    answer: 'Çekiliş sistemi ile sunucunuzda otomatik çekilişler düzenleyebilirsiniz. /giveaway komutu ile çekiliş başlatabilir, süre, kazanan sayısı ve ödül belirleyebilirsiniz.',
    category: 'Etkinlik'
  },
  {
    question: 'Bot çevrimdışı görünüyor, ne yapmalıyım?',
    answer: 'Öncelikle bot\'un sunucunuzda olduğundan ve gerekli izinlere sahip olduğundan emin olun. Eğer sorun devam ediyorsa, Discord sunucumuzdan destek talep edebilir veya /status komutu ile bot durumunu kontrol edebilirsiniz.',
    category: 'Teknik'
  },
  {
    question: 'Dashboard üzerinden neleri yönetebilirim?',
    answer: 'Dashboard ile sunucu ayarlarınızı, moderasyon kurallarınızı, hoşgeldin mesajlarınızı, oto-rol sistemlerini ve daha fazlasını web üzerinden kolayca yönetebilirsiniz.',
    category: 'Dashboard'
  },
  {
    question: 'Özel komutlar nasıl oluşturulur?',
    answer: 'Premium üyeler /customcommand komutu ile özel komutlar oluşturabilir. Komut adı, yanıtı ve tetiklenme koşullarını belirleyerek sunucunuza özel etkileşimli komutlar ekleyebilirsiniz.',
    category: 'Özelleştirme'
  }
];

export default function SupportPage() {
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  const categories = ['Tümü', ...Array.from(new Set(faqs.map(faq => faq.category)))];
  const filteredFaqs = selectedCategory === 'Tümü' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <motion.div 
          className="absolute top-0 -left-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="relative z-10 h-20"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Ana Sayfaya Dön
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-block p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl mb-6 ring-1 ring-white/10"
          >
            <LifebuoyIcon className="w-12 h-12 text-cyan-400" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            Destek Merkezi
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Size yardımcı olmak için buradayız. Sorularınızın yanıtlarını bulun veya bizimle iletişime geçin.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { 
              icon: ChatBubbleLeftRightIcon, 
              title: 'Discord Sunucusu', 
              desc: 'Topluluk ve anlık destek',
              link: 'https://discord.gg/Neurovia',
              gradient: 'from-blue-500 to-cyan-500'
            },
            { 
              icon: BookOpenIcon, 
              title: 'Dokümantasyon', 
              desc: 'Detaylı kullanım kılavuzları',
              link: '/api-dokumantasyon',
              gradient: 'from-purple-500 to-pink-500'
            },
            { 
              icon: SparklesIcon, 
              title: 'Komutlar', 
              desc: 'Tüm bot komutları',
              link: '/komutlar',
              gradient: 'from-amber-500 to-orange-500'
            }
          ].map((action, index) => {
            const IconComponent = action.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                <Link 
                  href={action.link}
                  target={action.link.startsWith('http') ? '_blank' : undefined}
                  rel={action.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-8 cursor-pointer hover:border-white/30 transition-all duration-500">
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>

                    <div className="relative z-10">
                      <motion.div
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} bg-opacity-20 flex items-center justify-center mb-4 ring-1 ring-white/20`}
                      >
                        <IconComponent className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">{action.title}</h3>
                      <p className="text-gray-400 text-sm">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            Sık Sorulan Sorular
          </h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {filteredFaqs.map((faq, index) => {
                const isSelected = selectedFaq === index;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div
                      onClick={() => setSelectedFaq(isSelected ? null : index)}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 cursor-pointer hover:border-white/30 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg border border-cyan-500/30">
                              {faq.category}
                            </span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                              </motion.div>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                            {faq.question}
                          </h3>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-gray-400 text-sm leading-relaxed mt-3 pt-3 border-t border-white/10"
                              >
                                {faq.answer}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                        <motion.div
                          animate={{ rotate: isSelected ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-gray-400 flex-shrink-0"
                        >
                          ▼
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl p-12 text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"
          />
          
          <div className="relative z-10">
            <QuestionMarkCircleIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Sorunuz mu var?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Aradığınız cevabı bulamadınız mı? Discord sunucumuzdan bize ulaşın, ekibimiz size yardımcı olmaktan mutluluk duyar!
            </p>
            <motion.a
              href="https://discord.gg/Neurovia"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl text-white font-bold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Discord'da Soru Sor
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
