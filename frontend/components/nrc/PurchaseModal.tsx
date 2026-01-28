'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  XMarkIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Product } from './ProductCard';

interface PurchaseModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseModal({ product, onClose, onSuccess }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Fetch user balance on mount
  React.useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await axios.get(`${API_URL}/api/nrc/balance`);

      if (response.data.success) {
        setUserBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Bakiye bilgisi alınamadı');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handlePurchase = async () => {
    if (userBalance === null) {
      setError('Bakiye bilgisi yüklenemedi');
      return;
    }

    if (userBalance < product.price) {
      setError('Yetersiz bakiye!');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

      const response = await axios.post(`${API_URL}/api/marketplace/purchase/${product.id}`);

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      setError(
        error.response?.data?.error || 'Satın alma işlemi başarısız oldu'
      );
    } finally {
      setLoading(false);
    }
  };

  const hasInsufficientBalance = userBalance !== null && userBalance < product.price;

  return (
    <div className="purchase-modal-overlay" onClick={onClose}>
      <motion.div
        className="purchase-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {!success ? (
          <>
            {/* Header */}
            <div className="purchase-modal-header">
              <div className="purchase-modal-icon">
                <ShoppingBagIcon className="w-8 h-8" />
              </div>
              <h2 className="purchase-modal-title">Satın Alma Onayı</h2>
              <button onClick={onClose} className="purchase-modal-close">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Product Info */}
            <div className="purchase-product-info">
              <div className="purchase-product-icon">
                {product.icon}
              </div>
              <div className="purchase-product-details">
                <h3 className="purchase-product-title">{product.title}</h3>
                <p className="purchase-product-description">
                  {product.description.substring(0, 100)}
                  {product.description.length > 100 && '...'}
                </p>
              </div>
            </div>

            {/* Price & Balance */}
            <div className="purchase-pricing">
              <div className="purchase-pricing-row">
                <span className="purchase-pricing-label">Ürün Fiyatı:</span>
                <span className="purchase-pricing-value">
                  <CurrencyDollarIcon className="w-5 h-5" />
                  {product.price} NRC
                </span>
              </div>

              {loadingBalance ? (
                <div className="purchase-pricing-row">
                  <span className="purchase-pricing-label">Bakiyeniz:</span>
                  <span className="purchase-pricing-value">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    Yükleniyor...
                  </span>
                </div>
              ) : (
                <div className="purchase-pricing-row">
                  <span className="purchase-pricing-label">Bakiyeniz:</span>
                  <span
                    className={`purchase-pricing-value ${hasInsufficientBalance ? 'text-red-400' : 'text-emerald-400'
                      }`}
                  >
                    <CurrencyDollarIcon className="w-5 h-5" />
                    {userBalance} NRC
                  </span>
                </div>
              )}

              {!loadingBalance && userBalance !== null && (
                <div className="purchase-pricing-row purchase-pricing-row-total">
                  <span className="purchase-pricing-label">İşlem Sonrası Bakiye:</span>
                  <span
                    className={`purchase-pricing-value ${hasInsufficientBalance ? 'text-red-400' : 'text-white'
                      }`}
                  >
                    <CurrencyDollarIcon className="w-5 h-5" />
                    {Math.max(0, userBalance - product.price)} NRC
                  </span>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="purchase-delivery-info">
              <div className="purchase-delivery-icon">
                <TruckIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="purchase-delivery-title">Teslimat Bilgisi</h4>
                <p className="purchase-delivery-description">
                  Ödeme sonrası ürün otomatik olarak hesabınıza tanımlanacaktır.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="purchase-error">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance && !error && (
              <div className="purchase-warning">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <p>Yetersiz bakiye! Satın almak için bakiyenizi yükleyin.</p>
              </div>
            )}

            {/* Actions */}
            <div className="purchase-modal-actions">
              <button
                onClick={onClose}
                disabled={loading}
                className="purchase-btn purchase-btn-cancel"
              >
                İptal
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading || hasInsufficientBalance || loadingBalance}
                className="purchase-btn purchase-btn-confirm"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Satın Al
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          // Success State
          <div className="purchase-success">
            <motion.div
              className="purchase-success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
            >
              <CheckCircleIcon className="w-24 h-24" />
            </motion.div>
            <h2 className="purchase-success-title">Satın Alma Başarılı!</h2>
            <p className="purchase-success-description">
              {product.title} başarıyla satın alındı. Ürün hesabınıza tanımlandı.
            </p>
            <div className="purchase-success-details">
              <div className="purchase-success-detail">
                <span className="purchase-success-detail-label">Ürün:</span>
                <span className="purchase-success-detail-value">{product.title}</span>
              </div>
              <div className="purchase-success-detail">
                <span className="purchase-success-detail-label">Ödenen:</span>
                <span className="purchase-success-detail-value">{product.price} NRC</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

