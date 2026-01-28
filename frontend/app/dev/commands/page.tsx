'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CommandsPage() {
  const [commands, setCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const response = await axios.get('/api/dev/commands');
      if (response.data.success) {
        setCommands(response.data.commands);
      }
    } catch (error) {
      console.error('Failed to fetch commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommand = async (name: string, enabled: boolean) => {
    try {
      await axios.post(`/api/dev/commands/${name}/toggle`, { enabled: !enabled });
      fetchCommands();
    } catch (error) {
      alert('Failed to toggle command');
    }
  };

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(filter.toLowerCase())
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
      <h1 className="text-3xl font-bold mb-8">Commands Management</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search commands..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        />
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">Command</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Options</th>
              <th className="px-6 py-3 text-left">Usage</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommands.map((cmd) => (
              <tr key={cmd.name} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="px-6 py-4 font-mono">{cmd.name}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{cmd.description}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                    {cmd.category}
                  </span>
                </td>
                <td className="px-6 py-4">{cmd.options}</td>
                <td className="px-6 py-4">{cmd.usageCount || 0}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleCommand(cmd.name, cmd.enabled)}
                    className={`px-3 py-1 rounded ${
                      cmd.enabled !== false
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {cmd.enabled !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

