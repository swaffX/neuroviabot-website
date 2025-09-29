const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('⏩ Şarkıda belirli bir zamana atla')
        .addStringOption(option =>
            option.setName('zaman')
                .setDescription('Atlanacak zaman (örn: 1:30, 90, 2:15)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);
        const timeInput = interaction.options.getString('zaman');

        // Kullanıcının sesli kanalda olup olmadığını kontrol et
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Bu komutu kullanabilmek için bir sesli kanalda olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Queue var mı ve şarkı çalıyor mu kontrol et
        if (!queue || !queue.currentTrack || !queue.isPlaying()) {
            const noMusicEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('🎵 Şu Anda Çalan Şarkı Yok')
                .setDescription('Atlamak için önce bir şarkı çalmalısın!')
                .addFields({
                    name: '🎵 Şarkı Çal',
                    value: '`/play [şarkı adı]` komutunu kullanarak şarkı çalmaya başlayabilirsin!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [noMusicEmbed] });
        }

        // Bot ve kullanıcı aynı kanalda mı
        const botChannel = interaction.guild.members.me?.voice?.channel;
        if (botChannel && voiceChannel.id !== botChannel.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Benimle aynı sesli kanalda olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            // Zaman formatını parse et
            const seekTime = parseTimeToMilliseconds(timeInput);
            
            if (seekTime === null) {
                const invalidTimeEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Geçersiz Zaman Formatı')
                    .setDescription('Lütfen geçerli bir zaman formatı kullanın!')
                    .addFields({
                        name: '✅ Geçerli Formatlar',
                        value: '• `90` - 90 saniye\n• `1:30` - 1 dakika 30 saniye\n• `2:15` - 2 dakika 15 saniye\n• `1:23:45` - 1 saat 23 dakika 45 saniye',
                        inline: false
                    })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [invalidTimeEmbed], ephemeral: true });
            }

            const currentTrack = queue.currentTrack;
            const progress = queue.node.getTimestamp();
            const totalDuration = progress?.total?.value || 0;

            // Şarkı süresini kontrol et
            if (seekTime > totalDuration) {
                const exceedsEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Süre Aşıldı')
                    .setDescription('Belirtilen zaman şarkının toplam süresini aşıyor!')
                    .addFields(
                        { name: '⏱️ İstenen Zaman', value: formatTime(seekTime), inline: true },
                        { name: '⏱️ Şarkı Süresi', value: currentTrack.duration, inline: true },
                        { name: '📏 Maksimum', value: formatTime(totalDuration), inline: true }
                    )
                    .setTimestamp();
                
                return interaction.reply({ embeds: [exceedsEmbed], ephemeral: true });
            }

            // Seek işlemi
            await queue.node.seek(seekTime);

            const currentTime = formatTime(seekTime);
            const progressBar = createProgressBar(seekTime, totalDuration, 25);

            const seekEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('⏩ Şarkıda Atlandı')
                .setDescription(`**${currentTrack.title}** şarkısında **${currentTime}** zamanına atlandı!`)
                .setThumbnail(currentTrack.thumbnail)
                .addFields(
                    { name: '🎤 Sanatçı', value: currentTrack.author, inline: true },
                    { name: '⏱️ Şu Anki Zaman', value: currentTime, inline: true },
                    { name: '⏱️ Toplam Süre', value: currentTrack.duration, inline: true },
                    { 
                        name: '📊 İlerleme', 
                        value: progressBar,
                        inline: false 
                    },
                    { name: '👤 Atlayan', value: interaction.user.username, inline: true },
                    { name: '🎵 Durum', value: 'Çalıyor', inline: true },
                    { name: '🔊 Ses Seviyesi', value: `${queue.node.volume}%`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [seekEmbed] });
            
        } catch (error) {
            console.error('Seek komutunda hata:', error);
            
            let errorMessage = 'Şarkıda atlama işlemi sırasında bir hata oluştu!';
            
            if (error.message.includes('seek')) {
                errorMessage = 'Bu şarkıda atlama işlemi desteklenmiyor! (Canlı yayın veya stream olabilir)';
            } else if (error.message.includes('not seekable')) {
                errorMessage = 'Bu şarkı türünde atlama işlemi yapılamaz!';
            }
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Atlama Hatası')
                .setDescription(errorMessage)
                .addFields({
                    name: '💡 İpucu',
                    value: '• Canlı yayınlarda atlama işlemi çalışmaz\n• Bazı şarkı türlerinde bu özellik desteklenmez\n• Şarkıyı yeniden başlatmayı deneyin',
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

// Zaman string'ini millisaniyeye çevir
function parseTimeToMilliseconds(timeStr) {
    try {
        // Sadece sayı ise (saniye)
        if (/^\d+$/.test(timeStr)) {
            return parseInt(timeStr) * 1000;
        }
        
        // MM:SS veya HH:MM:SS formatı
        const parts = timeStr.split(':').map(Number);
        
        if (parts.length === 2) {
            // MM:SS
            const [minutes, seconds] = parts;
            if (minutes >= 0 && seconds >= 0 && seconds < 60) {
                return (minutes * 60 + seconds) * 1000;
            }
        } else if (parts.length === 3) {
            // HH:MM:SS
            const [hours, minutes, seconds] = parts;
            if (hours >= 0 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60) {
                return (hours * 3600 + minutes * 60 + seconds) * 1000;
            }
        }
        
        return null;
    } catch {
        return null;
    }
}

// Millisaniyeyi zaman formatına çevir
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Progress bar oluştur
function createProgressBar(current, total, length = 20) {
    if (!total || total === 0) return '▱'.repeat(length);
    
    const percentage = current / total;
    const filledLength = Math.round(length * percentage);
    const emptyLength = length - filledLength;
    
    return '▰'.repeat(filledLength) + '▱'.repeat(emptyLength);
}



