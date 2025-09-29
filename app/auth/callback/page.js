'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleAuthCallback } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Discord ile giriş işleminiz tamamlanıyor...');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Giriş işlemi iptal edildi veya bir hata oluştu.');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Geçersiz yetkilendirme kodu.');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      try {
        const success = await handleAuthCallback(code);
        if (success) {
          setStatus('success');
          setMessage('Giriş başarılı! Yönlendiriliyorsunuz...');
          setTimeout(() => router.push('/servers'), 2000);
        } else {
          setStatus('error');
          setMessage('Giriş işlemi başarısız oldu.');
          setTimeout(() => router.push('/auth/login'), 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    processCallback();
  }, [searchParams, handleAuthCallback, router]);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-discord-green';
      case 'error':
        return 'text-discord-red';
      default:
        return 'text-discord-blurple';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="w-16 h-16 bg-discord-green rounded-full flex items-center justify-center mb-6"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="w-16 h-16 bg-discord-red rounded-full flex items-center justify-center mb-6"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-discord-blurple/20 rounded-full flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-discord-blurple border-t-transparent rounded-full"
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-discord-dark-primary via-discord-dark-secondary to-discord-dark-tertiary flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-discord-blurple/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-discord-green/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-gradient-to-br from-discord-dark-secondary/80 to-discord-dark-tertiary/80 backdrop-blur-xl border border-discord-dark-quaternary rounded-3xl p-8 shadow-2xl text-center">
          
          {/* Status Icon */}
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          {/* Status Message */}
          <motion.h1
            className={`text-2xl font-bold mb-4 ${getStatusColor()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {status === 'processing' && 'İşleniyor...'}
            {status === 'success' && 'Başarılı!'}
            {status === 'error' && 'Hata!'}
          </motion.h1>

          <motion.p
            className="text-discord-gray-light mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {message}
          </motion.p>

          {/* Progress Steps */}
          <div className="space-y-3 mb-8">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className={`w-3 h-3 rounded-full ${status !== 'error' ? 'bg-discord-green' : 'bg-discord-gray-dark'}`} />
              <span className="text-discord-gray-light text-sm">Discord yetkilendirmesi</span>
            </motion.div>
            
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className={`w-3 h-3 rounded-full ${status === 'success' ? 'bg-discord-green' : status === 'processing' ? 'bg-discord-blurple' : 'bg-discord-gray-dark'}`} />
              <span className="text-discord-gray-light text-sm">Hesap bilgileri alınıyor</span>
            </motion.div>
            
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className={`w-3 h-3 rounded-full ${status === 'success' ? 'bg-discord-green' : 'bg-discord-gray-dark'}`} />
              <span className="text-discord-gray-light text-sm">Dashboard'a yönlendirme</span>
            </motion.div>
          </div>

          {/* Action Buttons */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="space-y-3"
            >
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-discord-blurple hover:bg-discord-blurple/80 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full text-discord-gray-light hover:text-white transition-colors"
              >
                Ana Sayfaya Dön
              </button>
            </motion.div>
          )}

          {/* Loading Animation */}
          {status === 'processing' && (
            <motion.div
              className="flex justify-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {[...Array(3)].map((_, index) => (
                <motion.div
                  key={index}
                  className="w-2 h-2 bg-discord-blurple rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: index * 0.1
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Security Badge */}
          <motion.div
            className="mt-6 flex items-center justify-center space-x-2 text-discord-gray-medium text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <svg className="w-4 h-4 text-discord-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Discord OAuth2 ile güvenli giriş</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
