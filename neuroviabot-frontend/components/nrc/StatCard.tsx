'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/nrc-animations';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  delay?: number;
}

export default function StatCard({ label, value, icon: Icon, trend, trendValue, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className="stat-card"
    >
      {Icon && (
        <div className="stat-card__icon">
          <Icon className="w-6 h-6" />
        </div>
      )}
      
      <div className="stat-card__content">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        
        {trend && trendValue && (
          <div className={`stat-card__trend stat-card__trend--${trend}`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .stat-card {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(
            135deg,
            rgba(168, 85, 247, 0.05),
            rgba(96, 165, 250, 0.03)
          );
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(168, 85, 247, 0.3);
          box-shadow: 
            0 12px 40px rgba(168, 85, 247, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .stat-card__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background: linear-gradient(135deg, #A855F7, #60A5FA);
          border-radius: 0.75rem;
          color: white;
          flex-shrink: 0;
        }

        .stat-card__content {
          flex: 1;
        }

        .stat-card__label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.25rem;
        }

        .stat-card__value {
          font-size: 1.875rem;
          font-weight: 800;
          color: white;
          font-variant-numeric: tabular-nums;
        }

        .stat-card__trend {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .stat-card__trend--up {
          color: #10B981;
        }

        .stat-card__trend--down {
          color: #EF4444;
        }

        .stat-card__trend--neutral {
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </motion.div>
  );
}

