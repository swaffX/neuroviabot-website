'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link?: string;
  delay?: number;
}

export default function FeatureCard({ icon: Icon, title, description, link, delay = 0 }: FeatureCardProps) {
  const content = (
    <>
      <div className="feature-card__icon">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__description">{description}</p>
      {link && (
        <div className="feature-card__arrow">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </>
  );

  const cardClasses = "feature-card";
  const MotionDiv = link ? motion(Link) : motion.div;

  return (
    <MotionDiv
      href={link || ''}
      className={cardClasses}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05, y: -8 }}
    >
      {content}

      <style jsx>{`
        :global(.feature-card) {
          display: flex;
          flex-direction: column;
          padding: 2rem;
          background: linear-gradient(
            135deg,
            rgba(168, 85, 247, 0.05),
            rgba(96, 165, 250, 0.03)
          );
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.25rem;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          cursor: ${link ? 'pointer' : 'default'};
          text-decoration: none;
          color: inherit;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        :global(.feature-card):hover {
          border-color: rgba(168, 85, 247, 0.4);
          box-shadow: 
            0 16px 48px rgba(168, 85, 247, 0.3),
            0 0 40px rgba(96, 165, 250, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        :global(.feature-card)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #A855F7, #60A5FA, #22D3EE);
          opacity: 0;
          transition: opacity 0.3s;
        }

        :global(.feature-card):hover::before {
          opacity: 1;
        }

        :global(.feature-card__icon) {
          width: 3.5rem;
          height: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #A855F7, #60A5FA);
          border-radius: 1rem;
          color: white;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4);
        }

        :global(.feature-card__title) {
          font-size: 1.375rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.75rem;
        }

        :global(.feature-card__description) {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
          flex: 1;
        }

        :global(.feature-card__arrow) {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-top: 1rem;
          color: #A855F7;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s;
        }

        :global(.feature-card):hover :global(.feature-card__arrow) {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
    </MotionDiv>
  );
}

