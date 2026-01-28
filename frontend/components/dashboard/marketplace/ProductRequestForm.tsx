'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PhotoIcon,
  SparklesIcon,
  CubeIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ProductRequestFormProps {
  guildId: string;
  guildName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  category: 'role' | 'custom';
  title: string;
  icon: string;
  images: string[];
  description: string;
  price: number;
  seller: string;
  deliveryType: 'instant' | 'manual';
  deliveryData: {
    roleId?: string;
    roleName?: string;
    roleColor?: string;
    duration?: number;
    customInstructions?: string;
  };
}

export default function ProductRequestForm({ guildId, guildName, onClose, onSuccess }: ProductRequestFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    category: 'role',
    title: '',
    icon: '⭐',
    images: [],
    description: '',
    price: 100,
    seller: guildName,
    deliveryType: 'manual',
    deliveryData: {
      duration: 0,
    },
  });

  const iconOptions = ['⭐', '💎', '👑', '🏆', '🎯', '🔥', '💰', '🎁', '🌟', '✨'];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Başlık gerekli';
      if (formData.title.length > 100) newErrors.title = 'Başlık 100 karakterden uzun olamaz';
    }

    if (step === 2) {
      if (!formData.description.trim()) newErrors.description = 'Açıklama gerekli';
      if (formData.description.length > 500) newErrors.description = 'Açıklama 500 karakterden uzun olamaz';
    }

    if (step === 3) {
      if (formData.price < 10) newErrors.price = 'Minimum fiyat 10 NRC';
      if (formData.price > 100000) newErrors.price = 'Maximum fiyat 100,000 NRC';
      if (!formData.seller.trim()) newErrors.seller = 'Satıcı adı gerekli';
    }

    if (step === 4) {
      if (formData.category === 'role' && formData.deliveryType === 'instant') {
        if (!formData.deliveryData.roleId) newErrors.roleId = 'Rol ID gerekli';
        if (!formData.deliveryData.roleName) newErrors.roleName = 'Rol adı gerekli';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await axios.post(`${API_URL}/api/marketplace/requests`, {
        guildId,
        ...formData,
      });

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error submitting product request:', error);
      setErrors({ submit: error.response?.data?.error || 'Talep gönderilirken bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    const url = prompt('Resim URL\'sini girin:');
    if (url && formData.images.length < 5) {
      setFormData({ ...formData, images: [...formData.images, url] });
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="product-request-form-overlay" onClick={onClose}>
      <motion.div
        className="product-request-form"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="form-header">
          <h2 className="form-title">Ürün Talebi Oluştur</h2>
          <button onClick={onClose} className="form-close-btn">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="form-progress">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`progress-step ${currentStep >= step ? 'active' : ''} ${
                currentStep > step ? 'completed' : ''
              }`}
            >
              <div className="progress-circle">
                {currentStep > step ? <CheckIcon className="w-4 h-4" /> : step}
              </div>
              <span className="progress-label">
                {step === 1 && 'Temel Bilgi'}
                {step === 2 && 'Açıklama'}
                {step === 3 && 'Fiyat'}
                {step === 4 && 'Teslimat'}
              </span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="form-content">
          <AnimatePresence mode="wait">
            {/* Step 1: Category, Title, Icon, Images */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="form-step"
              >
                <h3 className="step-title">Temel Bilgiler</h3>

                {/* Category */}
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <div className="category-buttons">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: 'role' })}
                      className={`category-btn ${formData.category === 'role' ? 'active' : ''}`}
                    >
                      <SparklesIcon className="w-6 h-6" />
                      <span>Rol</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: 'custom' })}
                      className={`category-btn ${formData.category === 'custom' ? 'active' : ''}`}
                    >
                      <CubeIcon className="w-6 h-6" />
                      <span>Özel</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Ürün Başlığı</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Premium VIP Rol"
                    maxLength={100}
                    className={`form-input ${errors.title ? 'error' : ''}`}
                  />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                  <span className="form-hint">{formData.title.length}/100</span>
                </div>

                {/* Icon */}
                <div className="form-group">
                  <label className="form-label">İkon</label>
                  <div className="icon-selector">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`icon-option ${formData.icon === icon ? 'active' : ''}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div className="form-group">
                  <label className="form-label">Resimler (Opsiyonel, Max 5)</label>
                  <div className="image-grid">
                    {formData.images.map((img, index) => (
                      <div key={index} className="image-preview">
                        <img src={img} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="image-remove"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 5 && (
                      <button type="button" onClick={addImage} className="image-add">
                        <PhotoIcon className="w-8 h-8" />
                        <span>Resim Ekle</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Description */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="form-step"
              >
                <h3 className="step-title">Ürün Açıklaması</h3>

                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ürününüz hakkında detaylı bilgi verin..."
                    maxLength={500}
                    rows={8}
                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                  />
                  {errors.description && <span className="form-error">{errors.description}</span>}
                  <span className="form-hint">{formData.description.length}/500</span>
                </div>

                <div className="info-box">
                  <InformationCircleIcon className="w-5 h-5" />
                  <p>İyi bir açıklama, kullanıcıların ürününüzü anlamasına yardımcı olur.</p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Price & Seller */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="form-step"
              >
                <h3 className="step-title">Fiyatlandırma</h3>

                {/* Price */}
                <div className="form-group">
                  <label className="form-label">Fiyat (NRC)</label>
                  <div className="price-input-wrapper">
                    <CurrencyDollarIcon className="price-icon" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      min={10}
                      max={100000}
                      className={`form-input price-input ${errors.price ? 'error' : ''}`}
                    />
                    <span className="price-currency">NRC</span>
                  </div>
                  {errors.price && <span className="form-error">{errors.price}</span>}
                  <span className="form-hint">Minimum: 10 NRC | Maximum: 100,000 NRC</span>
                </div>

                {/* Seller Name */}
                <div className="form-group">
                  <label className="form-label">Satıcı Adı</label>
                  <input
                    type="text"
                    value={formData.seller}
                    onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
                    placeholder="Satıcı görünür adı"
                    className={`form-input ${errors.seller ? 'error' : ''}`}
                  />
                  {errors.seller && <span className="form-error">{errors.seller}</span>}
                </div>
              </motion.div>
            )}

            {/* Step 4: Delivery */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="form-step"
              >
                <h3 className="step-title">Teslimat Ayarları</h3>

                {/* Delivery Type */}
                <div className="form-group">
                  <label className="form-label">Teslimat Türü</label>
                  <div className="delivery-buttons">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryType: 'instant' })}
                      className={`delivery-btn ${formData.deliveryType === 'instant' ? 'active' : ''}`}
                    >
                      <TruckIcon className="w-6 h-6" />
                      <span>Anında</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryType: 'manual' })}
                      className={`delivery-btn ${formData.deliveryType === 'manual' ? 'active' : ''}`}
                    >
                      <ClockIcon className="w-6 h-6" />
                      <span>Manuel</span>
                    </button>
                  </div>
                </div>

                {/* Role Details (if category is role and delivery is instant) */}
                {formData.category === 'role' && formData.deliveryType === 'instant' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Rol ID</label>
                      <input
                        type="text"
                        value={formData.deliveryData.roleId || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: { ...formData.deliveryData, roleId: e.target.value },
                          })
                        }
                        placeholder="123456789012345678"
                        className={`form-input ${errors.roleId ? 'error' : ''}`}
                      />
                      {errors.roleId && <span className="form-error">{errors.roleId}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Rol Adı</label>
                      <input
                        type="text"
                        value={formData.deliveryData.roleName || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: { ...formData.deliveryData, roleName: e.target.value },
                          })
                        }
                        placeholder="VIP Member"
                        className={`form-input ${errors.roleName ? 'error' : ''}`}
                      />
                      {errors.roleName && <span className="form-error">{errors.roleName}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Rol Rengi (Hex)</label>
                      <input
                        type="text"
                        value={formData.deliveryData.roleColor || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: { ...formData.deliveryData, roleColor: e.target.value },
                          })
                        }
                        placeholder="#FF5733"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Süre (Gün, 0 = Kalıcı)</label>
                      <input
                        type="number"
                        value={formData.deliveryData.duration || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: { ...formData.deliveryData, duration: parseInt(e.target.value) || 0 },
                          })
                        }
                        min={0}
                        className="form-input"
                      />
                    </div>
                  </>
                )}

                {/* Custom Instructions */}
                <div className="form-group">
                  <label className="form-label">Teslimat Talimatları (Opsiyonel)</label>
                  <textarea
                    value={formData.deliveryData.customInstructions || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryData: { ...formData.deliveryData, customInstructions: e.target.value },
                      })
                    }
                    placeholder="Özel teslimat talimatları..."
                    rows={4}
                    className="form-textarea"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="form-error-box">
            <p>{errors.submit}</p>
          </div>
        )}

        {/* Footer */}
        <div className="form-footer">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="form-btn form-btn-secondary"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Geri
          </button>

          <span className="form-step-indicator">
            Adım {currentStep} / 4
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="form-btn form-btn-primary"
          >
            {loading ? (
              'Gönderiliyor...'
            ) : currentStep === 4 ? (
              <>
                <CheckIcon className="w-5 h-5" />
                Gönder
              </>
            ) : (
              <>
                İleri
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

