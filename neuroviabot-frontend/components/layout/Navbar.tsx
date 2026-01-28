'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ServerIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  SparklesIcon,
  CommandLineIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import LanguageSelector from './LanguageSelector';

interface NavbarProps {
  language: 'tr' | 'en';
  onLanguageChange: (lang: 'tr' | 'en') => void;
  user?: any;
  onLogout?: () => void;
}

const translations = {
  tr: {
    features: 'Özellikler',
    commands: 'Komutlar',
    contact: 'Bize Ulaşın',
    feedback: 'Geri Bildirim',
    login: 'Giriş Yap',
    logout: 'Çıkış Yap',
    myServers: 'Sunucularım',
  },
  en: {
    features: 'Features',
    commands: 'Commands',
    contact: 'Contact Us',
    feedback: 'Feedback',
    login: 'Login',
    logout: 'Logout',
    myServers: 'My Servers',
  }
};

export default function Navbar({ language, onLanguageChange, user, onLogout }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
    >
      <div className="navbar__container">
        {/* Logo */}
        <Link href="/" className="navbar__brand">
          <div className="navbar__logo">
            <div className="navbar__logo-glow" />
            <div className="navbar__logo-icon">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div className="navbar__logo-pulse" />
          </div>
          <div className="navbar__brand-text">
            <span className="navbar__brand-name">Neurovia</span>
            <span className="navbar__brand-tagline">Discord Bot</span>
          </div>
        </Link>

        {/* Center Navigation */}
        <div className="navbar__menu">
          <Link 
            href="/ozellikler" 
            className="navbar__link navbar__link--expandable"
          >
            <SparklesIcon className="navbar__link-icon" />
            <span className="navbar__link-text">{t.features}</span>
          </Link>
          <Link 
            href="/komutlar" 
            className="navbar__link navbar__link--expandable"
          >
            <CommandLineIcon className="navbar__link-icon" />
            <span className="navbar__link-text">{t.commands}</span>
          </Link>
          <Link 
            href="/iletisim" 
            className="navbar__link navbar__link--expandable"
          >
            <ChatBubbleLeftRightIcon className="navbar__link-icon" />
            <span className="navbar__link-text">{t.contact}</span>
          </Link>
          <Link 
            href="/geri-bildirim" 
            className="navbar__link navbar__link--expandable"
          >
            <ChatBubbleBottomCenterTextIcon className="navbar__link-icon" />
            <span className="navbar__link-text">{t.feedback}</span>
          </Link>
          {user && (
            <Link 
              href="/servers" 
              className="navbar__link navbar__link--expandable"
            >
              <ServerIcon className="navbar__link-icon" />
              <span className="navbar__link-text">{t.myServers}</span>
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="navbar__actions">
          {/* Language Selector */}
          <LanguageSelector 
            language={language}
            onLanguageChange={onLanguageChange}
          />

          {/* User Menu or Login */}
          {user ? (
            <div className="navbar__user-menu">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="navbar__user-trigger"
              >
                <img
                  src={user.avatar 
                    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`
                  }
                  alt={user.username}
                  className="navbar__user-avatar"
                />
                <span className="navbar__user-name">{user.username}</span>
                <ChevronDownIcon className={`navbar__user-chevron ${userMenuOpen ? 'navbar__user-chevron--open' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div
                      className="navbar__user-backdrop"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="navbar__user-dropdown"
                    >
                      <div className="navbar__user-info">
                        <div className="flex items-center gap-2">
                          <p className="navbar__user-info-name">{user.username}</p>
                          {(user?.id === '315875588906680330' || user?.id === '413081778031427584') && (
                            <span className="relative inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-md bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 border border-purple-400/50">
                              <span className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-md blur-sm" />
                              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300" style={{ textShadow: '0 0 10px rgba(168,85,247,0.6)' }}>DEVELOPER</span>
                            </span>
                          )}
                        </div>
                        {user.discriminator && user.discriminator !== '0' && (
                          <p className="navbar__user-info-tag">#{user.discriminator}</p>
                        )}
                      </div>
                      
                      <div className="navbar__user-items">
                        <Link
                          href="/servers"
                          className="navbar__user-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ServerIcon className="navbar__user-item-icon" />
                          <span>{t.myServers}</span>
                        </Link>
                        
                        {(user?.id === '315875588906680330' || user?.id === '413081778031427584') && (
                          <Link
                            href="/dev-panel"
                            className="navbar__user-item navbar__user-item--dev"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Cog6ToothIcon className="navbar__user-item-icon" />
                            <span>Developer Panel</span>
                          </Link>
                        )}
                        
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onLogout?.();
                          }}
                          className="navbar__user-item navbar__user-item--logout"
                        >
                          <ArrowRightOnRectangleIcon className="navbar__user-item-icon" />
                          <span>{t.logout}</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <a
              href={`https://discord.com/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'https://neuroviabot.xyz/api/auth/callback')}&scope=identify%20email%20guilds&client_id=773539215098249246`}
              className="navbar__login-btn"
            >
              <div className="navbar__login-bg" />
              <div className="navbar__login-glow" />
              <div className="navbar__login-content">
                <svg className="navbar__login-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="navbar__login-text">{t.login}</span>
              </div>
              <div className="navbar__login-border" />
            </a>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
