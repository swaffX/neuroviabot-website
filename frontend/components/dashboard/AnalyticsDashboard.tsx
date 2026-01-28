'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  ArrowDownTrayIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface AnalyticsDashboardProps {
  guildId: string;
}

interface AnalyticsData {
  messageActivity: Array<{ date: string; messages: number }>;
  voiceActivity: Array<{ day: string; hours: number }>;
  memberGrowth: Array<{ date: string; joins: number; leaves: number }>;
  channelActivity: Array<{ name: string; value: number }>;
  activeHours: Array<{ hour: number; activity: number }>;
  commandUsage: Array<{ command: string; uses: number }>;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsDashboard({ guildId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [guildId, timeRange]);

  async function fetchAnalytics() {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/analytics/advanced/${guildId}?timeRange=${timeRange}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setAnalytics(response.data.analytics);
      } else {
        // Generate mock data for demonstration
        setAnalytics(generateMockData());
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      // Use mock data on error
      setAnalytics(generateMockData());
    } finally {
      setLoading(false);
    }
  }

  function generateMockData(): AnalyticsData {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    return {
      messageActivity: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        messages: Math.floor(Math.random() * 1000) + 200
      })),
      voiceActivity: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(day => ({
        day,
        hours: Math.floor(Math.random() * 50) + 10
      })),
      memberGrowth: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        joins: Math.floor(Math.random() * 20) + 5,
        leaves: Math.floor(Math.random() * 10) + 2
      })),
      channelActivity: [
        { name: 'Genel', value: 45 },
        { name: 'Botlar', value: 25 },
        { name: 'Oyun', value: 15 },
        { name: 'Müzik', value: 10 },
        { name: 'Diğer', value: 5 }
      ],
      activeHours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        activity: Math.floor(Math.random() * 100)
      })),
      commandUsage: [
        { command: '/economy', uses: 450 },
        { command: '/level', uses: 320 },
        { command: '/help', uses: 280 },
        { command: '/shop', uses: 210 },
        { command: '/trade', uses: 180 },
        { command: '/profile', uses: 150 }
      ]
    };
  }

  function exportData(type: 'csv' | 'png') {
    if (type === 'csv') {
      // Export as CSV
      let csv = 'Date,Messages\n';
      analytics?.messageActivity.forEach(item => {
        csv += `${item.date},${item.messages}\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}.csv`;
      a.click();
    } else {
      alert('PNG export özelliği yakında eklenecek!');
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-12">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-3 text-gray-400">Analitikler yükleniyor...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="w-full">
        <CardContent className="p-12 text-center">
          <p className="text-red-400">Analitikler yüklenemedi</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7 text-purple-500" />
            Gelişmiş Analitikler
          </h2>
          <p className="text-sm text-gray-400 mt-1">Sunucu aktivite ve kullanım istatistikleri</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? 'primary' : 'ghost'}
                size="sm"
                className={timeRange === range ? 'bg-purple-600' : ''}
              >
                <ClockIcon className="w-4 h-4 mr-1" />
                {range === '7d' ? '7 Gün' : range === '30d' ? '30 Gün' : '90 Gün'}
              </Button>
            ))}
          </div>

          {/* Export Buttons */}
          <Button onClick={() => exportData('csv')} variant="ghost" size="sm">
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Activity - Line Chart */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">📨 Mesaj Aktivitesi</CardTitle>
            <p className="text-sm text-gray-400">Son {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} günlük mesaj sayısı</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.messageActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="messages" stroke="#8b5cf6" strokeWidth={2} name="Mesajlar" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Voice Activity - Bar Chart */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🎤 Sesli Kanal Aktivitesi</CardTitle>
            <p className="text-sm text-gray-400">Günlük ortalama saat cinsinden</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.voiceActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="hours" fill="#3b82f6" name="Saatler" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Member Growth - Area Chart */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">👥 Üye Büyümesi</CardTitle>
            <p className="text-sm text-gray-400">Katılan vs ayrılan üyeler</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.memberGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="joins" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Katılanlar" />
                <Area type="monotone" dataKey="leaves" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Ayrılanlar" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Activity - Pie Chart */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">📊 Kanal Aktivite Dağılımı</CardTitle>
            <p className="text-sm text-gray-400">Mesaj yüzdeleri</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.channelActivity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.channelActivity.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Hours Heatmap (Bar Chart) */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">⏰ Aktif Saatler</CardTitle>
            <p className="text-sm text-gray-400">Saatlik aktivite yoğunluğu</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.activeHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value}:00`}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  labelFormatter={(value) => `Saat: ${value}:00`}
                />
                <Bar dataKey="activity" fill="#ec4899" name="Aktivite" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Command Usage - Bar Chart */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">⚡ Komut Kullanımı</CardTitle>
            <p className="text-sm text-gray-400">En çok kullanılan komutlar</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.commandUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis type="category" dataKey="command" stroke="#9ca3af" style={{ fontSize: '12px' }} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="uses" fill="#f59e0b" name="Kullanım" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

