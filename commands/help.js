const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('❓ Tüm komutları ve bot özelliklerini görüntüle')
        .addStringOption(option =>
            option.setName('kategori')
                .setDescription('Görüntülenecek komut kategorisi')
                .addChoices(
                    { name: '🎵 Müzik Sistemi', value: 'music' },
                    { name: '🎫 Ticket Sistemi', value: 'ticket' },
                    { name: '🛡️ Moderasyon', value: 'moderation' },
                    { name: '💰 Ekonomi', value: 'economy' },
                    { name: '🎉 Çekiliş & Etkinlik', value: 'giveaway' },
                    { name: '⚙️ Yönetim & Ayarlar', value: 'admin' },
                    { name: '📊 Genel & Bilgi', value: 'general' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        const category = interaction.options.getString('kategori');

        if (!category) {
            // Ana yardım menüsü
            const mainHelpEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🤖 Çok Amaçlı Discord Bot - Yardım Menüsü')
                .setDescription('**Modern ve güçlü Discord botu!** Müzik, moderasyon, ekonomi ve daha fazlası için tasarlandı. 🚀\n\n**Aşağıdaki kategorilerden birini seçerek detaylı bilgi alabilirsin:**')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .addFields(
                    {
                        name: '🎵 **Müzik Sistemi**',
                        value: '`/help kategori:Müzik Sistemi`\n• YouTube & Spotify desteği\n• Gelişmiş kuyruk yönetimi\n• Kaliteli ses deneyimi',
                        inline: true
                    },
                    {
                        name: '🎫 **Ticket Sistemi**',
                        value: '`/help kategori:Ticket Sistemi`\n• Destek talepleri\n• Kategorize ticket\'lar\n• Otomatik transcript',
                        inline: true
                    },
                    {
                        name: '🛡️ **Moderasyon**',
                        value: '`/help kategori:Moderasyon`\n• Uyarı sistemi\n• Otomatik moderasyon\n• Ban/Kick/Mute araçları',
                        inline: true
                    },
                    {
                        name: '💰 **Ekonomi Sistemi**',
                        value: '`/help kategori:Ekonomi`\n• Para kazanma\n• Günlük ödüller\n• Seviye sistemi',
                        inline: true
                    },
                    {
                        name: '🎉 **Çekiliş & Etkinlik**',
                        value: '`/help kategori:Çekiliş & Etkinlik`\n• Çekiliş oluşturma\n• Otomatik çekiliş\n• Rol verme sistemi',
                        inline: true
                    },
                    {
                        name: '⚙️ **Yönetim & Ayarlar**',
                        value: '`/help kategori:Yönetim & Ayarlar`\n• Sunucu ayarları\n• Rol yönetimi\n• Kanal konfigürasyonu',
                        inline: true
                    }
                )
                .addFields(
                    {
                        name: '🌟 **Öne Çıkan Özellikler**',
                        value: '```yaml\n✨ 7/24 Aktif Bot\n🎵 Yüksek Kalite Müzik\n🔒 Güvenli Moderasyon\n💎 Premium Özellikler\n🌐 Web Dashboard\n📱 Mobil Uyumlu\n🔄 Otomatik Güncellemeler\n```',
                        inline: false
                    },
                    {
                        name: '📈 **Bot İstatistikleri**',
                        value: `• **Sunucular:** ${interaction.client.guilds.cache.size}\n• **Kullanıcılar:** ${interaction.client.users.cache.size}\n• **Komutlar:** 50+\n• **Uptime:** 99.9%`,
                        inline: true
                    },
                    {
                        name: '🔗 **Bağlantılar**',
                        value: '• [Web Dashboard](http://localhost:3000)\n• [Destek Sunucusu](https://discord.gg/support)\n• [Bot Davet Et](https://discord.com/invite)',
                        inline: true
                    }
                )
                .setFooter({ 
                    text: 'Detaylı komut bilgileri için yukarıdaki kategorilerden birini seçin | Bot v1.0.0',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            return interaction.reply({ embeds: [mainHelpEmbed] });
        }

        // Kategori bazlı yardım
        let helpEmbed;

        switch (category) {
            case 'music':
                helpEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('🎵 Müzik Sistemi Komutları')
                    .setDescription('**Yüksek kaliteli müzik deneyimi!** YouTube ve Spotify desteği ile sınırsız müzik keyfini yaşa.')
                    .addFields(
                        {
                            name: '🎶 **Temel Müzik Komutları**',
                            value: '`/play <şarkı>` - Müzik çal/kuyruğa ekle\n`/pause` - Müziği duraklat\n`/resume` - Müziği devam ettir\n`/skip [sayı]` - Şarkı atla\n`/stop` - Müziği durdur',
                            inline: false
                        },
                        {
                            name: '📋 **Kuyruk Yönetimi**',
                            value: '`/queue [sayfa]` - Kuyruğu görüntüle\n`/nowplaying` - Şu anki şarkı\n`/clear` - Kuyruğu temizle\n`/remove <pozisyon>` - Şarkı kaldır\n`/shuffle` - Kuyruğu karıştır',
                            inline: true
                        },
                        {
                            name: '🎛️ **Gelişmiş Kontroller**',
                            value: '`/volume <1-100>` - Ses seviyesi\n`/seek <zaman>` - Şarkıda atla\n`/loop [mod]` - Döngü modu\n`/join` - Kanala katıl\n`/leave` - Kanaldan ayrıl',
                            inline: true
                        },
                        {
                            name: '✨ **Özellikler**',
                            value: '• YouTube & Spotify desteği\n• Playlist import\n• Kaliteli ses kodlama\n• Gelişmiş arama\n• Otomatik öneriler',
                            inline: false
                        }
                    );
                break;

            case 'ticket':
                helpEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('🎫 Ticket Sistemi Komutları')
                    .setDescription('**Profesyonel destek sistemi!** Organize destek talepleri ve otomatik yönetim.')
                    .addFields(
                        {
                            name: '🎫 **Temel Ticket Komutları**',
                            value: '`/ticket create` - Yeni ticket oluştur\n`/ticket close` - Ticket\'ı kapat\n`/ticket add @user` - Kullanıcı ekle\n`/ticket remove @user` - Kullanıcı çıkar',
                            inline: false
                        },
                        {
                            name: '⚙️ **Ticket Yönetimi**',
                            value: '`/ticket setup` - Ticket sistemini kur\n`/ticket config` - Ayarları düzenle\n`/ticket stats` - İstatistikleri görüntüle\n`/ticket panel` - Kontrol paneli',
                            inline: true
                        },
                        {
                            name: '📊 **Ticket Kategorileri**',
                            value: '• 🎫 Genel Destek\n• 🔧 Teknik Destek\n• ⚠️ Şikayet\n• 💰 Satış Desteği\n• 🎮 Oyun Desteği',
                            inline: true
                        },
                        {
                            name: '✨ **Özellikler**',
                            value: '• Otomatik transcript\n• Kategori sistemi\n• Rol bazlı erişim\n• Log sistemi\n• E-posta bildirimleri',
                            inline: false
                        }
                    );
                break;

            case 'moderation':
                helpEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('🛡️ Moderasyon Komutları')
                    .setDescription('**Güçlü moderasyon araçları!** Sunucunuzu güvenli ve düzenli tutun.')
                    .addFields(
                        {
                            name: '⚡ **Temel Moderasyon**',
                            value: '`/mod ban @user [sebep]` - Kullanıcıyı banla\n`/mod kick @user [sebep]` - Kullanıcıyı at\n`/mod mute @user [süre]` - Sustur\n`/mod warn @user <sebep>` - Uyarı ver',
                            inline: false
                        },
                        {
                            name: '🔧 **Gelişmiş Araçlar**',
                            value: '`/clear-messages <sayı>` - Mesaj sil\n`/mod timeout @user <süre>` - Timeout\n`/mod unmute @user` - Susturmayı kaldır\n`/mod unban <user-id>` - Ban kaldır',
                            inline: true
                        },
                        {
                            name: '📋 **Uyarı Sistemi**',
                            value: '`/mod warnings @user` - Uyarıları görüntüle\n`/mod clear-warnings @user` - Uyarıları temizle\n`/mod case <numara>` - Moderasyon kaydı görüntüle\n`/mod history @user` - Kullanıcı geçmişi',
                            inline: true
                        },
                        {
                            name: '🤖 **Otomatik Moderasyon**',
                            value: '• Spam koruması\n• Link filtreleme\n• Küfür filtreleme\n• Raid koruması\n• Anti-bot sistemi',
                            inline: false
                        }
                    );
                break;

            case 'economy':
                helpEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('💰 Ekonomi Sistemi Komutları')
                    .setDescription('**Eğlenceli ekonomi sistemi!** Para kazan, seviye atla ve ödüller kazan.')
                    .addFields(
                        {
                            name: '💵 **Para Kazanma**',
                            value: '`/economy daily` - Günlük ödül al\n`/economy work` - Çalışarak para kazan\n`/economy balance [@user]` - Bakiye görüntüle\n`/economy transfer @user <miktar>` - Para gönder',
                            inline: false
                        },
                        {
                            name: '🎮 **Oyunlar & Bahis**',
                            value: '`/coinflip <bahis>` - Yazı tura\n`/dice <bahis>` - Zar atma\n`/slots <bahis>` - Slot makinesi\n`/blackjack <bahis>` - Blackjack',
                            inline: true
                        },
                        {
                            name: '📊 **Seviye Sistemi**',
                            value: '`/level rank [@user]` - Seviye görüntüle\n`/level leaderboard` - Liderlik tablosu\n`/level add-xp @user <miktar>` - XP ver\n`/level setup` - Sistem ayarları',
                            inline: true
                        },
                        {
                            name: '🏪 **Mağaza & Envanter**',
                            value: '`/shop` - Mağazayı görüntüle\n`/buy <item>` - Ürün satın al\n`/inventory [@user]` - Envanteri görüntüle\n`/economy stats` - Ekonomi istatistikleri',
                            inline: false
                        }
                    );
                break;

            case 'giveaway':
                helpEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('🎉 Çekiliş & Etkinlik Komutları')
                    .setDescription('**Heyecan verici çekilişler!** Topluluk etkinlikleri ve ödül dağıtımları düzenle.')
                    .addFields(
                        {
                            name: '🎁 **Çekiliş Yönetimi**',
                            value: '`/giveaway create` - Çekiliş oluştur\n`/giveaway end <id>` - Çekilişi bitir\n`/giveaway reroll <id>` - Yeniden çek\n`/giveaway list` - Aktif çekilişler',
                            inline: false
                        },
                        {
                            name: '⚙️ **Çekiliş Ayarları**',
                            value: '`/giveaway setup` - Otomatik çekiliş kur\n`/giveaway requirements` - Gereksinimler\n`/giveaway blacklist` - Kara liste',
                            inline: true
                        },
                        {
                            name: '🎪 **Etkinlik Araçları**',
                            value: '`/event create` - Etkinlik oluştur\n`/poll create` - Anket oluştur\n`/announcement` - Duyuru yap',
                            inline: true
                        },
                        {
                            name: '✨ **Özellikler**',
                            value: '• Rol gereksinimleri\n• Çoklu ödüller\n• Otomatik başlatma\n• Katılım takibi\n• Bonus sistemler',
                            inline: false
                        }
                    );
                break;

            case 'admin':
                helpEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('⚙️ Yönetim & Ayarlar Komutları')
                    .setDescription('**Kapsamlı sunucu yönetimi!** Tüm bot ayarlarını ve sunucu konfigürasyonunu kontrol edin.')
                    .addFields(
                        {
                            name: '🎛️ **Sunucu Ayarları**',
                            value: '`/setup` - Bot kurulum sihirbazı\n`/config` - Genel ayarlar\n`/channels` - Kanal ayarları\n`/roles` - Rol ayarları',
                            inline: false
                        },
                        {
                            name: '🔧 **Sistem Ayarları**',
                            value: '`/welcome setup` - Hoşgeldin sistemi\n`/automod config` - Otomatik moderasyon\n`/logging setup` - Log sistemi',
                            inline: true
                        },
                        {
                            name: '📊 **Yönetim Araçları**',
                            value: '`/backup create` - Sunucu yedeği\n`/backup restore` - Yedeği geri yükle\n`/settings export` - Ayarları dışa aktar',
                            inline: true
                        },
                        {
                            name: '🌐 **Web Dashboard**',
                            value: '• Gelişmiş web paneli\n• Grafik ve istatistikler\n• Uzaktan yönetim\n• Mobil uyumlu\n• Gerçek zamanlı güncellemeler',
                            inline: false
                        }
                    );
                break;

            case 'general':
                helpEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('📊 Genel & Bilgi Komutları')
                    .setDescription('**Bot bilgileri ve genel komutlar.** Performans, istatistikler ve yardım komutları.')
                    .addFields(
                        {
                            name: '📈 **Bot İstatistikleri**',
                            value: '`/stats` - Bot istatistikleri\n`/ping` - Gecikme süresi\n`/uptime` - Çalışma süresi\n`/serverinfo` - Sunucu bilgileri',
                            inline: false
                        },
                        {
                            name: '👤 **Kullanıcı Bilgileri**',
                            value: '`/userinfo [@user]` - Kullanıcı profili\n`/avatar [@user]` - Profil fotoğrafı\n`/joined [@user]` - Katılım tarihi',
                            inline: true
                        },
                        {
                            name: '🔍 **Arama & Araçlar**',
                            value: '`/search <terim>` - Arama yap\n`/translate <metin>` - Çeviri\n`/qr <metin>` - QR kod oluştur',
                            inline: true
                        },
                        {
                            name: '🎯 **Hızlı Erişim**',
                            value: '• `/help` - Bu yardım menüsü\n• Web Dashboard: [localhost:3000](http://localhost:3000)\n• Destek: [Discord Sunucusu](https://discord.gg/support)\n• Durum: [Bot Status](http://status.bot.com)',
                            inline: false
                        }
                    );
                break;

            default:
                return interaction.reply({ 
                    content: '❌ Geçersiz kategori!', 
                    flags: 64 // MessageFlags.Ephemeral
                });
        }

        helpEmbed.setFooter({ 
            text: 'Ana menüye dönmek için /help komutunu kullan | Bot v1.0.0',
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

        return interaction.reply({ embeds: [helpEmbed] });
    },
};

