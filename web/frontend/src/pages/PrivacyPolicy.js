import React from 'react';
import { Box, Container, Typography, Paper, Divider, Alert } from '@mui/material';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
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
              border: '1px solid rgba(67, 181, 129, 0.3)',
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
                background: 'linear-gradient(45deg, #43b581, #5865f2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Gizlilik Politikası
            </Typography>

            <Typography variant="body2" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
              Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
            </Typography>

            <Alert 
              severity="info" 
              sx={{ 
                mb: 4,
                bgcolor: 'rgba(88, 101, 242, 0.1)',
                border: '1px solid rgba(88, 101, 242, 0.3)',
                '& .MuiAlert-icon': { color: '#5865f2' }
              }}
            >
              Bu gizlilik politikası, Discord Bot Dashboard hizmetimizi kullanırken kişisel verilerinizin 
              nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
            </Alert>

            <Divider sx={{ mb: 4, bgcolor: 'rgba(67, 181, 129, 0.3)' }} />

            {/* 1. Toplanan Veriler */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                1. Toplanan Veriler
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, color: '#5865f2', fontWeight: 500 }}>
                Discord'dan Alınan Bilgiler:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li>Discord kullanıcı ID'niz</li>
                <li>Kullanıcı adı ve discriminator (#1234)</li>
                <li>Avatar URL'i</li>
                <li>E-posta adresi (OAuth izni ile)</li>
                <li>Sunucu üyelikleri (sadece botun bulunduğu sunucular)</li>
              </Box>

              <Typography variant="h6" sx={{ mb: 2, color: '#5865f2', fontWeight: 500 }}>
                Kullanım Verileri:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li>Bot komutları kullanım geçmişi</li>
                <li>Sunucu ayarları ve konfigürasyonları</li>
                <li>Ekonomi sistemi verileri (coin, seviye vb.)</li>
                <li>Müzik dinleme geçmişi</li>
                <li>Moderasyon işlemleri kayıtları</li>
              </Box>
            </Box>

            {/* 2. Veri Kullanım Amaçları */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                2. Veri Kullanım Amaçları
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Toplanan veriler aşağıdaki amaçlar için kullanılır:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li>Bot hizmetlerinin sağlanması ve işletilmesi</li>
                <li>Kullanıcı deneyiminin kişiselleştirilmesi</li>
                <li>Hizmet performansının analiz edilmesi</li>
                <li>Teknik destek sağlanması</li>
                <li>Güvenlik ve suiistimal önleme</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              </Box>
            </Box>

            {/* 3. Veri Saklama ve Güvenlik */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                3. Veri Saklama ve Güvenlik
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                <strong>Saklama Süresi:</strong> Verileriniz hizmeti aktif olarak kullandığınız süre boyunca saklanır. 
                Hesabınızı silerseniz, kişisel veriler 30 gün içinde silinir.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                <strong>Güvenlik:</strong> Verilerinizi korumak için modern şifreleme yöntemleri, güvenli veri tabanları 
                ve erişim kontrolleri kullanıyoruz.
              </Typography>
            </Box>

            {/* 4. Veri Paylaşımı */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                4. Veri Paylaşımı
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Kişisel verilerinizi <strong>satmıyoruz, kiralamıyoruz veya üçüncü şahıslarla paylaşmıyoruz</strong>. 
                Ancak aşağıdaki durumlarda veri paylaşımı gerekebilir:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li>Yasal zorunluluklar (mahkeme kararı, yasal süreç)</li>
                <li>Güvenlik tehditlerinin önlenmesi</li>
                <li>Hizmet sağlayıcıları (sadece gerekli veriler, gizlilik anlaşması ile)</li>
              </Box>
            </Box>

            {/* 5. Kullanıcı Hakları */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                5. Kullanıcı Hakları
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                KVKK (Kişisel Verilerin Korunması Kanunu) kapsamında haklarınız:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li><strong>Erişim hakkı:</strong> Hangi verilerinizin işlendiğini öğrenme</li>
                <li><strong>Düzeltme hakkı:</strong> Yanlış verilerin düzeltilmesini isteme</li>
                <li><strong>Silme hakkı:</strong> Verilerinizin silinmesini isteme</li>
                <li><strong>İtiraz hakkı:</strong> Veri işlemeye itiraz etme</li>
                <li><strong>Veri taşınabilirliği:</strong> Verilerinizi başka platformlara aktarma</li>
              </Box>
            </Box>

            {/* 6. Çerezler (Cookies) */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                6. Çerezler ve Yerel Depolama
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Web panelimiz şu amaçlarla çerezler kullanır:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li>Oturum yönetimi (JWT token)</li>
                <li>Kullanıcı tercihlerinin hatırlanması</li>
                <li>Hizmet performansının analizi</li>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                Çerezleri tarayıcı ayarlarından yönetebilirsiniz.
              </Typography>
            </Box>

            {/* 7. Çocukların Gizliliği */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                7. Çocukların Gizliliği
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Hizmetimiz Discord'un yaş sınırlamasına tabidir (13 yaş). 13 yaşından küçük çocuklardan 
                bilerek kişisel veri toplamıyoruz.
              </Typography>
            </Box>

            {/* 8. Politika Değişiklikleri */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                8. Politika Değişiklikleri
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Bu gizlilik politikasını güncelleyebiliriz. Önemli değişiklikler Discord sunucumuz ve 
                web paneli üzerinden duyurulacaktır.
              </Typography>
            </Box>

            {/* 9. İletişim */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#43b581', fontWeight: 600 }}>
                9. İletişim ve Veri Koruma Sorumlusu
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Gizlilik ile ilgili sorular, talepler veya şikayetler için:
              </Typography>
              <Box component="ul" sx={{ ml: 3, mb: 2 }}>
                <li>Discord sunucumuz üzerinden ticket açabilirsiniz</li>
                <li>Bot komutları ile destek talep edebilirsiniz</li>
                <li>KVKK hakklarınızı kullanmak için başvuru formunu doldurun</li>
              </Box>
            </Box>

            <Divider sx={{ my: 4, bgcolor: 'rgba(67, 181, 129, 0.3)' }} />

            <Alert 
              severity="success" 
              sx={{ 
                bgcolor: 'rgba(67, 181, 129, 0.1)',
                border: '1px solid rgba(67, 181, 129, 0.3)',
                '& .MuiAlert-icon': { color: '#43b581' }
              }}
            >
              <strong>Kişisel Veri İşleme İlkelerimiz:</strong>
              <br />
              Hukuka uygunluk • Doğruluk • Amaçla sınırlılık • Orantılılık • 
              Veri minimizasyonu • Güvenlik • Hesap verebilirlik
            </Alert>

            <Typography
              variant="body2"
              sx={{
                mt: 3,
                textAlign: 'center',
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              Bu gizlilik politikası KVKK ve GDPR uyumlu olarak hazırlanmıştır.
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
