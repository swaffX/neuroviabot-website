'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const Statistics = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });
  
  const [counts, setCounts] = useState({
    servers: 0,
    users: 0,
    commands: 0,
    uptime: 0
  });

  const targetCounts = {
    servers: 15247,
    users: 523891,
    commands: 1547823,
    uptime: 99.9
  };

  const stats = [
    {
      icon: '🏠',
      label: 'Aktif Sunucu',
      value: counts.servers,
      suffix: '+',
      color: 'text-discord-green',
      bgColor: 'from-discord-green/20 to-discord-green/10',
      description: 'Botumuzun aktif olarak hizmet verdiği Discord sunucu sayısı'
    },
    {
      icon: '👥',
      label: 'Toplam Kullanıcı',
      value: counts.users,
      suffix: '+',
      color: 'text-discord-blurple',
      bgColor: 'from-discord-blurple/20 to-discord-blurple/10',
      description: 'Botumuzla etkileşime geçen toplam kullanıcı sayısı'
    },
    {
      icon: '⚡',
      label: 'Çalıştırılan Komut',
      value: counts.commands,
      suffix: '+',
      color: 'text-discord-yellow',
      bgColor: 'from-discord-yellow/20 to-discord-yellow/10',
      description: 'Toplam çalıştırılan bot komut sayısı'
    },
    {
      icon: '🚀',
      label: 'Uptime',
      value: counts.uptime,
      suffix: '%',
      color: 'text-discord-fuchsia',
      bgColor: 'from-discord-fuchsia/20 to-discord-fuchsia/10',
      description: 'Bot çalışır durumda kalma oranı'
    }
  ];

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      setCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        let allCompleted = true;

        Object.keys(targetCounts).forEach(key => {
          const target = targetCounts[key];
          const current = prevCounts[key];
          const increment = target / steps;
          
          if (current < target) {
            newCounts[key] = Math.min(current + increment, target);
            allCompleted = false;
          }
        });

        if (allCompleted) {
          clearInterval(timer);
          // Set exact target values
          setCounts(targetCounts);
        }

        return newCounts;
      });
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView]);

  const formatNumber = (num, suffix = '') => {
    if (suffix === '%') return num.toFixed(1);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return Math.floor(num);
  };

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
    hidden: { opacity: 0, y: 50, scale: 0.8 },
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-discord-blurple/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-l from-discord-green/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Güvenilir Performans
          </h2>
          <p className="text-xl text-discord-gray-light max-w-3xl mx-auto">
            Binlerce sunucu ve milyonlarca kullanıcının güvendiği, 
            kesintisiz hizmet sunan Discord botu.
          </p>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                z: 20
              }}
              className="group cursor-pointer transform-gpu"
            >
              <div className={`
                bg-gradient-to-br ${stat.bgColor} 
                backdrop-blur-sm border border-white/10
                rounded-2xl p-6 text-center relative overflow-hidden
                transition-all duration-300 hover:shadow-2xl hover:shadow-discord-blurple/20
              `}>
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                />

                {/* Icon */}
                <motion.div
                  className="text-4xl mb-4 filter drop-shadow-lg"
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {stat.icon}
                </motion.div>

                {/* Number */}
                <motion.div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                  {formatNumber(stat.value)}{stat.suffix}
                </motion.div>

                {/* Label */}
                <h3 className="text-white font-semibold mb-3 group-hover:text-discord-green transition-colors">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-discord-gray-medium text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  {stat.description}
                </p>

                {/* Progress bar effect */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 group-hover:opacity-100 transition-opacity">
                  <motion.div
                    className={`h-full ${stat.color.replace('text-', 'bg-')}`}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: '100%' } : { width: 0 }}
                    transition={{ duration: 2, delay: index * 0.2 }}
                  />
                </div>

                {/* Floating particles */}
                {[...Array(3)].map((_, particleIndex) => (
                  <motion.div
                    key={particleIndex}
                    className={`absolute w-1 h-1 ${stat.color.replace('text-', 'bg-')} rounded-full opacity-0 group-hover:opacity-60`}
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

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {/* Response Time */}
          <div className="bg-gradient-to-br from-discord-dark-secondary/50 to-discord-dark-tertiary/50 backdrop-blur-sm border border-discord-dark-quaternary rounded-2xl p-6 text-center">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-white font-bold mb-2">Yanıt Süresi</h3>
            <div className="flex items-center justify-center space-x-2">
              <motion.div
                className="w-3 h-3 bg-discord-green rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-discord-green font-bold">~50ms</span>
            </div>
            <p className="text-discord-gray-medium text-sm mt-2">Ortalama komut yanıt süresi</p>
          </div>

          {/* Global Coverage */}
          <div className="bg-gradient-to-br from-discord-dark-secondary/50 to-discord-dark-tertiary/50 backdrop-blur-sm border border-discord-dark-quaternary rounded-2xl p-6 text-center">
            <div className="text-2xl mb-3">🌍</div>
            <h3 className="text-white font-bold mb-2">Global Erişim</h3>
            <div className="flex items-center justify-center space-x-2">
              <motion.div
                className="w-3 h-3 bg-discord-blurple rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
              <span className="text-discord-blurple font-bold">15+ Bölge</span>
            </div>
            <p className="text-discord-gray-medium text-sm mt-2">Dünya çapında sunucu desteği</p>
          </div>

          {/* Security */}
          <div className="bg-gradient-to-br from-discord-dark-secondary/50 to-discord-dark-tertiary/50 backdrop-blur-sm border border-discord-dark-quaternary rounded-2xl p-6 text-center">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="text-white font-bold mb-2">Güvenlik</h3>
            <div className="flex items-center justify-center space-x-2">
              <motion.div
                className="w-3 h-3 bg-discord-yellow rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
              />
              <span className="text-discord-yellow font-bold">SSL + OWASP</span>
            </div>
            <p className="text-discord-gray-medium text-sm mt-2">Enterprise seviye güvenlik</p>
          </div>
        </motion.div>

        {/* Real-time indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center space-x-2 text-discord-gray-medium">
            <motion.div
              className="w-2 h-2 bg-discord-green rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm">Gerçek zamanlı istatistikler</span>
            <motion.div
              className="w-2 h-2 bg-discord-green rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Statistics;
