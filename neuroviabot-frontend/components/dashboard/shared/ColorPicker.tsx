'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const PRESET_COLORS = [
  { name: 'Default', value: '#99AAB5' },
  { name: 'Red', value: '#ED4245' },
  { name: 'Orange', value: '#F26522' },
  { name: 'Yellow', value: '#FEE75C' },
  { name: 'Green', value: '#57F287' },
  { name: 'Blue', value: '#5865F2' },
  { name: 'Purple', value: '#9B59B6' },
  { name: 'Pink', value: '#EB459E' },
  { name: 'Teal', value: '#1ABC9C' },
  { name: 'Dark Blue', value: '#206694' },
  { name: 'Dark Green', value: '#1F8B4C' },
  { name: 'Dark Red', value: '#992D22' },
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      
      {/* Preset Colors */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onChange(color.value)}
            className="relative group"
            title={color.name}
          >
            <div
              className={`w-full aspect-square rounded-lg border-2 transition ${
                value === color.value ? 'border-white scale-110' : 'border-white/20 hover:border-white/40'
              }`}
              style={{ backgroundColor: color.value }}
            >
              {value === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckIcon className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1 text-center truncate">{color.name}</div>
          </button>
        ))}
      </div>

      {/* Custom Color */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Özel Renk</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-12 h-10 rounded cursor-pointer border border-white/10"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            placeholder="#99AAB5"
            className="flex-1 px-4 py-2 bg-[#23272f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 bg-[#23272f] rounded-lg border border-white/10">
        <div
          className="w-8 h-8 rounded-full border-2 border-white/20"
          style={{ backgroundColor: value }}
        />
        <div>
          <div className="text-sm text-white font-medium">Önizleme</div>
          <div className="text-xs text-gray-400">{value}</div>
        </div>
      </div>
    </div>
  );
}

