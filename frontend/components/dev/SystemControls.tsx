'use client';

import { useState } from 'react';
import axios from 'axios';

interface SystemControlsProps {
  onActionComplete?: () => void;
}

export default function SystemControls({ onActionComplete }: SystemControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (
    action: string,
    endpoint: string,
    confirmMessage: string,
    successMessage: string
  ) => {
    if (!confirm(confirmMessage)) return;

    setLoading(action);
    try {
      const response = await axios.post(endpoint);
      if (response.data.success) {
        alert(successMessage);
        onActionComplete?.();
      } else {
        throw new Error(response.data.error || 'Action failed');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Action failed');
    } finally {
      setLoading(null);
    }
  };

  const controls = [
    {
      id: 'restart',
      label: 'Restart Bot',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      endpoint: '/api/dev/system/restart',
      confirmMessage: 'Are you sure you want to restart the bot? This will cause brief downtime.',
      successMessage: 'Bot is restarting... It should be back online in 10-15 seconds.',
      className: 'bg-red-600 hover:bg-red-700'
    },
    {
      id: 'clear-cache',
      label: 'Clear Cache',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      endpoint: '/api/dev/system/clear-cache',
      confirmMessage: 'Clear all caches? This may cause temporary performance degradation.',
      successMessage: 'All caches have been cleared successfully.',
      className: 'bg-amber-600 hover:bg-amber-700'
    },
    {
      id: 'sync-commands',
      label: 'Sync Commands',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      endpoint: '/api/dev/system/sync-commands',
      confirmMessage: 'Force sync all slash commands with Discord?',
      successMessage: 'Commands synced successfully!',
      className: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'backup',
      label: 'Create Backup',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      ),
      endpoint: '/api/dev/database/backup',
      confirmMessage: 'Create a database backup?',
      successMessage: 'Database backup created successfully!',
      className: 'bg-green-600 hover:bg-green-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {controls.map((control) => (
        <button
          key={control.id}
          onClick={() =>
            handleAction(
              control.id,
              control.endpoint,
              control.confirmMessage,
              control.successMessage
            )
          }
          disabled={loading === control.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${control.className}`}
        >
          <div className={loading === control.id ? 'animate-spin' : ''}>
            {control.icon}
          </div>
          <span>{loading === control.id ? 'Processing...' : control.label}</span>
        </button>
      ))}
    </div>
  );
}

