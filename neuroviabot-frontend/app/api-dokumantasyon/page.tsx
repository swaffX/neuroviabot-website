'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CodeBracketIcon, DocumentTextIcon, KeyIcon, ServerIcon } from '@heroicons/react/24/outline';

const endpoints = [
  {
    method: 'GET',
    path: '/api/bot/stats',
    description: 'Bot istatistiklerini getirir (sunucu sayısı, kullanıcı sayısı, komut sayısı)',
    color: 'green',
    example: {
      response: {
        guilds: 72,
        users: 59032,
        commands: 43,
        uptime: '7d 12h 34m'
      }
    }
  },
  {
    method: 'POST',
    path: '/api/nrc/transfer',
    description: 'NRC transfer işlemi yapar. Kullanıcılar arası NeuroCoin transferi.',
    color: 'blue',
    example: {
      request: {
        from: 'user_id_1',
        to: 'user_id_2',
        amount: 1000
      },
      response: {
        success: true,
        transaction_id: 'txn_abc123'
      }
    }
  },
  {
    method: 'GET',
    path: '/api/guilds/:guildId',
    description: 'Sunucu bilgilerini ve ayarlarını getirir.',
    color: 'purple',
    example: {
      response: {
        id: '123456789',
        name: 'Örnek Sunucu',
        memberCount: 1250,
        premium: true
      }
    }
  },
  {
    method: 'GET',
    path: '/api/nrc/balance/:userId',
    description: 'Kullanıcının NRC bakiyesini sorgular.',
    color: 'amber',
    example: {
      response: {
        userId: '987654321',
        balance: 5000,
        lastUpdate: '2025-01-26T22:00:00Z'
      }
    }
  },
  {
    method: 'POST',
    path: '/api/marketplace/list',
    description: 'Marketplace\'te yeni bir ürün listeler.',
    color: 'pink',
    example: {
      request: {
        itemName: 'Premium Rol',
        price: 500,
        description: 'Özel premium rol'
      },
      response: {
        success: true,
        listingId: 'lst_xyz789'
      }
    }
  },
  {
    method: 'GET',
    path: '/api/leaderboard/:guildId',
    description: 'Sunucu lider tablosunu getirir.',
    color: 'cyan',
    example: {
      response: {
        leaderboard: [
          { userId: '111', username: 'User1', xp: 10000, level: 25 },
          { userId: '222', username: 'User2', xp: 8500, level: 22 }
        ]
      }
    }
  }
];

const methodColors: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  POST: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  PUT: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' }
};

export default function APIDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1B23] to-[#0F0F14] text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <motion.div 
          className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
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
            className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-6 ring-1 ring-white/10"
          >
            <CodeBracketIcon className="w-12 h-12 text-purple-400" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
            API Dokümantasyonu
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Neurovia API ile entegrasyonlar oluşturun ve özel uygulamalar geliştirin
          </p>
        </motion.div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: KeyIcon, title: 'API Anahtarı', desc: 'Dashboard\'dan API anahtarınızı alın', color: 'purple' },
            { icon: ServerIcon, title: 'Rate Limit', desc: '100 istek/dakika', color: 'blue' },
            { icon: DocumentTextIcon, title: 'REST API', desc: 'JSON formatında yanıtlar', color: 'cyan' }
          ].map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6">
                  <IconComponent className={`w-10 h-10 text-${item.color}-400 mb-3`} />
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* API Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            API Endpoints
          </h2>
          
          {endpoints.map((endpoint, index) => {
            const methodColor = methodColors[endpoint.method];
            const isSelected = selectedEndpoint === index;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="group"
              >
                <div 
                  onClick={() => setSelectedEndpoint(isSelected ? null : index)}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-6 cursor-pointer hover:border-white/30 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <span className={`px-3 py-1.5 rounded-lg ${methodColor.bg} ${methodColor.text} border ${methodColor.border} font-mono text-sm font-bold`}>
                      {endpoint.method}
                    </span>
                    <div className="flex-1">
                      <code className="text-blue-400 font-mono text-base mb-2 block">
                        {endpoint.path}
                      </code>
                      <p className="text-gray-400 text-sm">{endpoint.description}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: isSelected ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-400"
                    >
                      ▼
                    </motion.div>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <h4 className="text-sm font-semibold text-white mb-3">Örnek Yanıt:</h4>
                      <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto">
                        <code className="text-green-400 text-xs">
                          {JSON.stringify(endpoint.example.response || endpoint.example, null, 2)}
                        </code>
                      </pre>
                      {endpoint.example.request && (
                        <>
                          <h4 className="text-sm font-semibold text-white mb-3 mt-4">Örnek İstek:</h4>
                          <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto">
                            <code className="text-blue-400 text-xs">
                              {JSON.stringify(endpoint.example.request, null, 2)}
                            </code>
                          </pre>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Authentication Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl p-8"
        >
          <h3 className="text-2xl font-bold mb-4 text-white">Authentication</h3>
          <p className="text-gray-400 mb-4">
            Tüm API isteklerinde <code className="px-2 py-1 bg-black/30 rounded text-purple-400">Authorization</code> header'ında API anahtarınızı göndermeniz gerekmektedir:
          </p>
          <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto">
            <code className="text-cyan-400 text-sm">
              {`Authorization: Bearer YOUR_API_KEY`}
            </code>
          </pre>
        </motion.div>
      </div>
    </div>
  );
}
