'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  HeartIcon,
  ServerIcon,
  CircleStackIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthData {
  status: string;
  timestamp: number;
  uptime: { seconds: number; formatted: string };
  services: {
    database: string;
    bot: string;
    socket: string;
  };
  system: {
    memory: string;
    memoryUsagePercent: number;
    nodeVersion: string;
    platform: string;
  };
  errors: {
    last_hour: number;
    by_type: Record<string, number>;
    endpoints_with_errors: number;
  };
}

interface ErrorItem {
  endpoint: string;
  message: string;
  timestamp: number;
  type: string;
  statusCode: number;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [recentErrors, setRecentErrors] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<Array<{ time: string; memory: number; errors: number }>>([]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Fetch basic health
      const healthRes = await axios.get(`${API_URL}/api/health`);
      setHealth(healthRes.data);
      
      // Fetch detailed health for errors
      const detailedRes = await axios.get(`${API_URL}/api/health/detailed`);
      if (detailedRes.data.recentErrors) {
        setRecentErrors(detailedRes.data.recentErrors.slice(0, 10));
      }
      
      // Add to history
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      setHistoryData(prev => {
        const newData = [...prev, {
          time: timeStr,
          memory: healthRes.data.system?.memoryUsagePercent || 0,
          errors: healthRes.data.errors?.last_hour || 0
        }];
        return newData.slice(-20); // Keep last 20 data points
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch health:', error);
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'healthy' || status === 'connected' || status === 'active' || status === 'online') {
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
    if (status === 'degraded' || status === 'offline') {
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    }
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'healthy' || status === 'connected' || status === 'active' || status === 'online') {
      return <CheckCircleIcon className="w-5 h-5" />;
    }
    return <ExclamationTriangleIcon className="w-5 h-5" />;
  };

  if (loading && !health) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <HeartIcon className="w-10 h-10 text-red-500" />
            System Health
          </h1>
          <p className="text-gray-400">Real-time system monitoring and error detection</p>
        </motion.div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-2xl border ${getStatusColor(health?.status || 'unknown')}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Status</span>
              {getStatusIcon(health?.status || 'unknown')}
            </div>
            <div className="text-2xl font-bold capitalize">{health?.status || 'Unknown'}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-2xl border ${getStatusColor(health?.services.database || 'unknown')}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Database</span>
              <CircleStackIcon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold capitalize">{health?.services.database || 'Unknown'}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`p-6 rounded-2xl border ${getStatusColor(health?.services.bot || 'unknown')}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Bot</span>
              <ServerIcon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold capitalize">{health?.services.bot || 'Unknown'}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={`p-6 rounded-2xl border ${getStatusColor(health?.services.socket || 'unknown')}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Socket.IO</span>
              <BoltIcon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold capitalize">{health?.services.socket || 'Unknown'}</div>
          </motion.div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CpuChipIcon className="w-6 h-6 text-purple-400" />
              System Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime</span>
                <span className="font-semibold flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  {health?.uptime.formatted || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Memory Usage</span>
                <span className="font-semibold">{health?.system.memory || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Memory %</span>
                <span className="font-semibold">{health?.system.memoryUsagePercent || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Node Version</span>
                <span className="font-semibold">{health?.system.nodeVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform</span>
                <span className="font-semibold">{health?.system.platform || 'N/A'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />
              Error Statistics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Errors (Last Hour)</span>
                <span className="font-semibold text-amber-400">{health?.errors.last_hour || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Endpoints with Errors</span>
                <span className="font-semibold">{health?.errors.endpoints_with_errors || 0}</span>
              </div>
              {health?.errors.by_type && Object.keys(health.errors.by_type).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">By Type:</p>
                  {Object.entries(health.errors.by_type).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Historical Data */}
        {historyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 mb-8"
          >
            <h2 className="text-xl font-bold mb-4">Memory & Error Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="memory" stroke="#a78bfa" strokeWidth={2} name="Memory %" />
                <Line type="monotone" dataKey="errors" stroke="#f59e0b" strokeWidth={2} name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Recent Errors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-4">Recent Errors</h2>
          {recentErrors.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent errors 🎉</p>
          ) : (
            <div className="space-y-3">
              {recentErrors.map((error, index) => (
                <div key={index} className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <code className="text-sm text-purple-400">{error.endpoint}</code>
                      <p className="text-sm text-gray-300 mt-1">{error.message}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      error.statusCode >= 500 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {error.statusCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{error.type}</span>
                    <span>{new Date(error.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

