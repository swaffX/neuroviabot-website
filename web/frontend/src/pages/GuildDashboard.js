import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';

import { authService } from '../services/authService';

const GuildDashboard = () => {
  const { guildId } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({});

  const { data: guildData, isLoading } = useQuery(
    ['guildData', guildId],
    () => authService.getGuildData(guildId),
    {
      enabled: !!guildId,
      onSuccess: (data) => {
        setSettings(data.settings || {});
      },
      onError: (error) => {
        toast.error('Sunucu verileri yüklenemedi: ' + error.message);
      },
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await authService.updateGuildSettings(guildId, settings);
      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!guildData) {
    return (
      <Alert severity="error">
        Sunucu bulunamadı veya erişim izniniz yok.
      </Alert>
    );
  }

  const tabPanels = [
    {
      label: 'Genel',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Temel Ayarlar</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Prefix"
                    value={settings.prefix || '/'}
                    onChange={(e) => handleSettingChange('prefix', e.target.value)}
                    fullWidth
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoRole || false}
                        onChange={(e) => handleSettingChange('autoRole', e.target.checked)}
                      />
                    }
                    label="Otomatik Rol Verme"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.welcomeMessages || false}
                        onChange={(e) => handleSettingChange('welcomeMessages', e.target.checked)}
                      />
                    }
                    label="Hoş Geldin Mesajları"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Sunucu Bilgileri</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={guildData.icon ? `https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png` : undefined}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  >
                    {guildData.name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{guildData.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {guildData.memberCount} üye
                    </Typography>
                    <Chip
                      label={guildData.botActive ? 'Bot Aktif' : 'Bot Pasif'}
                      color={guildData.botActive ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Müzik',
      content: (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Müzik Ayarları</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Varsayılan Ses Seviyesi</InputLabel>
                  <Select
                    value={settings.defaultVolume || 50}
                    onChange={(e) => handleSettingChange('defaultVolume', e.target.value)}
                  >
                    <MenuItem value={25}>25%</MenuItem>
                    <MenuItem value={50}>50%</MenuItem>
                    <MenuItem value={75}>75%</MenuItem>
                    <MenuItem value={100}>100%</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Maksimum Kuyruk Boyutu"
                  type="number"
                  value={settings.maxQueueSize || 100}
                  onChange={(e) => handleSettingChange('maxQueueSize', parseInt(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.musicAutoLeave || true}
                      onChange={(e) => handleSettingChange('musicAutoLeave', e.target.checked)}
                    />
                  }
                  label="Boş kanaldan otomatik ayrıl"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )
    },
    {
      label: 'Moderasyon',
      content: (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Moderasyon Ayarları</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoMod || false}
                      onChange={(e) => handleSettingChange('autoMod', e.target.checked)}
                    />
                  }
                  label="Otomatik Moderasyon"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.antiSpam || false}
                      onChange={(e) => handleSettingChange('antiSpam', e.target.checked)}
                    />
                  }
                  label="Anti-Spam Koruması"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Mod Log Kanalı ID"
                  value={settings.modLogChannel || ''}
                  onChange={(e) => handleSettingChange('modLogChannel', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )
    },
    {
      label: 'Ekonomi',
      content: (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Ekonomi Ayarları</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Günlük Ödül Miktarı"
                  type="number"
                  value={settings.dailyAmount || 100}
                  onChange={(e) => handleSettingChange('dailyAmount', parseInt(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Çalışma Ödül Miktarı"
                  type="number"
                  value={settings.workAmount || 50}
                  onChange={(e) => handleSettingChange('workAmount', parseInt(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.economyEnabled || true}
                      onChange={(e) => handleSettingChange('economyEnabled', e.target.checked)}
                    />
                  }
                  label="Ekonomi Sistemi Aktif"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {guildData.name} - Sunucu Yönetimi
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Bot ayarlarını yapılandırın ve sunucunuzu özelleştirin
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {tabPanels.map((panel, index) => (
            <Tab key={index} label={panel.label} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ mb: 3 }}>
        {tabPanels[activeTab]?.content}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          İptal
        </Button>
        <Button variant="contained" onClick={handleSaveSettings}>
          Ayarları Kaydet
        </Button>
      </Box>
    </motion.div>
  );
};

export default GuildDashboard;



