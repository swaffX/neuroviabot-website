'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface LanguageSelectorProps {
  language: 'tr' | 'en';
  onLanguageChange: (lang: 'tr' | 'en') => void;
}

export default function LanguageSelector({ language, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        console.log('🎯 Clicked outside, closing menu');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageSelect = (e: React.MouseEvent, lang: 'tr' | 'en') => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🌍 Language selected:', lang);
    onLanguageChange(lang);
    setIsOpen(false);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔽 Trigger clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <div ref={selectorRef} className="language-selector">
      <button
        type="button"
        onClick={handleTriggerClick}
        className="language-selector__trigger"
        aria-label="Select Language"
      >
        <span className="language-selector__flag">
          {language === 'tr' ? '🇹🇷' : '🇬🇧'}
        </span>
        <ChevronDownIcon className={`language-selector__chevron ${isOpen ? 'language-selector__chevron--open' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="language-selector__backdrop" 
              onClick={(e) => {
                e.stopPropagation();
                console.log('🎯 Backdrop clicked');
                setIsOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="language-selector__menu"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => handleLanguageSelect(e, 'tr')}
                className={`language-selector__option ${language === 'tr' ? 'language-selector__option--active' : ''}`}
              >
                <span className="language-selector__option-flag">🇹🇷</span>
                <span className="language-selector__option-text">Türkçe</span>
                {language === 'tr' && <span className="language-selector__option-check">✓</span>}
              </button>
              <button
                type="button"
                onClick={(e) => handleLanguageSelect(e, 'en')}
                className={`language-selector__option ${language === 'en' ? 'language-selector__option--active' : ''}`}
              >
                <span className="language-selector__option-flag">🇬🇧</span>
                <span className="language-selector__option-text">English</span>
                {language === 'en' && <span className="language-selector__option-check">✓</span>}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

