'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { useSocket } from '@/contexts/SocketContext';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ActivityGraphProps {
  guildId: string;
  timeRange?: '7d' | '30d' | '90d';
}

export default function ActivityGraph({ guildId, timeRange = '7d' }: ActivityGraphProps) {
  const { connected, on, off } = useSocket();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(timeRange);

  useEffect(() => {
    fetchActivityData();
  }, [guildId, selectedRange]);

  // Real-time updates
  useEffect(() => {
    if (connected) {
      const handleActivityUpdate = (updateData: any) => {
        if (updateData.guildId === guildId) {
          // Update latest data point
          setData((prev: any) => {
            if (!prev) return prev;
            
            const newData = { ...prev };
            const lastIndex = newData.labels.length - 1;
            
            // Update today's data
            newData.datasets[0].data[lastIndex] = updateData.messages || prev.datasets[0].data[lastIndex];
            newData.datasets[1].data[lastIndex] = updateData.joins || prev.datasets[1].data[lastIndex];
            newData.datasets[2].data[lastIndex] = updateData.levels || prev.datasets[2].data[lastIndex];
            
            return newData;
          });
        }
      };

      on('activity_update', handleActivityUpdate);
      
      return () => {
        off('activity_update', handleActivityUpdate);
      };
    }
  }, [connected, guildId, on, off]);

  const fetchActivityData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
      const response = await axios.get(`${API_URL}/api/analytics/activity/${guildId}`, {
        params: { range: selectedRange },
        withCredentials: true
      });

      if (response.data.success) {
        const activityData = response.data.data;
        
        setData({
          labels: activityData.labels,
          datasets: [
            {
              label: 'Mesajlar',
              data: activityData.messages,
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: 'rgb(168, 85, 247)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
            {
              label: 'Katılımlar',
              data: activityData.joins,
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: 'rgb(34, 197, 94)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
            {
              label: 'Seviye Atlayanlar',
              data: activityData.levels,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
            weight: 'normal' as const
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y;
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          },
          precision: 0
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Aktivite Grafiği</h3>
            <p className="text-xs text-gray-400">Sunucu aktivitesi gerçek zamanlı</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 Gün' },
            { value: '30d', label: '30 Gün' },
            { value: '90d', label: '90 Gün' }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedRange(range.value as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedRange === range.value
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative p-6 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-sm">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Veriler yükleniyor...</p>
            </div>
          </div>
        ) : data ? (
          <div className="h-64">
            <Line data={data} options={options} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">Veri bulunamadı</p>
          </div>
        )}

        {/* Real-time Indicator */}
        {connected && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-green-400">Real-time</span>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Toplam Mesaj', value: data.datasets[0].data.reduce((a: number, b: number) => a + b, 0), color: 'purple' },
            { label: 'Yeni Üyeler', value: data.datasets[1].data.reduce((a: number, b: number) => a + b, 0), color: 'green' },
            { label: 'Seviye Atlayanlar', value: data.datasets[2].data.reduce((a: number, b: number) => a + b, 0), color: 'blue' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-400`}>
                {stat.value.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

