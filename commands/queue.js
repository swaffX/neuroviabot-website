const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Müzik kuyruğunu görüntüle')
        .addIntegerOption(option =>
            option.setName('sayfa')
                .setDescription('Görüntülenecek sayfa numarası (her sayfada 10 şarkı)')
                .setMinValue(1)
                .setRequired(false)
        ),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);
        const page = interaction.options.getInteger('sayfa') || 1;

        // Queue var mı kontrol et
        if (!queue || (!queue.currentTrack && queue.tracks.size === 0)) {
            const emptyQueueEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📭 Kuyruk Boş')
                .setDescription('Şu anda kuyruğunuzda hiç şarkı yok!')
                .addFields({
                    name: '🎵 Şarkı Ekle',
                    value: '`/play [şarkı adı]` komutunu kullanarak şarkı ekleyebilirsin!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [emptyQueueEmbed] });
        }

        try {
            const tracks = queue.tracks.toArray();
            const itemsPerPage = 10;
            const maxPages = Math.ceil(tracks.length / itemsPerPage);
            
            // Sayfa kontrolü
            if (page > maxPages && maxPages > 0) {
                const invalidPageEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Geçersiz Sayfa')
                    .setDescription(`Maksimum ${maxPages} sayfa var! Lütfen 1-${maxPages} arasında bir sayfa seçin.`)
                    .setTimestamp();
                
                return interaction.reply({ embeds: [invalidPageEmbed], ephemeral: true });
            }

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = tracks.slice(startIndex, endIndex);

            const queueEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('📋 Müzik Kuyruğu')
                .setTimestamp();

            // Şu anda çalan şarkı
            if (queue.currentTrack) {
                const currentTrack = queue.currentTrack;
                const progress = queue.node.getTimestamp();
                const progressBar = createProgressBar(progress);
                
                queueEmbed.addFields({
                    name: '🎵 Şu Anda Çalıyor',
                    value: `**${currentTrack.title}** - ${currentTrack.author}\n` +
                           `👤 İsteyen: ${currentTrack.requestedBy.username}\n` +
                           `${progressBar}\n` +
                           `⏱️ ${progress?.current?.label || '0:00'} / ${currentTrack.duration}`,
                    inline: false
                });
            }

            // Kuyruk bilgileri
            if (tracks.length > 0) {
                let queueDescription = '';
                
                pageItems.forEach((track, index) => {
                    const position = startIndex + index + 1;
                    queueDescription += `**${position}.** [${track.title}](${track.url}) - ${track.author}\n` +
                                      `👤 ${track.requestedBy.username} • ⏱️ ${track.duration}\n\n`;
                });

                queueEmbed.setDescription(queueDescription);
                
                // Sayfa bilgisi
                if (maxPages > 1) {
                    queueEmbed.setFooter({ 
                        text: `Sayfa ${page}/${maxPages} • Toplam ${tracks.length} şarkı • Toplam süre: ${calculateTotalDuration(tracks)}`,
                        iconURL: interaction.client.user.displayAvatarURL()
                    });
                } else {
                    queueEmbed.setFooter({ 
                        text: `Toplam ${tracks.length} şarkı • Toplam süre: ${calculateTotalDuration(tracks)}`,
                        iconURL: interaction.client.user.displayAvatarURL()
                    });
                }
            } else {
                queueEmbed.addFields({
                    name: '📝 Sıradaki Şarkılar',
                    value: 'Kuyruğunda başka şarkı yok!',
                    inline: false
                });
            }

            // Kuyruk istatistikleri
            queueEmbed.addFields(
                { name: '🔊 Ses Seviyesi', value: `${queue.node.volume}%`, inline: true },
                { name: '🔁 Döngü', value: getLoopModeText(queue.repeatMode), inline: true },
                { name: '🎲 Karıştır', value: queue.tracks.shuffled ? 'Açık' : 'Kapalı', inline: true }
            );

            await interaction.reply({ embeds: [queueEmbed] });
            
        } catch (error) {
            console.error('Queue komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kuyruk Hatası')
                .setDescription('Kuyruk görüntülenirken bir hata oluştu!')
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

// Toplam süre hesapla
function calculateTotalDuration(tracks) {
    if (!tracks.length) return '0:00';
    
    let totalSeconds = 0;
    tracks.forEach(track => {
        const [minutes, seconds] = track.duration.split(':').map(Number);
        totalSeconds += (minutes * 60) + seconds;
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
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

