'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { ArrowLeftIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon, SparklesIcon, CheckCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

const contactReasons = [
  { icon: <QuestionMarkCircleIcon className="w-6 h-6" />, value: 'support', label: 'Destek Talebi', description: 'Bot ile ilgili yardım' },
  { icon: <ExclamationTriangleIcon className="w-6 h-6" />, value: 'bug', label: 'Hata Bildirimi', description: 'Bug bildirmek istiyorum' },
  { icon: <SparklesIcon className="w-6 h-6" />, value: 'feature', label: 'Özellik Önerisi', description: 'Yeni özellik önerim var' },
  { icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, value: 'partnership', label: 'İşbirliği', description: 'Ortaklık teklifi' },
  { icon: <EnvelopeIcon className="w-6 h-6" />, value: 'other', label: 'Diğer', description: 'Diğer sorular' }
];

export default function ContactPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [formData, setFormData] = useState({ discordUserId: '', discordUsername: '', discordAvatar: '', reason: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthWarning(true);
      const timer = setTimeout(() => router.push('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, discordUserId: user.id, discordUsername: user.username, discordAvatar: user.avatar || '' }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${apiUrl}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(formData) });
      if (!response.ok) throw new Error('Failed to submit');
      setSubmitStatus('success');
      setFormData(prev => ({ ...prev, reason: '', subject: '', message: '' }));
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Contact error:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showAuthWarning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0b0f] via-[#13151f] to-[#1a1c2e] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 text-center">
          <ShieldExclamationIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Giriş Yapmanız Gerekiyor</h2>
          <p className="text-gray-400 mb-6">İletişim formunu kullanabilmek için Discord ile giriş yapmalısınız.</p>
          <div className="text-gray-500 text-sm">Ana sayfaya yönlendiriliyorsunuz...</div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-screen bg-gradient-to-br from-[#0a0b0f] via-[#13151f] to-[#1a1c2e] flex items-center justify-center"><div className="text-white text-xl">Yükleniyor...</div></div>;
  if (!user) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0b0f] via-[#13151f] to-[#1a1c2e] text-white overflow-hidden">
      <Navbar language={language} onLanguageChange={setLanguage} user={user} onLogout={logout} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 py-20 pt-32">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><ArrowLeftIcon className="w-5 h-5" />Ana Sayfaya Dön</Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-6">
            <EnvelopeIcon className="w-12 h-12 text-purple-400" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Bize Ulaşın</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">Sorularınız, önerileriniz için bizimle iletişime geçin.</p>
        </motion.div>
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-xl overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
              <form onSubmit={handleSubmit} className="relative space-y-6">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
                  <img src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`} alt={user.username} className="w-12 h-12 rounded-full" />
                  <div><div className="text-white font-semibold">{user.username}</div><div className="text-gray-400 text-sm">Discord ID: {user.id}</div></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">İletişim Nedeni *</label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {contactReasons.map((reason) => (
                      <label key={reason.value} className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.reason === reason.value ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10 hover:border-purple-500/30'}`}>
                        <input type="radio" name="reason" value={reason.value} checked={formData.reason === reason.value} onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))} className="sr-only" required />
                        <div className={`flex-shrink-0 ${formData.reason === reason.value ? 'text-purple-400' : 'text-gray-400'}`}>{reason.icon}</div>
                        <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white">{reason.label}</div><div className="text-xs text-gray-400 mt-0.5">{reason.description}</div></div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-300 mb-2">Konu *</label>
                  <input type="text" id="subject" name="subject" required value={formData.subject} onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Mesajınızın konusu" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-300 mb-2">Mesajınız *</label>
                  <textarea id="message" name="message" required value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} rows={6} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none" placeholder="Mesajınızı buraya yazın..." />
                </div>
                {submitStatus === 'success' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                    <CheckCircleIcon className="w-6 h-6 text-green-400" />
                    <div><div className="text-sm font-semibold text-green-400">Mesajınız başarıyla gönderildi!</div><div className="text-xs text-gray-300">Size en kısa sürede dönüş yapacağız.</div></div>
                  </motion.div>
                )}
                {submitStatus === 'error' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                    <div><div className="text-sm font-semibold text-red-400">Bir hata oluştu</div><div className="text-xs text-gray-300">Lütfen tekrar deneyin.</div></div>
                  </motion.div>
                )}
                <button type="submit" disabled={isSubmitting} className="w-full relative group px-8 py-4 text-base font-bold overflow-hidden rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-transform group-hover:scale-105" />
                  <span className="relative flex items-center justify-center gap-2"><EnvelopeIcon className="w-5 h-5" />{isSubmitting ? 'Gönderiliyor...' : 'Mesajı Gönder'}</span>
                </button>
              </form>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-xl overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
              <div className="relative"><ChatBubbleLeftRightIcon className="w-10 h-10 text-purple-400 mb-4" /><h3 className="text-xl font-bold mb-2">Discord Sunucusu</h3><p className="text-gray-400 text-sm mb-4">Topluluğumuza katılın!</p><a href="https://discord.gg/neurovia" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm font-semibold"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/></svg>Sunucuya Katıl</a></div>
            </div>
            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-xl overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
              <div className="relative"><EnvelopeIcon className="w-10 h-10 text-blue-400 mb-4" /><h3 className="text-xl font-bold mb-2">E-posta</h3><p className="text-gray-400 text-sm mb-4">Doğrudan e-posta ile iletişim</p><a href="mailto:support@neuroviabot.xyz" className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">support@neuroviabot.xyz</a></div>
            </div>
            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-xl overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
              <div className="relative"><div className="flex items-center gap-2 mb-4"><div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" /><span className="text-green-400 font-semibold">Çevrimiçi</span></div><h3 className="text-xl font-bold mb-2">Yanıt Süresi</h3><p className="text-gray-400 text-sm">Genellikle <span className="text-white font-semibold">24 saat</span> içinde yanıt veriyoruz.</p></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
