'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];

export default function DeveloperMenu() {
  const { data: session } = useSession();
  const [hasDeveloperAccess, setHasDeveloperAccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkDeveloperAccess();
  }, [session]);

  const checkDeveloperAccess = async () => {
    if (!session?.user?.id) {
      setHasDeveloperAccess(false);
      return;
    }

    // Check if user ID is in developer list
    if (DEVELOPER_IDS.includes(session.user.id)) {
      try {
        // Verify with backend
        const response = await axios.get('/api/dev/check-access', {
          headers: {
            'x-user-id': session.user.id
          }
        });

        setHasDeveloperAccess(response.data.hasDeveloperAccess);
      } catch (error) {
        setHasDeveloperAccess(false);
      }
    } else {
      setHasDeveloperAccess(false);
    }
  };

  if (!hasDeveloperAccess) {
    return null; // Hide menu for non-developers
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Bot Yönetim</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-20 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 border-b border-gray-700">
              <p className="text-sm font-semibold text-white">Developer Panel</p>
              <p className="text-xs text-gray-200">Full system access</p>
            </div>

            <div className="py-2">
              <Link
                href="/dev"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dev/bot-stats"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Bot Stats</span>
              </Link>

              <Link
                href="/dev/commands"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Commands</span>
              </Link>

              <Link
                href="/dev/database"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>Database</span>
              </Link>

              <Link
                href="/dev/guilds"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Guilds</span>
              </Link>

              <Link
                href="/dev/logs"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Logs</span>
              </Link>
            </div>

            <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
              <p className="text-xs text-gray-500">Developer ID: {session?.user?.id}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

