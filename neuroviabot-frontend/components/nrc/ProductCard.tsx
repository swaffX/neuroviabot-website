'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  seller: string;
  category: string;
  icon: React.ReactNode;
  image?: string;
}

interface ProductCardProps {
  product: Product;
  onBuy: (productId: number) => void;
}

export default function ProductCard({ product, onBuy }: ProductCardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleBuy = () => {
    onBuy(product.id);
    // Reset to first step after purchase
    setCurrentStep(0);
  };

  return (
    <div className="product-card">
      <div className="product-card__slides">
        <AnimatePresence mode="wait">
          {/* Step 1: Product Icon/Image */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              className="product-card__slide"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="product-card__image-container">
                {product.image ? (
                  <img src={product.image} alt={product.title} className="product-card__image" />
                ) : (
                  <div className="product-card__icon">
                    {product.icon}
                  </div>
                )}
              </div>
              <h3 className="product-card__title">{product.title}</h3>
              <div className="product-card__category">{product.category}</div>
            </motion.div>
          )}

          {/* Step 2: Description */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              className="product-card__slide product-card__slide--description"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="product-card__description-header">
                <h4>About this item</h4>
              </div>
              <p className="product-card__description">{product.description}</p>
            </motion.div>
          )}

          {/* Step 3: Price & Seller */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              className="product-card__slide product-card__slide--pricing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="product-card__pricing-content">
                <div className="product-card__price-section">
                  <span className="product-card__price-label">Price</span>
                  <div className="product-card__price">
                    <span className="product-card__price-value">{product.price}</span>
                    <span className="product-card__price-currency">NRC</span>
                  </div>
                </div>
                <div className="product-card__seller-section">
                  <span className="product-card__seller-label">Seller</span>
                  <div className="product-card__seller">
                    <div className="product-card__seller-avatar">👤</div>
                    <span className="product-card__seller-name">{product.seller}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Buy Button */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              className="product-card__slide product-card__slide--buy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="product-card__buy-content">
                <div className="product-card__buy-icon">🛒</div>
                <h4 className="product-card__buy-title">Ready to purchase?</h4>
                <p className="product-card__buy-subtitle">
                  {product.price} NRC will be deducted from your balance
                </p>
                <button 
                  className="product-card__buy-button"
                  onClick={handleBuy}
                >
                  Buy Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="product-card__nav">
        <button
          className="product-card__nav-btn product-card__nav-btn--prev"
          onClick={handlePrev}
          disabled={currentStep === 0}
          aria-label="Previous step"
        >
          <ChevronLeftIcon />
        </button>

        {/* Progress Indicators */}
        <div className="product-card__indicators">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <button
              key={index}
              className={`product-card__indicator ${index === currentStep ? 'product-card__indicator--active' : ''}`}
              onClick={() => setCurrentStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        <button
          className="product-card__nav-btn product-card__nav-btn--next"
          onClick={handleNext}
          disabled={currentStep === totalSteps - 1}
          aria-label="Next step"
        >
          <ChevronRightIcon />
        </button>
      </div>

      {/* Step Counter */}
      <div className="product-card__step-counter">
        {currentStep + 1} / {totalSteps}
      </div>
    </div>
  );
}

