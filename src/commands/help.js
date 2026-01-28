const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardım')
        .setDescription('❓ Tüm komutları ve bot özelliklerini görüntüle')
        .addStringOption(option =>
            option.setName('kategori')
                .setDescription('Görüntülenecek komut kategorisi')
                .addChoices(
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
            // Ana yardım menüsü - Geliştirilmiş
            const totalUsers = interaction.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
            const mainHelpEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🤖 NeuroViaBot - Gelişmiş Çok Amaçlı Discord Bot')
                .setDescription('**Modern ve profesyonel Discord botu!** ✨\n\nSunucunuzu bir üst seviyeye taşıyan kapsamlı özelliklerle donatılmıştır. 🚀\n\n**╔═══ 🎯 Bot Hakkında ═══╗**\n```yaml\n👥 Aktif Sunucular: ' + interaction.client.guilds.cache.size + ' sunucu\n📊 Toplam Kullanıcı: ' + totalUsers.toLocaleString() + ' kullanıcı\n⚡ Komut Sayısı: 43+ komut\n🔐 Güvenlik: SSL & Şifreli\n🌍 Dil Desteği: Türkçe\n⏰ Uptime: 7/24 (99.9%)\n📱 Platform: Web & Mobil\n```\n\n**╔═══ 📚 Komut Kategorileri ═══╗**\n*Detaylı bilgi için kategori seçin:*')
                .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
                .setImage('https://i.imgur.com/placeholder.png') // Bot banner placeholder
                .addFields(
                    {
                        name: '🎫 Ticket Sistemi',
                        value: '```fix\n/yardım kategori:Ticket Sistemi\n```\n• 🎟️ Destek talepleri\n• 📂 Kategorize sistem\n• 📄 Otomatik transcript\n• 🔔 Bildirimler',
                        inline: true
                    },
                    {
                        name: '🛡️ Moderasyon',
                        value: '```fix\n/yardım kategori:Moderasyon\n```\n• ⚠️ Uyarı sistemi\n• 🤖 Auto-mod\n• 🔨 Ban/Kick/Mute\n• 📋 Mod logs',
                        inline: true
                    },
                    {
                        name: '💰 Ekonomi Sistemi',
                        value: '```fix\n/yardım kategori:Ekonomi\n```\n• 💵 Para kazanma\n• 🎁 Günlük ödüller\n• 📊 Seviye sistemi\n• 🏪 Mağaza',
                        inline: true
                    },
                    {
                        name: '🎉 Çekiliş & Etkinlik',
                        value: '```fix\n/yardım kategori:Çekiliş & Etkinlik\n```\n• 🎁 Çekiliş oluşturma\n• ⏰ Otomatik sistem\n• 🎯 Rol gereksinimleri\n• 🏆 Çoklu ödüller',
                        inline: true
                    },
                    {
                        name: '⚙️ Yönetim & Ayarlar',
                        value: '```fix\n/yardım kategori:Yönetim & Ayarlar\n```\n• 🎛️ Sunucu ayarları\n• 👑 Rol yönetimi\n• 📝 Kanal ayarları\n• 💾 Yedekleme',
                        inline: true
                    }
                )
                .addFields(
                    {
                        name: '╔═══ 🌟 Öne Çıkan Özellikler ═══╗',
                        value: '```diff\n+ ✨ 7/24 Kesintisiz Hizmet\n+ 🔒 Gelişmiş Güvenlik & SSL\n+ 💎 Premium Özellikler\n+ 🌐 Gerçek Zamanlı Web Dashboard\n+ 📱 Mobil Uyumlu Arayüz\n+ 🔄 Otomatik Güncellemeler\n+ 🤖 AI Destekli Moderasyon\n+ 📊 Detaylı İstatistikler & Analitik\n+ 🌍 Çoklu Dil Desteği\n```',
                        inline: false
                    }
                )
                .addFields(
                    {
                        name: '📈 Bot İstatistikleri',
                        value: `\`\`\`yaml\nSunucular: ${interaction.client.guilds.cache.size}\nKullanıcılar: ${totalUsers.toLocaleString()}\nKomutlar: 43+\nUptime: 99.9%\nPing: ${interaction.client.ws.ping}ms\n\`\`\``,
                        inline: true
                    },
                    {
                        name: '🔗 Bağlantılar',
                        value: '🌐 [**Web Dashboard**](https://neuroviabot.xyz)\n💬 [**Destek Sunucusu**](https://discord.gg/neurovia)\n➕ [**Bot Davet Et**](https://discord.com/oauth2/authorize?client_id=773539215098249246&scope=bot%20applications.commands&permissions=8)\n📄 [**Dokümantasyon**](https://docs.neuroviabot.xyz)',
                        inline: true
                    },
                    {
                        name: '💡 Hızlı Başlangıç',
                        value: '```fix\n1. /setup - Bot kurulumu\n2. /yardım kategori:... - Kategori seçin\n3. /config - Ayarları düzenleyin\n4. Web Dashboard\'u kullanın\n```',
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `NeuroViaBot v2.0 • ${interaction.client.guilds.cache.size} sunucu • ${totalUsers.toLocaleString()} kullanıcı • neuroviabot.xyz`,
                    iconURL: interaction.client.user.displayAvatarURL({ size: 32 })
                })
                .setTimestamp();

            return interaction.reply({ embeds: [mainHelpEmbed] });
        }

        // Kategori bazlı yardım
        let helpEmbed;

        switch (category) {

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
                            value: '• **[neuroviabot.xyz](https://neuroviabot.xyz)** - Gelişmiş web paneli\n• Gerçek zamanlı istatistikler ve analitik\n• Uzaktan sunucu yönetimi\n• Mobil uyumlu responsive tasarım\n• Discord OAuth ile güvenli giriş\n• Anlık ayar değişiklikleri',
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
                            value: '• `/yardım` - Bu yardım menüsü\n• Web Dashboard: [neuroviabot.xyz](https://neuroviabot.xyz)\n• Destek: [Discord Sunucusu](https://discord.gg/neurovia)\n• Dokümantasyon: [docs.neuroviabot.xyz](https://docs.neuroviabot.xyz)',
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
            text: 'Ana menüye dönmek için /yardım komutunu kullan | NeuroViaBot v2.0 | neuroviabot.xyz',
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

        return interaction.reply({ embeds: [helpEmbed] });
    },
};

