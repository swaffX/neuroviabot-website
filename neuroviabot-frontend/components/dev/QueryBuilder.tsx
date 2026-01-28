'use client';

import { useState } from 'react';
import axios from 'axios';

export default function QueryBuilder() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleQueries = [
    'SELECT * FROM guilds LIMIT 10',
    'SELECT * FROM users WHERE level > 50',
    'SHOW TABLES',
    'SELECT COUNT(*) FROM neuroCoinBalances'
  ];

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    // Validate read-only
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery.startsWith('select') && !lowerQuery.startsWith('show')) {
      setError('Only SELECT and SHOW queries are allowed for security reasons');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.post('/api/dev/database/query', { query });
      
      if (response.data.success) {
        setResults(response.data.results);
      } else {
        setError(response.data.error || 'Query failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (exampleQuery: string) => {
    setQuery(exampleQuery);
    setResults(null);
    setError(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Query Builder</h2>

      {/* Example Queries */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Example queries:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => loadExample(example)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <div className="mb-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter SELECT or SHOW query..."
          className="w-full h-32 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Execute Button */}
      <button
        onClick={executeQuery}
        disabled={loading || !query.trim()}
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Executing...' : 'Execute Query'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Results</h3>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

