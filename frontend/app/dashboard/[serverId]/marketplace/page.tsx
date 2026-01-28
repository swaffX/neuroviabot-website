'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  EyeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import ProductRequestForm from '@/components/dashboard/marketplace/ProductRequestForm';

interface ProductRequest {
  requestId: string;
  guildId: string;
  title: string;
  description: string;
  price: number;
  category: 'role' | 'custom';
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  reviewNote?: string;
}

interface ApprovedProduct {
  productId: string;
  title: string;
  description: string;
  price: number;
  isPublished: boolean;
  views: number;
  purchases: number;
  totalRevenue: number;
}

export default function MarketplaceDashboard() {
  const params = useParams();
  const router = useRouter();
  const serverId = params?.serverId as string;

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'published' | 'denied'>('pending');
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [approvedProducts, setApprovedProducts] = useState<ApprovedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    pending: 0,
    approved: 0,
    denied: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (serverId) {
      fetchData();
    }
  }, [serverId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Fetch all requests
      const requestsRes = await axios.get(`${API_URL}/api/marketplace/requests/${serverId}`);
      if (requestsRes.data.success) {
        const allRequests = requestsRes.data.requests;
        setRequests(allRequests);

        // Calculate stats
        setStats({
          totalRequests: allRequests.length,
          pending: allRequests.filter((r: ProductRequest) => r.status === 'pending').length,
          approved: allRequests.filter((r: ProductRequest) => r.status === 'approved').length,
          denied: allRequests.filter((r: ProductRequest) => r.status === 'denied').length,
          totalRevenue: 0, // Will be calculated from products
        });
      }

      // Fetch approved but unpublished products
      const approvedRes = await axios.get(`${API_URL}/api/marketplace/requests/${serverId}/approved`);
      if (approvedRes.data.success) {
        setApprovedProducts(approvedRes.data.products);
      }
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (productId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await axios.post(`${API_URL}/api/marketplace/product/${productId}/publish`);
      
      if (res.data.success) {
        // Refresh data
        fetchData();
        alert('Ürün başarıyla yayınlandı!');
      }
    } catch (error) {
      console.error('Error publishing product:', error);
      alert('Ürün yayınlanırken bir hata oluştu.');
    }
  };

  const handleUnpublish = async (productId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await axios.post(`${API_URL}/api/marketplace/product/${productId}/unpublish`);
      
      if (res.data.success) {
        // Refresh data
        fetchData();
        alert('Ürün yayından kaldırıldı.');
      }
    } catch (error) {
      console.error('Error unpublishing product:', error);
      alert('Ürün yayından kaldırılırken bir hata oluştu.');
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'denied') return r.status === 'denied';
    return false;
  });

  const filteredApproved = approvedProducts.filter(p => {
    if (activeTab === 'approved') return !p.isPublished;
    if (activeTab === 'published') return p.isPublished;
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1018]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 text-lg font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1018] text-white p-8">
      {/* Back Button */}
      <Link
        href={`/dashboard/${serverId}`}
        className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span className="font-semibold">Sunucu Dashboard'a Dön</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Marketplace Yönetimi
            </h1>
            <p className="text-gray-400">Sunucunuz için ürün oluşturun ve satış yapın</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-emerald-500/50"
          >
            <PlusIcon className="w-5 h-5" />
            Ürün Talebi Oluştur
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBagIcon className="w-6 h-6 text-purple-400" />
              <span className="text-gray-400 text-sm font-semibold">Toplam Talep</span>
            </div>
            <p className="text-3xl font-black text-white">{stats.totalRequests}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <ClockIcon className="w-6 h-6 text-yellow-400" />
              <span className="text-gray-400 text-sm font-semibold">Beklemede</span>
            </div>
            <p className="text-3xl font-black text-white">{stats.pending}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              <span className="text-gray-400 text-sm font-semibold">Onaylandı</span>
            </div>
            <p className="text-3xl font-black text-white">{stats.approved}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircleIcon className="w-6 h-6 text-red-400" />
              <span className="text-gray-400 text-sm font-semibold">Reddedildi</span>
            </div>
            <p className="text-3xl font-black text-white">{stats.denied}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CurrencyDollarIcon className="w-6 h-6 text-emerald-400" />
              <span className="text-gray-400 text-sm font-semibold">Toplam Gelir</span>
            </div>
            <p className="text-3xl font-black text-white">{stats.totalRevenue} NRC</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <ClockIcon className="w-5 h-5" />
          Onay Bekleyenler
          {stats.pending > 0 && (
            <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
              {stats.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'approved'
              ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <CheckCircleIcon className="w-5 h-5" />
          Onaylandı - Yayınlanmayı Bekliyor
          {approvedProducts.filter(p => !p.isPublished).length > 0 && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
              {approvedProducts.filter(p => !p.isPublished).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('published')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'published'
              ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <RocketLaunchIcon className="w-5 h-5" />
          Yayında & Aktif
        </button>

        <button
          onClick={() => setActiveTab('denied')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'denied'
              ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <XCircleIcon className="w-5 h-5" />
          Reddedilenler
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Pending & Denied Requests */}
          {(activeTab === 'pending' || activeTab === 'denied') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-lg">
                    {activeTab === 'pending' ? 'Onay bekleyen talep yok' : 'Reddedilen talep yok'}
                  </p>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{request.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{request.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {request.status === 'pending' ? 'Beklemede' : 'Reddedildi'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
                        <span className="text-white font-bold">{request.price} NRC</span>
                      </div>
                      <div className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">
                        {request.category === 'role' ? 'Rol' : 'Özel'}
                      </div>
                    </div>

                    {request.reviewNote && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">
                          <strong>Ret Nedeni:</strong> {request.reviewNote}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-gray-500 text-xs">
                        {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Approved & Published Products */}
          {(activeTab === 'approved' || activeTab === 'published') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApproved.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-lg">
                    {activeTab === 'approved' ? 'Yayınlanmayı bekleyen ürün yok' : 'Yayında ürün yok'}
                  </p>
                </div>
              ) : (
                filteredApproved.map((product) => (
                  <div
                    key={product.productId}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{product.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        product.isPublished
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {product.isPublished ? 'Yayında' : 'Onaylandı'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
                        <span className="text-white font-bold">{product.price} NRC</span>
                      </div>
                    </div>

                    {product.isPublished && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <EyeIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-lg font-bold text-white">{product.views}</span>
                          </div>
                          <p className="text-gray-500 text-xs">Görüntülenme</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <ShoppingBagIcon className="w-4 h-4 text-green-400" />
                            <span className="text-lg font-bold text-white">{product.purchases}</span>
                          </div>
                          <p className="text-gray-500 text-xs">Satış</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <ChartBarIcon className="w-4 h-4 text-emerald-400" />
                            <span className="text-lg font-bold text-white">{product.totalRevenue}</span>
                          </div>
                          <p className="text-gray-500 text-xs">Gelir</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => product.isPublished ? handleUnpublish(product.productId) : handlePublish(product.productId)}
                      className={`w-full py-3 rounded-lg font-bold transition-all ${
                        product.isPublished
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-emerald-500/50'
                      }`}
                    >
                      {product.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Product Request Form */}
      {showCreateForm && (
        <ProductRequestForm
          guildId={serverId}
          guildName={`Server ${serverId}`}
          onClose={() => setShowCreateForm(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

