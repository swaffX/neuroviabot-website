'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusIcon,
  MinusIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { generateSyncReport, getFrontendFeatures } from '@/utils/featureSync';

interface SyncReport {
  synced: boolean;
  lastCheck: string;
  botFeatures: {
    total: number;
    list: any[];
  };
  frontendFeatures: {
    total: number;
    list: any[];
  };
  discrepancies: {
    missing: {
      count: number;
      items: any[];
    };
    deprecated: {
      count: number;
      items: any[];
    };
  };
  commands: {
    total: number;
    byCategory: Record<string, any[]>;
  };
}

export default function SyncStatusPage() {
  const [report, setReport] = useState<SyncReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    runSync();
    
    // Auto-sync every 5 minutes if enabled
    let interval: NodeJS.Timeout;
    if (autoSync) {
      interval = setInterval(runSync, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSync]);

  async function runSync() {
    setLoading(true);
    try {
      const syncReport = await generateSyncReport();
      setReport(syncReport);
      setLastSync(new Date().toISOString());
      console.log('Sync report:', syncReport);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  }

  const getSyncStatusColor = () => {
    if (!report) return 'text-gray-400';
    return report.synced ? 'text-green-400' : 'text-amber-400';
  };

  const getSyncStatusIcon = () => {
    if (!report) return null;
    return report.synced ? (
      <CheckCircleIcon className="w-8 h-8 text-green-400" />
    ) : (
      <ExclamationTriangleIcon className="w-8 h-8 text-amber-400" />
    );
  };

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
            <Squares2X2Icon className="w-10 h-10 text-blue-500" />
            Feature Sync Status
          </h1>
          <p className="text-gray-400">
            Monitor discrepancies between bot features and frontend
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={runSync}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Syncing...' : 'Run Sync'}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSync"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoSync" className="text-sm text-gray-300">
                Auto-sync (every 5 min)
              </label>
            </div>
          </div>

          {lastSync && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <ClockIcon className="w-4 h-4" />
              Last sync: {new Date(lastSync).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Sync Status */}
        {report && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-8 p-6 rounded-2xl border ${
                report.synced
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-4">
                {getSyncStatusIcon()}
                <div>
                  <h2 className={`text-2xl font-bold ${getSyncStatusColor()}`}>
                    {report.synced ? 'Features Synced ✅' : 'Sync Issues Detected ⚠️'}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {report.synced
                      ? 'All features are in sync between bot and frontend'
                      : `${report.discrepancies.missing.count} missing, ${report.discrepancies.deprecated.count} deprecated`}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl"
              >
                <h3 className="text-sm text-gray-400 mb-2">Bot Features</h3>
                <p className="text-3xl font-bold text-blue-400">{report.botFeatures.total}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl"
              >
                <h3 className="text-sm text-gray-400 mb-2">Frontend Features</h3>
                <p className="text-3xl font-bold text-purple-400">{report.frontendFeatures.total}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl"
              >
                <h3 className="text-sm text-gray-400 mb-2">Total Commands</h3>
                <p className="text-3xl font-bold text-green-400">{report.commands.total}</p>
              </motion.div>
            </div>

            {/* Missing Features */}
            {report.discrepancies.missing.count > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <PlusIcon className="w-6 h-6 text-amber-400" />
                  Missing Features ({report.discrepancies.missing.count})
                </h2>
                <p className="text-gray-400 mb-4">
                  These features exist on the bot but not on the frontend:
                </p>
                <div className="space-y-3">
                  {report.discrepancies.missing.items.map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-amber-400">{feature.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                              {feature.category}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                              {feature.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Deprecated Features */}
            {report.discrepancies.deprecated.count > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <MinusIcon className="w-6 h-6 text-red-400" />
                  Deprecated Features ({report.discrepancies.deprecated.count})
                </h2>
                <p className="text-gray-400 mb-4">
                  These features exist on the frontend but not on the bot:
                </p>
                <div className="space-y-3">
                  {report.discrepancies.deprecated.items.map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-red-400">{feature.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                              {feature.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Commands by Category */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold mb-4">Commands by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(report.commands.byCategory).map(([category, commands]) => (
                  <div key={category} className="p-4 bg-gray-900/50 rounded-xl">
                    <h3 className="font-semibold text-purple-400 mb-2 capitalize">
                      {category}
                    </h3>
                    <p className="text-2xl font-bold">{commands.length}</p>
                    <div className="mt-2 space-y-1">
                      {commands.slice(0, 3).map((cmd: any, idx: number) => (
                        <p key={idx} className="text-xs text-gray-500">
                          /{cmd.name}
                        </p>
                      ))}
                      {commands.length > 3 && (
                        <p className="text-xs text-gray-600">
                          +{commands.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

