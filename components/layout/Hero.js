'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const Hero = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    { icon: '🎵', text: 'Müzik Sistemi', color: 'text-discord-green' },
    { icon: '🛡️', text: 'Moderasyon', color: 'text-discord-blurple' },
    { icon: '💰', text: 'Ekonomi', color: 'text-discord-yellow' },
    { icon: '🎫', text: 'Ticket', color: 'text-discord-fuchsia' },
    { icon: '🎉', text: 'Etkinlikler', color: 'text-discord-red' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [features.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const floatVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-discord-blurple/20 to-discord-green/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-discord-fuchsia/15 to-discord-yellow/15 rounded-full blur-3xl"
          animate={{
            x: [0, -60, 0],
            y: [0, 40, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEg0MFY0MEgwVjBaIiBmaWxsPSJ1cmwoI3BhaW50MF9yYWRpYWxfMF8xKSIvPgo8ZGVmcz4KPHJhZGlhbEdyYWRpZW50IGlkPSJwYWludDBfcmFkaWFsXzBfMSIgY3g9IjAiIGN5PSIwIiByPSI0MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM1ODY1ZjIiIHN0b3Atb3BhY2l0eT0iMC4xIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzU4NjVmMiIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K')] opacity-20" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 relative"
      >
        {/* Main heading */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="gradient-text">Discord</span>
            <br />
            <span className="text-white">Botunuz</span>
            <br />
            <motion.span
              key={currentFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className={`${features[currentFeature].color} text-4xl md:text-5xl lg:text-6xl`}
            >
              {features[currentFeature].icon} {features[currentFeature].text}
            </motion.span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div variants={itemVariants} className="mb-12">
          <p className="text-xl md:text-2xl text-discord-gray-light max-w-4xl mx-auto leading-relaxed">
            Discord sunucunuz için <span className="text-discord-green font-semibold">all-in-one</span> çözüm.
            <br />
            <span className="text-discord-blurple">Müzik, moderasyon, ekonomi ve daha fazlası</span> tek bir bot ile!
          </p>
        </motion.div>

        {/* Feature highlights */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full bg-discord-dark-quaternary/50 backdrop-blur-sm border border-discord-dark-quaternary ${
                  index === currentFeature ? 'ring-2 ring-discord-blurple shadow-lg' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-white font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/auth/login"
                className="btn-discord text-lg px-8 py-4 flex items-center space-x-3 group shadow-2xl"
              >
                <svg 
                  viewBox="0 -28.5 256 256" 
                  className="w-6 h-6 fill-current group-hover:scale-110 transition-transform"
                >
                  <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" />
                </svg>
                <span>Hemen Başla</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 bg-white rounded-full opacity-60"
                />
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/demo"
                className="btn-outline text-lg px-8 py-4 flex items-center space-x-3 group"
              >
                <svg className="w-6 h-6 group-hover:text-discord-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Canlı Demo</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-discord-green rounded-full animate-pulse"></div>
              <span className="text-discord-gray-medium">
                <span className="text-white font-bold">15,000+</span> Sunucu
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-discord-blurple rounded-full animate-pulse"></div>
              <span className="text-discord-gray-medium">
                <span className="text-white font-bold">500K+</span> Kullanıcı
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-discord-yellow rounded-full animate-pulse"></div>
              <span className="text-discord-gray-medium">
                <span className="text-white font-bold">99.9%</span> Uptime
              </span>
            </div>
          </div>
        </motion.div>

        {/* Floating Bot Preview */}
        <motion.div 
          variants={floatVariants}
          animate="animate"
          className="mt-16"
        >
          <div className="relative mx-auto max-w-md">
            <div className="bg-gradient-to-br from-discord-dark-secondary to-discord-dark-tertiary rounded-2xl p-6 shadow-2xl border border-discord-dark-quaternary backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-discord-green to-discord-blurple rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">Discord Bot</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-discord-green rounded-full"></div>
                    <span className="text-discord-gray-medium text-sm">Online</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-discord-dark-quaternary/50 rounded-lg p-3">
                  <p className="text-discord-gray-light text-sm">
                    🎵 Şu an çalan: <span className="text-discord-green">Lo-fi Hip Hop</span>
                  </p>
                </div>
                <div className="bg-discord-dark-quaternary/50 rounded-lg p-3">
                  <p className="text-discord-gray-light text-sm">
                    👥 <span className="text-discord-blurple">1,234</span> aktif üye
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-discord-blurple rounded-full opacity-40"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center space-y-2">
          <span className="text-discord-gray-medium text-sm">Aşağı kaydır</span>
          <svg className="w-6 h-6 text-discord-gray-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
