'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const features = [
    {
      icon: '🎵',
      title: 'Premium Müzik Sistemi',
      description: 'YouTube, Spotify ve SoundCloud desteği ile kristal kalitede müzik deneyimi.',
      color: 'from-discord-green/20 to-discord-blurple/20',
      borderColor: 'border-discord-green/30',
      details: [
        '24/7 kesintisiz müzik',
        'Playlist yönetimi',
        'Ses efektleri',
        'Kuyruk kontrolü'
      ]
    },
    {
      icon: '🛡️',
      title: 'Gelişmiş Moderasyon',
      description: 'Otomatik spam koruması, rol yönetimi ve detaylı moderasyon araçları.',
      color: 'from-discord-blurple/20 to-discord-fuchsia/20',
      borderColor: 'border-discord-blurple/30',
      details: [
        'Anti-spam sistemi',
        'Otomatik moderasyon',
        'Uyarı sistemi',
        'Güvenlik logları'
      ]
    },
    {
      icon: '💰',
      title: 'Ekonomi & Leveling',
      description: 'Kullanıcı seviye sistemi, ekonomi oyunları ve ödül mekanizmaları.',
      color: 'from-discord-yellow/20 to-discord-green/20',
      borderColor: 'border-discord-yellow/30',
      details: [
        'XP ve seviye sistemi',
        'Günlük ödüller',
        'Casino oyunları',
        'Leaderboard'
      ]
    },
    {
      icon: '🎫',
      title: 'Profesyonel Ticket',
      description: 'Kategorize destek sistemi ve otomatik ticket yönetimi.',
      color: 'from-discord-fuchsia/20 to-discord-red/20',
      borderColor: 'border-discord-fuchsia/30',
      details: [
        'Kategori sistemi',
        'Otomatik arşivleme',
        'Personel yönetimi',
        'Transcript kayıtları'
      ]
    },
    {
      icon: '🎉',
      title: 'Etkinlik Yönetimi',
      description: 'Çekiliş, etkinlik ve topluluk etkileşimi araçları.',
      color: 'from-discord-red/20 to-discord-yellow/20',
      borderColor: 'border-discord-red/30',
      details: [
        'Otomatik çekilişler',
        'Etkinlik takvimi',
        'Rol ödülleri',
        'Anketler ve oylamalar'
      ]
    },
    {
      icon: '📊',
      title: 'Analytics & Dashboard',
      description: 'Gerçek zamanlı istatistikler ve web tabanlı yönetim paneli.',
      color: 'from-discord-blurple/20 to-discord-green/20',
      borderColor: 'border-discord-blurple/30',
      details: [
        'Canlı istatistikler',
        'Web dashboard',
        'Grafiksel raporlar',
        'API entegrasyonu'
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-discord-blurple/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-discord-green/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6 gradient-text"
            animate={isInView ? { 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
            } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Güçlü Özellikler
          </motion.h2>
          <p className="text-xl text-discord-gray-light max-w-3xl mx-auto">
            Discord sunucunuz için ihtiyacınız olan tüm araçları tek bir bot ile keşfedin.
            Profesyonel özellikler, modern tasarım.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                z: 50
              }}
              className={`relative group cursor-pointer transform-gpu perspective-1000`}
            >
              <div className={`
                bg-gradient-to-br ${feature.color} 
                backdrop-blur-sm border ${feature.borderColor}
                rounded-2xl p-6 h-full 
                transition-all duration-300 
                hover:shadow-2xl hover:shadow-discord-blurple/20
                relative overflow-hidden
              `}>
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12 group-hover:translate-x-full" style={{ animationDelay: `${index * 0.1}s` }} />
                
                {/* Icon */}
                <motion.div
                  className="text-5xl mb-4 filter drop-shadow-lg"
                  whileHover={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: 1.2 
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-discord-green transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-discord-gray-light mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Feature details */}
                <div className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <motion.div
                      key={detailIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ 
                        delay: 0.2 + (index * 0.1) + (detailIndex * 0.05),
                        duration: 0.4
                      }}
                      className="flex items-center space-x-2 text-sm text-discord-gray-medium group-hover:text-discord-gray-light transition-colors"
                    >
                      <motion.div
                        className="w-2 h-2 bg-discord-green rounded-full"
                        whileHover={{ scale: 1.5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      />
                      <span>{detail}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Interactive element */}
                <motion.div
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-8 h-8 bg-discord-blurple/30 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-discord-blurple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </motion.div>

                {/* Particle effects */}
                {[...Array(3)].map((_, particleIndex) => (
                  <motion.div
                    key={particleIndex}
                    className="absolute w-1 h-1 bg-discord-blurple rounded-full opacity-0 group-hover:opacity-60"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 0.6, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-discord-dark-secondary/50 to-discord-dark-tertiary/50 backdrop-blur-sm border border-discord-dark-quaternary rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Daha Fazlasını Keşfet
            </h3>
            <p className="text-discord-gray-light mb-6">
              Tüm özelliklerimizi deneyimlemek ve botun gücünü keşfetmek için hemen başlayın.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-discord px-8 py-3 group"
            >
              <span>Detayları Görüntüle</span>
              <motion.svg
                className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
