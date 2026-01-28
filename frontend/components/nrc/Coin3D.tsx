'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Coin3DProps {
  size?: number;
  className?: string;
}

export default function Coin3D({ size = 200, className = '' }: Coin3DProps) {
  return (
    <div className={`coin-3d-wrapper ${className}`} style={{ width: size, height: size }}>
      {/* Ambient Glow */}
      <motion.div
        className="coin-ambient-glow"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          width: size * 1.8,
          height: size * 1.8,
        }}
      />

      {/* Main Coin */}
      <motion.div
        className="nrc-coin-3d"
        animate={{
          rotateY: 360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          width: size,
          height: size,
        }}
      >
        {/* Coin Surface */}
        <div 
          className="coin-surface"
          style={{
            width: size,
            height: size,
          }}
        >
          {/* Inner Circle */}
          <div 
            className="coin-inner-circle"
            style={{
              width: size * 0.85,
              height: size * 0.85,
            }}
          >
            {/* Symbol */}
            <motion.span 
              className="coin-symbol"
              style={{
                fontSize: size * 0.5,
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Ⓝ
            </motion.span>
          </div>

          {/* Shine Effect */}
          <motion.div
            className="coin-shine"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      </motion.div>

      {/* Reflection */}
      <motion.div
        className="coin-reflection"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scaleX: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          width: size * 0.9,
          height: size * 0.15,
          marginTop: size * 0.1,
        }}
      />

      <style jsx>{`
        .coin-3d-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: auto;
        }

        .coin-ambient-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            rgba(168, 85, 247, 0.4) 0%,
            rgba(96, 165, 250, 0.3) 30%,
            rgba(34, 211, 238, 0.2) 60%,
            transparent 80%
          );
          border-radius: 50%;
          filter: blur(40px);
          pointer-events: none;
          z-index: 0;
        }

        .nrc-coin-3d {
          position: relative;
          perspective: 1000px;
          transform-style: preserve-3d;
          z-index: 1;
        }

        .coin-surface {
          position: relative;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(168, 85, 247, 1) 0%,
            rgba(139, 92, 246, 1) 25%,
            rgba(96, 165, 250, 1) 50%,
            rgba(139, 92, 246, 1) 75%,
            rgba(168, 85, 247, 1) 100%
          );
          box-shadow: 
            0 0 60px rgba(168, 85, 247, 0.8),
            0 0 100px rgba(96, 165, 250, 0.5),
            inset 0 0 60px rgba(255, 255, 255, 0.15),
            inset 0 -20px 40px rgba(0, 0, 0, 0.3),
            inset 0 20px 40px rgba(255, 255, 255, 0.2);
          border: 4px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .coin-inner-circle {
          position: relative;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 70%
          );
          z-index: 2;
        }

        .coin-symbol {
          font-weight: 900;
          color: white;
          text-shadow: 
            0 0 20px rgba(255, 255, 255, 0.8),
            0 4px 12px rgba(0, 0, 0, 0.6),
            0 0 40px rgba(168, 85, 247, 0.6);
          letter-spacing: -0.05em;
          z-index: 3;
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.6));
        }

        .coin-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 4;
        }

        .coin-reflection {
          background: radial-gradient(
            ellipse at center,
            rgba(168, 85, 247, 0.3) 0%,
            rgba(96, 165, 250, 0.2) 50%,
            transparent 80%
          );
          border-radius: 50%;
          filter: blur(15px);
        }

        @media (max-width: 768px) {
          .coin-ambient-glow {
            filter: blur(30px);
          }
        }
      `}</style>
    </div>
  );
}

