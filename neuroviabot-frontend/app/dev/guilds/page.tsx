'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchGuilds();
  }, []);

  const fetchGuilds = async () => {
    try {
      const response = await axios.get('/api/dev/guilds');
      if (response.data.success) {
        setGuilds(response.data.guilds);
      }
    } catch (error) {
      console.error('Failed to fetch guilds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuilds = guilds.filter(g =>
    g.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Guilds Management</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search guilds..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuilds.map((guild) => (
          <div key={guild.id} className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              {guild.icon && (
                <img src={guild.icon} alt={guild.name} className="w-12 h-12 rounded-full" />
              )}
              <div>
                <h3 className="font-semibold">{guild.name}</h3>
                <p className="text-sm text-gray-400">{guild.id}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Members: {guild.memberCount.toLocaleString()}</p>
              <p>Channels: {guild.channels}</p>
              <p>Roles: {guild.roles}</p>
              <p>Premium: Tier {guild.premium}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

