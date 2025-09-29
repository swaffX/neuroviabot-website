const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('🔊 Ses seviyesini ayarla veya görüntüle')
        .addIntegerOption(option =>
            option.setName('seviye')
                .setDescription('Ses seviyesi (1-100, boş bırakırsan mevcut seviyeyi gösterir)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(false)
        ),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);
        const volume = interaction.options.getInteger('seviye');

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

        // Queue var mı kontrol et
        if (!queue) {
            const noQueueEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('❌ Müzik Çalmıyor')
                .setDescription('Şu anda müzik çalmıyor! Önce bir şarkı çalmalısın.')
                .addFields({
                    name: '🎵 Şarkı Çal',
                    value: '`/play [şarkı adı]` komutunu kullanarak şarkı çalmaya başlayabilirsin!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [noQueueEmbed] });
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
            if (volume === null) {
                // Sadece mevcut ses seviyesini göster
                const currentVolume = queue.node.volume;
                const volumeBar = createVolumeBar(currentVolume);
                
                const currentVolumeEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('🔊 Mevcut Ses Seviyesi')
                    .setDescription(`Ses seviyesi: **${currentVolume}%**`)
                    .addFields({
                        name: '📊 Ses Çubuğu',
                        value: volumeBar,
                        inline: false
                    })
                    .addFields(
                        { name: '🔇 Kısık', value: '1-30%', inline: true },
                        { name: '🔉 Orta', value: '31-70%', inline: true },
                        { name: '🔊 Yüksek', value: '71-100%', inline: true }
                    )
                    .addFields({
                        name: '💡 Ses Değiştir',
                        value: '`/volume <1-100>` komutunu kullanarak ses seviyesini değiştirebilirsin',
                        inline: false
                    })
                    .setTimestamp();

                return interaction.reply({ embeds: [currentVolumeEmbed] });
            }

            // Ses seviyesini değiştir
            const oldVolume = queue.node.volume;
            queue.node.setVolume(volume);

            const volumeEmoji = getVolumeEmoji(volume);
            const volumeBar = createVolumeBar(volume);
            const volumeCategory = getVolumeCategory(volume);

            const volumeChangedEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${volumeEmoji} Ses Seviyesi Değiştirildi`)
                .setDescription(`Ses seviyesi **${oldVolume}%**'den **${volume}%**'ye ayarlandı!`)
                .addFields({
                    name: '📊 Ses Çubuğu',
                    value: volumeBar,
                    inline: false
                })
                .addFields(
                    { name: '📈 Önceki Seviye', value: `${oldVolume}%`, inline: true },
                    { name: '📊 Yeni Seviye', value: `${volume}%`, inline: true },
                    { name: '🎵 Kategori', value: volumeCategory, inline: true }
                )
                .addFields(
                    { name: '👤 Değiştiren', value: interaction.user.username, inline: true },
                    { name: '🎵 Çalan Şarkı', value: queue.currentTrack ? `${queue.currentTrack.title}` : 'Hiçbiri', inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [volumeChangedEmbed] });
            
        } catch (error) {
            console.error('Volume komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ses Hatası')
                .setDescription('Ses seviyesi ayarlanırken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

// Ses seviyesi çubuğu oluştur
function createVolumeBar(volume, length = 20) {
    const filledLength = Math.round((volume / 100) * length);
    const emptyLength = length - filledLength;
    
    return '▰'.repeat(filledLength) + '▱'.repeat(emptyLength) + ` ${volume}%`;
}

// Ses seviyesi emojisi
function getVolumeEmoji(volume) {
    if (volume === 0) return '🔇';
    if (volume <= 30) return '🔈';
    if (volume <= 70) return '🔉';
    return '🔊';
}

// Ses kategorisi
function getVolumeCategory(volume) {
    if (volume <= 30) return 'Kısık';
    if (volume <= 70) return 'Orta';
    return 'Yüksek';
}

