'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ManagePage() {
  const router = useRouter();

  useEffect(() => {
    // Fetch user guilds and redirect to first guild
    const fetchAndRedirect = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
        const response = await fetch(`${API_URL}/api/guilds/user`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const withBot = data.filter((g: any) => g.botPresent);
          
          if (withBot.length > 0) {
            // Redirect to first guild
            router.push(`/manage/${withBot[0].id}`);
          } else {
            // No guilds with bot, redirect to servers page
            router.push('/servers');
          }
        } else {
          // Error fetching guilds, redirect to servers page
          router.push('/servers');
        }
      } catch (error) {
        console.error('Failed to fetch guilds:', error);
        router.push('/servers');
      }
    };

    fetchAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F0F14] via-[#1A1B23] to-[#0F0F14]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}