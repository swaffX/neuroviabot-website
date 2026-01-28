'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import {
  CheckIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  popular?: boolean;
  features: string[];
}

export default function PremiumPage() {
  const { user } = useUser();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/premium/plans`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    if (planId === 'enterprise') return RocketLaunchIcon;
    if (planId === 'pro') return BoltIcon;
    return SparklesIcon;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/50 rounded-full mb-6">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">Premium Plans</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">
            Botunuzu Güçlendirin
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Sunucunuzu bir sonraki seviyeye taşıyacak premium özelliklerin kilidini açın
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(plan.id);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-gray-800/50 border rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-purple-500 shadow-xl shadow-purple-500/20'
                    : 'border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm font-bold">
                    En Popüler
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                    plan.id === 'enterprise' ? 'from-yellow-500 to-orange-600' :
                    plan.id === 'pro' ? 'from-purple-500 to-pink-600' :
                    'from-blue-500 to-cyan-600'
                  } flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-black text-white">Ücretsiz</span>
                    ) : (
                      <>
                        <span className="text-4xl font-black text-white">${plan.price}</span>
                        <span className="text-gray-400">/{plan.interval}</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (!user) {
                      window.location.href = '/login';
                    } else {
                      alert('Ödeme sistemi yakında aktif olacak!');
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-bold transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {plan.price === 0 ? 'Mevcut Plan' : 'Yükselt'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8"
        >
          <h2 className="text-3xl font-black text-white mb-8 text-center">
            Özellik Karşılaştırması
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Özellik</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Free</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Pro</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="py-4 px-4 text-gray-300">Özel Komutlar</td>
                  <td className="text-center py-4 px-4 text-gray-400">10</td>
                  <td className="text-center py-4 px-4 text-green-400">Sınırsız</td>
                  <td className="text-center py-4 px-4 text-green-400">Sınırsız</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-300">NeuroCoin Ödülleri</td>
                  <td className="text-center py-4 px-4 text-gray-400">1x</td>
                  <td className="text-center py-4 px-4 text-purple-400">2x</td>
                  <td className="text-center py-4 px-4 text-yellow-400">5x</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-300">Tepki Rolleri</td>
                  <td className="text-center py-4 px-4"><XIcon /></td>
                  <td className="text-center py-4 px-4"><CheckIcon className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckIcon className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-300">Premium Destek</td>
                  <td className="text-center py-4 px-4"><XIcon /></td>
                  <td className="text-center py-4 px-4"><CheckIcon className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4 text-yellow-400">Öncelikli</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

