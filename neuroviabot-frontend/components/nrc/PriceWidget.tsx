'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useNRCPrice } from '@/contexts/NRCContext';

export default function PriceWidget() {
  const { currentPrice, priceChange24h, priceChangePercent } = useNRCPrice();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Format price with animation
  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Determine if price is up or down
  const isPositive = priceChangePercent >= 0;

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="price-widget"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <motion.div
            className="price-widget__container"
            initial={false}
            animate={{
              width: isExpanded ? '280px' : '52px',
              height: isExpanded ? 'auto' : '52px',
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Main Content */}
            <div 
              className="price-widget__main"
              role="button"
              tabIndex={0}
            >
              {/* Icon (always visible) */}
              <motion.div
                className="price-widget__icon"
                animate={{
                  scale: isExpanded ? 0.9 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <ChartBarIcon className="price-widget__icon-svg" />
                <motion.div
                  className="price-widget__pulse-dot"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.4, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="price-widget__details"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Live Indicator */}
                    <div className="price-widget__live">
                      <span className="price-widget__live-text">LIVE</span>
                    </div>

                    {/* Price Display */}
                    <div className="price-widget__price">
                      <span className="price-widget__currency">$</span>
                      <motion.span
                        key={currentPrice}
                        className="price-widget__value"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {formatPrice(currentPrice)}
                      </motion.span>
                    </div>

                    {/* Change Percentage */}
                    <div className={`price-widget__change ${isPositive ? 'price-widget__change--positive' : 'price-widget__change--negative'}`}>
                      {isPositive ? (
                        <ArrowTrendingUpIcon className="price-widget__arrow" />
                      ) : (
                        <ArrowTrendingDownIcon className="price-widget__arrow" />
                      )}
                      <span>{formatPercent(priceChangePercent)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

