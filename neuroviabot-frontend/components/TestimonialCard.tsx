'use client';

import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';

interface TestimonialCardProps {
  quote: string;
  author: string;
  server: string;
  avatar?: string;
  rating?: number;
}

export default function TestimonialCard({
  quote,
  author,
  server,
  avatar,
  rating = 5
}: TestimonialCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
      
      {/* Card */}
      <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 h-full">
        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-5 h-5 ${
                i < rating ? 'text-yellow-400' : 'text-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Quote */}
        <p className="text-gray-300 text-lg mb-6 italic">
          "{quote}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-4">
          {avatar ? (
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-75"></div>
              <img
                src={avatar}
                alt={author}
                className="relative w-12 h-12 rounded-full object-cover border-2 border-gray-700"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {author.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div>
            <p className="font-semibold text-white">{author}</p>
            <p className="text-sm text-gray-400">{server}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

