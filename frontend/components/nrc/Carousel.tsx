'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

export interface CarouselItem {
  title: string;
  description: string;
  id: number;
  icon: React.ReactNode;
  image?: string;
  price: number;
  seller: string;
  category: string;
}

interface CarouselProps {
  items: CarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

const DEFAULT_ITEMS: CarouselItem[] = [
  {
    title: 'Example Item',
    description: 'A sample marketplace item',
    id: 1,
    icon: <ShoppingBagIcon className="carousel-icon" />,
    price: 100,
    seller: 'User123',
    category: 'Items'
  }
];

export default function Carousel({
  items = DEFAULT_ITEMS,
  baseWidth = 300,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = true,
  round = false
}: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  const effectiveWidth = baseWidth - 40; // Account for padding
  const totalItems = items.length;
  
  const extendedItems = loop 
    ? [...items.slice(-1), ...items, ...items.slice(0, 1)]
    : items;

  useEffect(() => {
    if (!autoplay || isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [activeIndex, autoplay, autoplayDelay, isPaused]);

  const handleNext = () => {
    setActiveIndex((prev) => {
      if (loop) {
        return prev + 1;
      }
      return prev < totalItems - 1 ? prev + 1 : prev;
    });
  };

  const handlePrev = () => {
    setActiveIndex((prev) => {
      if (loop) {
        return prev - 1;
      }
      return prev > 0 ? prev - 1 : prev;
    });
  };

  useEffect(() => {
    if (!loop) return;

    if (activeIndex >= totalItems + 1) {
      setTimeout(() => {
        setActiveIndex(1);
      }, 300);
    } else if (activeIndex <= 0) {
      setTimeout(() => {
        setActiveIndex(totalItems);
      }, 300);
    }
  }, [activeIndex, loop, totalItems]);

  const handleMouseEnter = () => {
    if (pauseOnHover && autoplay) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && autoplay) {
      setIsPaused(false);
    }
  };

  const offset = loop ? activeIndex : activeIndex;
  const translateX = -(offset * effectiveWidth);

  return (
    <div 
      className={`carousel-container ${round ? 'carousel-container--round' : ''}`}
      style={{ width: `${baseWidth}px` }}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="carousel-track"
        animate={{ x: translateX }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
      >
        {extendedItems.map((item, index) => (
          <motion.div
            key={`${item.id}-${index}`}
            className={`carousel-item ${round ? 'carousel-item--round' : ''}`}
            style={{ width: `${effectiveWidth}px` }}
          >
            <div className="carousel-item__content">
              {item.image && (
                <div className="carousel-item__image">
                  <img src={item.image} alt={item.title} />
                </div>
              )}
              <div className="carousel-item__icon">
                {item.icon}
              </div>
              <h3 className="carousel-item__title">{item.title}</h3>
              <p className="carousel-item__description">{item.description}</p>
              <div className="carousel-item__footer">
                <div className="carousel-item__price">
                  <span className="carousel-item__price-value">{item.price} NRC</span>
                </div>
                <div className="carousel-item__seller">
                  <span>by {item.seller}</span>
                </div>
              </div>
              <div className="carousel-item__category">{item.category}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation */}
      <div className="carousel-nav">
        <button 
          className="carousel-nav__btn carousel-nav__btn--prev"
          onClick={handlePrev}
          aria-label="Previous item"
        >
          ←
        </button>
        <button 
          className="carousel-nav__btn carousel-nav__btn--next"
          onClick={handleNext}
          aria-label="Next item"
        >
          →
        </button>
      </div>

      {/* Indicators */}
      <div className="carousel-indicators">
        {items.map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${index === (loop ? activeIndex - 1 : activeIndex) ? 'carousel-indicator--active' : ''}`}
            onClick={() => setActiveIndex(loop ? index + 1 : index)}
            aria-label={`Go to item ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

