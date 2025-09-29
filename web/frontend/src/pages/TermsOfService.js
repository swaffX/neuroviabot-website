import React from 'react';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import { motion } from 'framer-motion';

const TermsOfService = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c2f33 0%, #23272a 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              background: 'rgba(54, 57, 63, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(88, 101, 242, 0.3)',
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                mb: 3,
                textAlign: 'center',
                fontWeight: 700,
                background: 'linear-gradient(45deg, #5865f2, #43b581)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Hizmet Şartları
            </Typography>

            <Typography variant="body2" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
              Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
            </Typography>

            <Divider sx={{ mb: 4, bgcolor: 'rgba(88, 101, 242, 0.3)' }} />

            {/* 1. Hizmetin Kabulü */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#5865f2', fontWeight: 600 }}>
                1. Hizmetin Kabulü
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Discord Bot Dashboard hizmetini kullanarak, bu Hizmet Şartlarını kabul etmiş olursunuz. 
                Bu şartları kabul etmiyorsanız, hizmeti kullanmayınız.
              </Typography>
            </Box>

            {/* 2. Hizmet Açıklaması */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#5865f2', fontWeight: 600 }}>
                2. Hizmet Açıklaması
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Bu hizmet, Discord botları için yönetim paneli ve çeşitli özellikler sunar:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li>Müzik sistemi yönetimi</li>
                <li>Moderasyon araçları</li>
                <li>Ekonomi sistemi</li>
                <li>Ticket sistemi</li>
                <li>Çekiliş ve etkinlik yönetimi</li>
              </Box>
            </Box>

            {/* 3. Kullanıcı Sorumlulukları */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#5865f2', fontWeight: 600 }}>
                3. Kullanıcı Sorumlulukları
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Hizmeti kullanırken:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li>Discord Topluluk Kurallarına uygun davranmalısınız</li>
                <li>Yasadışı faaliyetlerde bulunmamalısınız</li>
                <li>Diğer kullanıcıların haklarına saygı göstermelisiniz</li>
                <li>Spam veya zararlı içerik paylaşmamalısınız</li>
              </Box>
            </Box>

            {/* 4. Hizmet Kullanılabilirliği */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#5865f2', fontWeight: 600 }}>
                4. Hizmet Kullanılabilirliği
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Hizmetimizi kesintisiz sunmaya çalışsak da, teknik nedenlerle geçici kesintiler yaşanabilir. 
                Bu durumlar için sorumluluk kabul etmiyoruz.
              </Typography>
            </Box>

            {/* 5. Veri ve Gizlilik */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#5865f2', fontWeight: 600 }}>
                5. Veri ve Gizlilik
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Kişisel verilerinizin korunması bizim için önemlidir. Veri işleme politikalarımız hakkında 
                detaylı bilgi için <strong>Gizlilik Politikası</strong> sayfamızı inceleyin.
              </Typography>
            </Box>

            {/* 6. Hizmet Değişiklikleri */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#5865f2', fontWeight: 600 }}>
                6. Hizmet Değişiklikleri
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Hizmet şartlarımızı ve özelliklerimizi önceden haber vermeksizin değiştirme hakkımızı saklı tutarız. 
                Önemli değişiklikler Discord sunucumuz üzerinden duyurulacaktır.
              </Typography>
            </Box>

            {/* 7. Sorumluluk Reddi */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#5865f2', fontWeight: 600 }}>
                7. Sorumluluk Reddi
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Hizmetimiz "olduğu gibi" sunulmaktadır. Herhangi bir garanti vermiyoruz ve hizmet kullanımından 
                doğabilecek zararlardan sorumlu değiliz.
              </Typography>
            </Box>

            {/* 8. İletişim */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#5865f2', fontWeight: 600 }}>
                8. İletişim
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Hizmet şartları ile ilgili sorularınız için Discord sunucumuz üzerinden iletişime geçebilirsiniz.
              </Typography>
            </Box>

            <Divider sx={{ my: 4, bgcolor: 'rgba(88, 101, 242, 0.3)' }} />

            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              Bu hizmet şartları Türkiye Cumhuriyeti kanunlarına tabidir.
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default TermsOfService;
