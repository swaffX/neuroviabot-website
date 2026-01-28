'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface GoBackButtonProps {
  label?: string;
  fallbackPath?: string;
}

export default function GoBackButton({ 
  label = 'Geri Dön', 
  fallbackPath = '/nrc/trading-panel' 
}: GoBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to default page
      router.push(fallbackPath);
    }
  };

  return (
    <motion.button
      className="go-back-button"
      onClick={handleBack}
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      <ArrowLeftIcon className="go-back-button__icon" />
      <span className="go-back-button__label">{label}</span>
    </motion.button>
  );
}

