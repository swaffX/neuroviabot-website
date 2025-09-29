import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Chat, Security, Speed, Settings } from '@mui/icons-material';
import { authService } from '../services/authService';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);

  const handleDiscordLogin = () => {
    setLoading(true);
    const authURL = authService.getDiscordAuthURL();
    window.location.href = authURL;
  };

  const features = [
    {
      icon: <Chat sx={{ fontSize: 40, color: '#5865f2' }} />,
      title: 'Discord Entegrasyonu',
      description: 'Discord hesabınızla güvenli giriş yapın ve tüm sunucularınıza erişin'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: '#43b581' }} />,
      title: 'Güvenli Yönetim',
      description: 'Moderasyon, güvenlik ve kullanıcı yönetimi araçları'
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#faa61a' }} />,
      title: 'Gerçek Zamanlı',
      description: 'Canlı istatistikler ve anlık bildirimler'
    },
    {
      icon: <Settings sx={{ fontSize: 40, color: '#f04747' }} />,
      title: 'Kolay Yapılandırma',
      description: 'Sürükle-bırak ile bot ayarlarını kolayca düzenleyin'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c2f33 0%, #23272a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: 'linear-gradient(45deg, #5865f2, #43b581)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Discord Bot Dashboard
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: 'text.secondary', mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              Profesyonel Discord bot yönetimi için modern ve kullanıcı dostu panel
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                background: 'rgba(54, 57, 63, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(88, 101, 242, 0.3)',
                borderRadius: 3,
                maxWidth: 400,
                width: '100%',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Chat sx={{ fontSize: 60, color: '#5865f2', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Discord ile Giriş Yap
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Discord hesabınızla güvenli giriş yaparak tüm bot özelliklerine erişin
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleDiscordLogin}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(45deg, #5865f2, #7289da)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #4752c4, #677bc4)',
                    },
                    py: 1.5,
                    fontSize: '16px',
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <Chat sx={{ mr: 1 }} />
                      Discord ile Devam Et
                    </>
                  )}
                </Button>
              </Box>
            </Paper>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              maxWidth: 1000,
              mx: 'auto',
            }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    background: 'rgba(54, 57, 63, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(66, 70, 77, 0.8)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {feature.icon}
                      <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Discord Bot Dashboard v1.0.0 - Professional Bot Management
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginPage;

