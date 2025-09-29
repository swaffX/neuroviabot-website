import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Settings,
  Search,
  People,
  TrendingUp,
  Security,
  MusicNote,
  Launch,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { authService } from '../services/authService';

const GuildsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: guilds, isLoading, error } = useQuery(
    'userGuilds',
    authService.getUserGuilds,
    {
      onError: (error) => {
        toast.error('Sunucular yüklenemedi: ' + error.message);
      },
    }
  );

  const filteredGuilds = guilds?.filter((guild) =>
    guild.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleGuildClick = (guildId) => {
    navigate(`/guild/${guildId}`);
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
        Sunucular yüklenemedi: {error.message}
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Sunucularım
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Bot'un bulunduğu sunucuları yönetin ve ayarlarını düzenleyin
        </Typography>

        <TextField
          fullWidth
          placeholder="Sunucu ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredGuilds.map((guild, index) => (
          <Grid item xs={12} sm={6} md={4} key={guild.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  },
                  cursor: 'pointer',
                }}
                onClick={() => handleGuildClick(guild.id)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : undefined}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      {guild.name[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {guild.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={<People sx={{ fontSize: 14 }} />}
                          label={`${guild.memberCount || 0} üye`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={guild.botActive ? 'Aktif' : 'Pasif'}
                          size="small"
                          color={guild.botActive ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuildClick(guild.id);
                      }}
                      color="primary"
                    >
                      <Settings />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#5865f2' }}>
                        {guild.stats?.commands || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Komut Kullanımı
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#43b581' }}>
                        {guild.stats?.level || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Ortalama Level
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#faa61a' }}>
                        {guild.stats?.tickets || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Açık Ticket
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {guild.features?.music && (
                      <Chip
                        icon={<MusicNote sx={{ fontSize: 14 }} />}
                        label="Müzik"
                        size="small"
                        sx={{ backgroundColor: '#5865f220', color: '#5865f2' }}
                      />
                    )}
                    {guild.features?.moderation && (
                      <Chip
                        icon={<Security sx={{ fontSize: 14 }} />}
                        label="Moderasyon"
                        size="small"
                        sx={{ backgroundColor: '#43b58120', color: '#43b581' }}
                      />
                    )}
                    {guild.features?.economy && (
                      <Chip
                        icon={<TrendingUp sx={{ fontSize: 14 }} />}
                        label="Ekonomi"
                        size="small"
                        sx={{ backgroundColor: '#faa61a20', color: '#faa61a' }}
                      />
                    )}
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<Launch />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGuildClick(guild.id);
                    }}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#5865f220',
                        borderColor: '#5865f2',
                      },
                    }}
                  >
                    Yönet
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {filteredGuilds.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
            {searchTerm ? 'Arama kriterine uygun sunucu bulunamadı' : 'Henüz bot\'un bulunduğu bir sunucu yok'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              href="https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot"
              target="_blank"
              sx={{ mt: 2 }}
            >
              Bot'u Sunucuna Ekle
            </Button>
          )}
        </Box>
      )}
    </motion.div>
  );
};

export default GuildsPage;



