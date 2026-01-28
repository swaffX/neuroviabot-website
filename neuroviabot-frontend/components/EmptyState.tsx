'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  InboxIcon, 
  UsersIcon, 
  ShieldCheckIcon,
  HashtagIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface EmptyStateProps {
  type?: 'members' | 'roles' | 'channels' | 'audit' | 'default';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  members: UsersIcon,
  roles: ShieldCheckIcon,
  channels: HashtagIcon,
  audit: DocumentTextIcon,
  default: InboxIcon,
};

const defaultMessages = {
  members: {
    title: 'Üye Bulunamadı',
    description: 'Arama kriterlerinize uygun üye bulunamadı.',
  },
  roles: {
    title: 'Rol Bulunamadı',
    description: 'Henüz özel bir rol oluşturulmamış.',
  },
  channels: {
    title: 'Kanal Bulunamadı',
    description: 'Henüz bir kanal oluşturulmamış.',
  },
  audit: {
    title: 'Kayıt Bulunamadı',
    description: 'Henüz hiçbir işlem kaydı bulunmuyor.',
  },
  default: {
    title: 'Veri Bulunamadı',
    description: 'Görüntülenecek veri bulunamadı.',
  },
};

export default function EmptyState({ 
  type = 'default', 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  const Icon = iconMap[type];
  const messages = defaultMessages[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[400px] p-8"
    >
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/5 border border-white/10 mb-6"
        >
          <Icon className="w-12 h-12 text-gray-500" />
        </motion.div>

        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-white mb-2"
        >
          {title || messages.title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 mb-6"
        >
          {description || messages.description}
        </motion.p>

        {action && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={action.onClick}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold transition-all"
          >
            {action.label}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

