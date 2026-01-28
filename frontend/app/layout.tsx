import './globals.scss';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { NotificationProvider } from '../contexts/NotificationContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SocketProvider } from '../contexts/SocketContext';
import { AuthProvider } from '../contexts/AuthContext';

// Optimized font loading with preload
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  preload: true,
  adjustFontFallback: true,
});

// Enhanced SEO metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://neuroviabot.xyz'),
  title: {
    default: 'NeuroVia - Discord Bot Yönetim Paneli',
    template: '%s | NeuroVia',
  },
  description: 'Gelişmiş yapay zeka destekli Discord bot yönetim paneli. Sunucunuzu yönetin, moderasyon yapın, istatistikleri takip edin.',
  keywords: [
    'discord bot',
    'discord bot yönetim',
    'neuroviabot',
    'discord moderasyon',
    'discord bot dashboard',
    'türkçe discord bot',
    'yapay zeka discord bot',
  ],
  authors: [{ name: 'NeuroVia Team' }],
  creator: 'NeuroVia',
  publisher: 'NeuroVia',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://neuroviabot.xyz',
    siteName: 'NeuroVia',
    title: 'NeuroVia - Discord Bot Yönetim Paneli',
    description: 'Gelişmiş yapay zeka destekli Discord bot yönetim paneli',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NeuroVia Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuroVia - Discord Bot Yönetim Paneli',
    description: 'Gelişmiş yapay zeka destekli Discord bot yönetim paneli',
    images: ['/og-image.png'],
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <LanguageProvider>
            <SocketProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </SocketProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
