'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  TagIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const itemTypes = [
  { id: 'role', name: 'Role', icon: '👑' },
  { id: 'badge', name: 'Badge', icon: '🏅' },
  { id: 'boost', name: 'Boost', icon: '⚡' },
  { id: 'custom', name: 'Custom', icon: '✨' },
  { id: 'nft', name: 'NFT', icon: '🎨' },
];

const rarityLevels = [
  { id: 'common', name: 'Common', color: 'text-gray-400' },
  { id: 'rare', name: 'Rare', color: 'text-blue-400' },
  { id: 'epic', name: 'Epic', color: 'text-purple-400' },
  { id: 'legendary', name: 'Legendary', color: 'text-yellow-400' },
];

export default function CreateListingModal({ isOpen, onClose, onSuccess }: CreateListingModalProps) {
  const [formData, setFormData] = useState({
    type: 'role',
    name: '',
    description: '',
    price: '',
    quantity: '1',
    rarity: 'common',
    icon: '👑',
    guildId: 'global',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await fetch(`${API_URL}/api/marketplace/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          quantity: parseInt(formData.quantity),
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create listing');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'role',
      name: '',
      description: '',
      price: '',
      quantity: '1',
      rarity: 'common',
      icon: '👑',
      guildId: 'global',
    });
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create Listing</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Item Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Item Type
              </label>
              <div className="grid grid-cols-5 gap-3">
                {itemTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id, icon: type.icon })}
                    className={`p-4 rounded-lg border-2 transition ${
                      formData.type === type.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="text-xs text-gray-400">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Item Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your item"
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Price & Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Price (NRC)
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Rarity
              </label>
              <div className="grid grid-cols-4 gap-3">
                {rarityLevels.map((rarity) => (
                  <button
                    key={rarity.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, rarity: rarity.id })}
                    className={`p-3 rounded-lg border-2 transition ${
                      formData.rarity === rarity.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${rarity.color}`}>
                      {rarity.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Market
              </label>
              <select
                value={formData.guildId}
                onChange={(e) => setFormData({ ...formData, guildId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="global">Global Market</option>
                <option value="server">Server Market (Coming Soon)</option>
              </select>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="text-sm font-semibold text-gray-400 mb-3">Preview</div>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{formData.icon}</div>
                <div className="flex-1">
                  <h4 className="text-white font-bold">{formData.name || 'Item Name'}</h4>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {formData.description || 'Item description'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-purple-400 font-bold">
                      {formData.price || '0'} NRC
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {formData.quantity} available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

