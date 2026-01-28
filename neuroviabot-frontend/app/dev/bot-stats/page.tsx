'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import axios from 'axios';

export default function BotStatsPage() {
  const { socket } = useSocket();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();

    if (socket) {
      socket.on('dev:bot_stats', (data) => {
        setStats(data.stats);
        setHistory(prev => [...prev.slice(-59), { time: Date.now(), ...data.stats }]);
      });
    }

    return () => {
      if (socket) {
        socket.off('dev:bot_stats');
      }
    };
  }, [socket]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dev/bot-stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Bot Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Uptime</h3>
          <p className="text-2xl font-bold">{Math.floor(stats.uptime / 3600)}h {Math.floor((stats.uptime % 3600) / 60)}m</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Memory (Heap Used)</h3>
          <p className="text-2xl font-bold">{stats.memory.heapUsed} MB</p>
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(stats.memory.heapUsed / stats.memory.heapTotal) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Guilds</h3>
          <p className="text-2xl font-bold">{stats.bot.guilds}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Users</h3>
          <p className="text-2xl font-bold">{stats.bot.users?.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Channels</h3>
          <p className="text-2xl font-bold">{stats.bot.channels}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Ping</h3>
          <p className="text-2xl font-bold">{stats.bot.ping} ms</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Platform</h3>
          <p className="text-lg">{stats.system.platform} {stats.system.arch}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">CPU Cores</h3>
          <p className="text-2xl font-bold">{stats.system.cpuCount}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Node Version</h3>
          <p className="text-lg">{stats.system.nodeVersion}</p>
        </div>
      </div>
    </div>
  );
}

