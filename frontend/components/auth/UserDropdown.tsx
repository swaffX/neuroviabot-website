'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import Loading from '@/components/ui/Loading';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChartBarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, loading, logout } = useUser();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <Loading size="sm" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-discord/90 hover:bg-discord text-white text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
        </svg>
        Login
      </Link>
    );
  }

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`;

  const displayTag = user.discriminator && user.discriminator !== '0' 
    ? `#${user.discriminator}` 
    : '';

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
      >
        <img
          src={avatarUrl}
          alt={user.username}
          className="w-7 h-7 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`;
          }}
        />
        <span className="hidden md:block text-white text-sm font-medium">
          {user.username}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-[100]">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt={user.username}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {user.username}
                </p>
                {displayTag && (
                  <p className="text-gray-400 text-xs">{displayTag}</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/servers"
              className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <UserCircleIcon className="w-5 h-5" />
              <span className="text-sm">My Servers</span>
            </Link>

            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <TrophyIcon className="w-5 h-5" />
              <span className="text-sm">View Profile</span>
            </Link>

            <div className="my-1 border-t border-white/10"></div>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}