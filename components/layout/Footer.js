'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const Footer = () => {
  const footerLinks = {
    'Ürün': [
      { name: 'Özellikler', href: '/features' },
      { name: 'Fiyatlandırma', href: '/pricing' },
      { name: 'API Dokümantasyon', href: '/docs' },
      { name: 'Changelog', href: '/changelog' }
    ],
    'Destek': [
      { name: 'Yardım Merkezi', href: '/help' },
      { name: 'Discord Sunucusu', href: '/discord' },
      { name: 'İletişim', href: '/contact' },
      { name: 'Durum Sayfası', href: '/status' }
    ],
    'Yasal': [
      { name: 'Gizlilik Politikası', href: '/privacy' },
      { name: 'Hizmet Şartları', href: '/terms' },
      { name: 'Çerez Politikası', href: '/cookies' },
      { name: 'KVKK', href: '/gdpr' }
    ],
    'Sosyal': [
      { name: 'Discord', href: 'https://discord.gg' },
      { name: 'Twitter', href: 'https://twitter.com' },
      { name: 'GitHub', href: 'https://github.com' },
      { name: 'YouTube', href: 'https://youtube.com' }
    ]
  };

  const socialIcons = {
    'Discord': (
      <svg viewBox="0 -28.5 256 256" className="w-5 h-5 fill-current">
        <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" />
      </svg>
    ),
    'Twitter': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
    'GitHub': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    'YouTube': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  };

  return (
    <footer className="relative bg-gradient-to-t from-discord-dark-primary to-discord-dark-secondary border-t border-discord-dark-quaternary">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-discord-blurple/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-discord-blurple to-discord-green rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">DB</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">DiscordBot</h3>
                  <p className="text-discord-gray-medium text-sm">Premium</p>
                </div>
              </div>
              
              <p className="text-discord-gray-light leading-relaxed mb-6">
                Discord sunucunuz için en gelişmiş, güvenilir ve özellik zengini bot. 
                Profesyonel hizmet, 7/24 destek.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {Object.entries(footerLinks.Sosyal).map(([platform, href]) => (
                  <motion.a
                    key={platform}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-discord-dark-quaternary hover:bg-discord-blurple rounded-lg flex items-center justify-center text-discord-gray-medium hover:text-white transition-all duration-200"
                  >
                    {socialIcons[platform]}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).filter(([key]) => key !== 'Sosyal').map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-white font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-discord-gray-medium hover:text-discord-green transition-colors duration-200 text-sm flex items-center group"
                    >
                      <span>{link.name}</span>
                      {link.href.startsWith('http') && (
                        <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-discord-dark-quaternary/50"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-discord-green mb-1">15K+</div>
            <div className="text-discord-gray-medium text-sm">Sunucu</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-discord-blurple mb-1">500K+</div>
            <div className="text-discord-gray-medium text-sm">Kullanıcı</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-discord-yellow mb-1">99.9%</div>
            <div className="text-discord-gray-medium text-sm">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-discord-fuchsia mb-1">24/7</div>
            <div className="text-discord-gray-medium text-sm">Destek</div>
          </div>
        </motion.div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-discord-dark-secondary/50 to-discord-dark-tertiary/50 backdrop-blur-sm border border-discord-dark-quaternary rounded-2xl p-6 my-8"
        >
          <div className="text-center md:text-left md:flex md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h4 className="text-white font-bold mb-2">Güncellemelerden Haberdar Olun</h4>
              <p className="text-discord-gray-medium text-sm">Yeni özellikler ve güncellemeler hakkında bilgilendirme alın.</p>
            </div>
            <div className="flex space-x-3">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="bg-discord-dark-quaternary border border-discord-dark-quaternary focus:border-discord-blurple rounded-lg px-4 py-2 text-white placeholder-discord-gray-medium focus:outline-none focus:ring-2 focus:ring-discord-blurple/50 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-discord-blurple hover:bg-discord-blurple/80 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Abone Ol
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-discord-dark-quaternary/50"
        >
          <div className="text-discord-gray-medium text-sm mb-4 md:mb-0">
            © 2024 DiscordBot. Tüm hakları saklıdır.
            <span className="mx-2">•</span>
            Made with ❤️ in Turkey
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-2 h-2 bg-discord-green rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-discord-gray-medium text-sm">Tüm sistemler çalışıyor</span>
            </div>
            
            {/* Language selector */}
            <div className="flex items-center space-x-2 text-discord-gray-medium text-sm">
              <span>🇹🇷</span>
              <span>Türkçe</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-discord-blurple/50 to-transparent"></div>
    </footer>
  );
};

export default Footer;
