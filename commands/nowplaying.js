const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎵 Şu anda çalan şarkıyı görüntüle'),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);

        // Queue var mı ve şarkı çalıyor mu kontrol et
        if (!queue || !queue.currentTrack) {
            const noMusicEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('🎵 Şu Anda Çalan Şarkı Yok')
                .setDescription('Şu anda hiçbir şarkı çalmıyor!')
                .addFields({
                    name: '🎵 Şarkı Çalmaya Başla',
                    value: '`/play [şarkı adı]` komutunu kullanarak şarkı çalmaya başlayabilirsin!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [noMusicEmbed] });
        }

        try {
            const track = queue.currentTrack;
            const progress = queue.node.getTimestamp();
            const isPlaying = queue.isPlaying();
            const isPaused = queue.node.isPaused();

            // Progress bar oluştur
            const progressBar = createProgressBar(progress, 25);
            
            // Müzik durumu
            let statusEmoji = '🎵';
            let statusText = 'Çalıyor';
            
            if (isPaused) {
                statusEmoji = '⏸️';
                statusText = 'Duraklatıldı';
            } else if (!isPlaying) {
                statusEmoji = '⏹️';
                statusText = 'Durdu';
            }

            const nowPlayingEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${statusEmoji} Şu Anda Çalıyor`)
                .setDescription(`**[${track.title}](${track.url})**`)
                .setThumbnail(track.thumbnail)
                .addFields(
                    { name: '🎤 Sanatçı', value: track.author, inline: true },
                    { name: '👤 İsteyen', value: track.requestedBy.username, inline: true },
                    { name: '🔗 Kaynak', value: track.source, inline: true },
                    { 
                        name: '⏱️ İlerleme', 
                        value: `${progressBar}\n${progress?.current?.label || '0:00'} / ${track.duration}`,
                        inline: false 
                    },
                    { name: '📊 Durum', value: statusText, inline: true },
                    { name: '🔊 Ses Seviyesi', value: `${queue.node.volume}%`, inline: true },
                    { name: '🔁 Döngü', value: getLoopModeText(queue.repeatMode), inline: true }
                );

            // Ek bilgiler varsa ekle
            if (track.views) {
                nowPlayingEmbed.addFields({ 
                    name: '👁️ Görüntülenme', 
                    value: track.views.toLocaleString(), 
                    inline: true 
                });
            }

            if (track.queryType) {
                nowPlayingEmbed.addFields({ 
                    name: '🎵 Platform', 
                    value: track.queryType, 
                    inline: true 
                });
            }

            // Kuyruk bilgisi
            if (queue.tracks.size > 0) {
                const nextTrack = queue.tracks.at(0);
                nowPlayingEmbed.addFields({
                    name: '⏭️ Sıradaki',
                    value: `**${nextTrack.title}** - ${nextTrack.author}`,
                    inline: false
                });
            }

            nowPlayingEmbed.addFields({
                name: '🎮 Kontroller',
                value: '`/pause` - Duraklat\n`/resume` - Devam ettir\n`/skip` - Atla\n`/stop` - Durdur\n`/queue` - Kuyruğu görüntüle',
                inline: false
            })
            .setTimestamp();

            await interaction.reply({ embeds: [nowPlayingEmbed] });
            
        } catch (error) {
            console.error('Nowplaying komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Görüntüleme Hatası')
                .setDescription('Şu anda çalan şarkı bilgileri alınırken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

// Progress bar oluştur
function createProgressBar(progress, length = 20) {
    if (!progress || !progress.total) return '▱'.repeat(length);
    
    const percentage = progress.current.value / progress.total.value;
    const filledLength = Math.round(length * percentage);
    const emptyLength = length - filledLength;
    
    return '▰'.repeat(filledLength) + '▱'.repeat(emptyLength);
}

// Loop mode text
function getLoopModeText(mode) {
    switch (mode) {
        case 0: return 'Kapalı';
        case 1: return 'Şarkı';
        case 2: return 'Kuyruk';
        default: return 'Kapalı';
    }
}

