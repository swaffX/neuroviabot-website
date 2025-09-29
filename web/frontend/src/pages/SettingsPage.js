import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Palette,
  Notifications,
  Language,
  Storage,
  Edit,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'tr',
    notifications: true,
    autoSave: true,
    compactMode: false,
    showAnimations: true,
  });

  const [profile, setProfile] = useState({
    displayName: user?.username || '',
    email: user?.email || '',
    timezone: 'Europe/Istanbul',
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProfileChange = (key, value) => {
    setProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage or API
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    toast.success('Ayarlar başarıyla kaydedildi');
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      theme: 'dark',
      language: 'tr',
      notifications: true,
      autoSave: true,
      compactMode: false,
      showAnimations: true,
    };
    setSettings(defaultSettings);
    toast.success('Ayarlar sıfırlandı');
  };

  const statsData = [
    { label: 'Toplam Komut Kullanımı', value: '1,247' },
    { label: 'Yönetilen Sunucu', value: '12' },
    { label: 'Son Giriş', value: '2 dakika önce' },
    { label: 'Hesap Oluşturma', value: '15 Mart 2023' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Ayarlar
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Hesap ve dashboard ayarlarınızı yönetin
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Edit sx={{ mr: 1 }} />
                Profil Bilgileri
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined}
                  sx={{ width: 80, height: 80, mr: 2 }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user?.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    #{user?.discriminator}
                  </Typography>
                  <Chip label="Premium User" size="small" color="primary" sx={{ mt: 1 }} />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Görünen Ad"
                  value={profile.displayName}
                  onChange={(e) => handleProfileChange('displayName', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="E-posta"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Saat Dilimi</InputLabel>
                  <Select
                    value={profile.timezone}
                    onChange={(e) => handleProfileChange('timezone', e.target.value)}
                  >
                    <MenuItem value="Europe/Istanbul">İstanbul (UTC+3)</MenuItem>
                    <MenuItem value="Europe/London">Londra (UTC+0)</MenuItem>
                    <MenuItem value="America/New_York">New York (UTC-5)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Storage sx={{ mr: 1 }} />
                Hesap İstatistikleri
              </Typography>
              
              <Grid container spacing={2}>
                {statsData.map((stat, index) => (
                  <Grid item xs={6} key={index}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#40444b', borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#5865f2' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Appearance Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Palette sx={{ mr: 1 }} />
                Görünüm Ayarları
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Tema</InputLabel>
                  <Select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                  >
                    <MenuItem value="dark">Koyu Tema</MenuItem>
                    <MenuItem value="light">Açık Tema</MenuItem>
                    <MenuItem value="auto">Otomatik</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Dil</InputLabel>
                  <Select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                  >
                    <MenuItem value="tr">Türkçe</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Español</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.compactMode}
                      onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                    />
                  }
                  label="Kompakt Mod"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showAnimations}
                      onChange={(e) => handleSettingChange('showAnimations', e.target.checked)}
                    />
                  }
                  label="Animasyonları Göster"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                Sistem Ayarları
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    />
                  }
                  label="Bildirimler"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoSave}
                      onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                    />
                  }
                  label="Otomatik Kaydetme"
                />

                <Divider sx={{ my: 2 }} />

                <Alert severity="info" sx={{ mb: 2 }}>
                  Güvenlik ayarlarınız Discord hesabınızla senkronize edilir.
                </Alert>

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => toast.error('Bu özellik henüz kullanılabilir değil')}
                >
                  İki Faktörlü Doğrulama
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Notifications sx={{ mr: 1 }} />
                Bildirim Tercihleri
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Bot Durumu Bildirimleri"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Yeni Üye Bildirimleri"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Moderasyon Bildirimleri"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Çekiliş Bildirimleri"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Günlük Rapor E-postaları"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Güvenlik Uyarıları"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleResetSettings}
        >
          Sıfırla
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveSettings}
        >
          Kaydet
        </Button>
      </Box>
    </motion.div>
  );
};

export default SettingsPage;



