'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const EMOJI_CATEGORIES = {
  'Yüzler': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
  'Jestler': ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚'],
  'Kalpler': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Hayvanlar': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'],
  'Yiyecek': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬'],
  'Aktivite': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'],
  'Nesneler': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️'],
  'Semboller': ['❤️', '💔', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '⭐', '🌟', '✨', '⚡', '🔥'],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  value?: string;
}

export default function EmojiPicker({ onSelect, value }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(EMOJI_CATEGORIES)[0]);

  const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
  const filteredEmojis = searchTerm
    ? allEmojis
    : EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Emoji ara..."
          className="w-full pl-9 pr-4 py-2 bg-[#23272f] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="flex gap-1 overflow-x-auto pb-2">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#23272f] text-gray-400 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 bg-[#23272f] rounded-lg border border-white/10">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            className={`text-2xl p-2 rounded hover:bg-white/10 transition ${
              value === emoji ? 'bg-blue-500/20 ring-2 ring-blue-500' : ''
            }`}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Selected Preview */}
      {value && (
        <div className="flex items-center gap-2 p-2 bg-[#23272f] rounded-lg border border-white/10">
          <span className="text-2xl">{value}</span>
          <span className="text-sm text-gray-400">Seçili</span>
        </div>
      )}
    </div>
  );
}

