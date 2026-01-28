'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DatabasePage() {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await axios.get('/api/dev/database/schema');
      if (response.data.success) {
        setSchema(response.data.schema);
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!confirm('Create database backup?')) return;

    setBackupLoading(true);
    try {
      const response = await axios.post('/api/dev/database/backup');
      if (response.data.success) {
        alert(`Backup created: ${response.data.backup}`);
      }
    } catch (error) {
      alert('Failed to create backup');
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Database Management</h1>
        <button
          onClick={createBackup}
          disabled={backupLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
        >
          {backupLoading ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schema && Object.entries(schema).map(([key, value]: [string, any]) => (
          <div key={key} className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">{key}</h3>
            <div className="space-y-1 text-sm text-gray-400">
              <p>Type: {value.type}</p>
              <p>Size: {value.size}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

