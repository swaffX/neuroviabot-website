'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, NewspaperIcon, CalendarIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function BlogPage() {
  const posts = [
    {
      title: 'Neurovia 2.0 Güncellemesi',
      excerpt: 'Yeni NRC ekonomi sistemi, gelişmiş moderasyon ve daha fazlası ile Discord sunucunuzu bir üst seviyeye taşıyın.',
      date: '13 Ocak 2025',
      author: 'NeuroVia Team',
      category: 'Güncellemeler',
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      title: 'Discord Sunucunuzu Nasıl Büyütürsünüz?',
      excerpt: 'Etkili stratejiler ve ipuçları ile topluluğunuzu geliştirin. Organik büyüme ve etkileşim artırma yöntemleri.',
      date: '10 Ocak 2025',
      author: 'NeuroVia Team',
      category: 'Rehber',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'NRC Ekonomi Sistemi Detayları',
      excerpt: 'NeuroCoin ile sunucunuzda dinamik bir ekonomi oluşturun. P2P trading, marketplace ve daha fazlası.',
      date: '5 Ocak 2025',
      author: 'NeuroVia Team',
      category: 'Özellikler',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Moderasyon En İyi Pratikleri',
      excerpt: 'Sunucunuzu güvenli tutmak için profesyonel moderasyon teknikleri ve otomatik araçlar.',
      date: '28 Aralık 2024',
      author: 'NeuroVia Team',
      category: 'Rehber',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      title: 'Premium Özellikleri Keşfedin',
      excerpt: 'Premium üyelikle sunucunuza özel özellikler kazandırın. Gelişmiş analitik ve öncelikli destek.',
      date: '20 Aralık 2024',
      author: 'NeuroVia Team',
      category: 'Premium',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      title: 'AI Chatbot Entegrasyonu',
      excerpt: 'Yapay zeka destekli sohbet robotu ile kullanıcı deneyimini geliştirin. Akıllı yanıtlar ve öğrenme.',
      date: '15 Aralık 2024',
      author: 'NeuroVia Team',
      category: 'Özellikler',
      gradient: 'from-cyan-500 to-teal-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <motion.div 
          className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
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
          className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
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
        <motion.div 
          className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, 30, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
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
            className="inline-block p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl mb-6 ring-1 ring-white/10"
          >
            <NewspaperIcon className="w-12 h-12 text-blue-400" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
            Blog
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Güncellemeler, rehberler ve topluluk içerikleri
          </p>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ 
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="group relative cursor-pointer"
            >
              {/* Glassmorphism Card */}
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 transition-all duration-500 ease-out hover:border-white/30 hover:shadow-[0_8px_32px_rgba(59,130,246,0.2)]">
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>

                <div className="relative z-10">
                  {/* Category Badge */}
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className={`inline-block px-3 py-1.5 bg-gradient-to-r ${post.gradient} bg-opacity-20 text-white rounded-full text-xs font-medium mb-4 ring-1 ring-white/20`}
                  >
                    {post.category}
                  </motion.span>
                  
                  {/* Title */}
                  <h2 className="text-xl font-bold mb-3 text-white group-hover:text-blue-200 transition-colors duration-300">
                    {post.title}
                  </h2>
                  
                  {/* Excerpt */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{post.date}</span>
                      </div>
                    </div>
                    
                    {/* Read More */}
                    <motion.div
                      className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300"
                      whileHover={{ x: 5 }}
                    >
                      <span className="text-xs font-medium">Devamını Oku</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </motion.div>
                  </div>
                  
                  {/* Author */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-3 pt-3 border-t border-white/5">
                    <UserIcon className="w-3 h-3" />
                    <span>{post.author}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10">
            <p className="text-gray-400">
              Daha fazla içerik yakında... 🚀
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
