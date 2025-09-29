import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  People,
  MusicNote,
  Security,
  EmojiEvents,
  AttachMoney,
  Forum,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';

import { authService } from '../services/authService';
import { socketService } from '../services/socketService';

const DashboardPage = () => {
  const [botStats, setBotStats] = useState(null);
  const [realtimeData, setRealtimeData] = useState({
    onlineUsers: 0,
    commandsUsed: 0,
    activeGuilds: 0,
  });

  // Fetch bot statistics
  const { data: statsData, isLoading, error, refetch } = useQuery(
    'botStats',
    authService.getBotStats,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (data) => {
        setBotStats(data);
      },
      onError: (error) => {
        toast.error('İstatistikler yüklenemedi: ' + error.message);
      },
    }
  );

  // Socket event listeners for real-time updates
  useEffect(() => {
    socketService.on('bot_status_update', (data) => {
      setRealtimeData((prev) => ({
        ...prev,
        ...data,
      }));
    });

    socketService.on('command_used', (data) => {
      setRealtimeData((prev) => ({
        ...prev,
        commandsUsed: prev.commandsUsed + 1,
      }));
    });

    // Request initial stats
    socketService.requestBotStats();

    return () => {
      socketService.off('bot_status_update');
      socketService.off('command_used');
    };
  }, []);

  const handleRefresh = () => {
    refetch();
    socketService.requestBotStats();
    toast.success('Veriler yenilendi');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Veriler yüklenemedi: {error.message}
        <Button onClick={handleRefresh} sx={{ ml: 2 }}>
          Tekrar Dene
        </Button>
      </Alert>
    );
  }

  const mockChartData = [
    { name: 'Pzt', commands: 120, users: 45 },
    { name: 'Sal', commands: 190, users: 68 },
    { name: 'Çar', commands: 250, users: 89 },
    { name: 'Per', commands: 180, users: 72 },
    { name: 'Cum', commands: 310, users: 95 },
    { name: 'Cmt', commands: 280, users: 87 },
    { name: 'Paz', commands: 200, users: 63 },
  ];

  const statCards = [
    {
      title: 'Toplam Sunucu',
      value: botStats?.guilds || 0,
      icon: <Forum sx={{ fontSize: 40 }} />,
      color: '#5865f2',
      change: '+12%',
    },
    {
      title: 'Aktif Kullanıcı',
      value: botStats?.users || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#43b581',
      change: '+8%',
    },
    {
      title: 'Günlük Komut',
      value: botStats?.commands || 0,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#faa61a',
      change: '+25%',
    },
    {
      title: 'Çalma Süresi',
      value: botStats?.musicTime || '0h',
      icon: <MusicNote sx={{ fontSize: 40 }} />,
      color: '#f04747',
      change: '+15%',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Bot Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Botunuzun performansını ve kullanım istatistiklerini takip edin
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#43b581' }} />}
            label="Çevrimiçi"
            color="success"
            variant="outlined"
          />
          <Tooltip title="Verileri Yenile">
            <IconButton onClick={handleRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${card.color}15, ${card.color}05)`,
                  border: `1px solid ${card.color}30`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${card.color}25`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ color: card.color }}>
                      {card.icon}
                    </Box>
                    <Chip
                      label={card.change}
                      size="small"
                      sx={{
                        backgroundColor: `${card.color}20`,
                        color: card.color,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {card.title}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Haftalık Aktivite
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#36393f', 
                      border: '1px solid #42464d',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="commands" 
                    stroke="#5865f2" 
                    strokeWidth={3}
                    dot={{ fill: '#5865f2', strokeWidth: 2, r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#43b581" 
                    strokeWidth={3}
                    dot={{ fill: '#43b581', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Popüler Komutlar
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: '/play', usage: 45 },
                  { name: '/help', usage: 32 },
                  { name: '/queue', usage: 28 },
                  { name: '/skip', usage: 25 },
                  { name: '/economy', usage: 18 },
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#36393f', 
                      border: '1px solid #42464d',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="usage" fill="#faa61a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Hızlı İşlemler
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Security />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Güvenlik Ayarları
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EmojiEvents />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Çekiliş Oluştur
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AttachMoney />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Ekonomi Yönetimi
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Son Aktiviteler
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { action: 'Yeni üye katıldı', time: '2 dakika önce', user: 'TestUser#1234' },
                  { action: 'Çekiliş başlatıldı', time: '15 dakika önce', user: 'Admin#0001' },
                  { action: 'Müzik çalınmaya başlandı', time: '32 dakika önce', user: 'MusicLover#5678' },
                ].map((activity, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, backgroundColor: '#5865f2' }}>
                      {activity.user[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.action}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {activity.user} • {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default DashboardPage;



