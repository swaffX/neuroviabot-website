const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('🎲 Kuyruğu karıştır veya sıralı hale getir'),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);

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
        if (!queue || queue.tracks.size === 0) {
            const noQueueEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📭 Kuyruk Boş')
                .setDescription('Karıştırılacak şarkı yok! Kuyruğunuzda en az 2 şarkı olmalı.')
                .addFields({
                    name: '🎵 Şarkı Ekle',
                    value: '`/play [şarkı adı]` komutunu kullanarak daha fazla şarkı ekleyebilirsin!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [noQueueEmbed] });
        }

        // Karıştırılacak yeterli şarkı var mı
        if (queue.tracks.size < 2) {
            const notEnoughEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('❌ Yetersiz Şarkı')
                .setDescription('Karıştırma için en az 2 şarkı gerekli!')
                .addFields(
                    { name: '📊 Mevcut Şarkı', value: queue.tracks.size.toString(), inline: true },
                    { name: '📊 Gereken Minimum', value: '2', inline: true },
                    { name: '🎵 Eklenecek', value: (2 - queue.tracks.size).toString(), inline: true }
                )
                .setTimestamp();
            
            return interaction.reply({ embeds: [notEnoughEmbed] });
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
            const wasShuffled = queue.tracks.shuffled;
            const queueSize = queue.tracks.size;

            if (wasShuffled) {
                // Kuyruğu normale döndür (unshuffle - sıralı hale getir)
                queue.tracks.shuffle(false);
                
                const unshuffledEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('📋 Kuyruk Sıralandı')
                    .setDescription('Kuyruk orijinal sırasına döndürüldü!')
                    .addFields(
                        { name: '📊 Sıralanan Şarkı', value: queueSize.toString(), inline: true },
                        { name: '👤 Sıralayan', value: interaction.user.username, inline: true },
                        { name: '🎲 Durum', value: 'Sıralı', inline: true }
                    )
                    .addFields({
                        name: '💡 İpucu',
                        value: 'Şarkılar artık orijinal eklenme sırasında çalacak. Tekrar karıştırmak için `/shuffle` komutunu kullanabilirsin.',
                        inline: false
                    })
                    .setTimestamp();

                await interaction.reply({ embeds: [unshuffledEmbed] });
                
            } else {
                // Kuyruğu karıştır
                queue.tracks.shuffle();
                
                // Karıştırılan şarkıların bir kısmını göster
                const shuffledTracks = queue.tracks.toArray().slice(0, 5);
                const trackList = shuffledTracks.map((track, index) => 
                    `${index + 1}. **${track.title}** - ${track.author}`
                ).join('\n');

                const shuffledEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('🎲 Kuyruk Karıştırıldı')
                    .setDescription('Kuyruk başarıyla karıştırıldı!')
                    .addFields(
                        { name: '📊 Karıştırılan Şarkı', value: queueSize.toString(), inline: true },
                        { name: '👤 Karıştıran', value: interaction.user.username, inline: true },
                        { name: '🎲 Durum', value: 'Karışık', inline: true }
                    )
                    .addFields({
                        name: '🎵 Yeni Sıra (İlk 5)',
                        value: trackList + (queueSize > 5 ? `\n... ve ${queueSize - 5} şarkı daha` : ''),
                        inline: false
                    })
                    .addFields({
                        name: '💡 İpucu',
                        value: 'Şarkılar artık rastgele sırada çalacak. Orijinal sıraya döndürmek için tekrar `/shuffle` komutunu kullanabilirsin.',
                        inline: false
                    })
                    .setTimestamp();

                await interaction.reply({ embeds: [shuffledEmbed] });
            }

            // Şu anda çalan şarkı bilgisi
            if (queue.currentTrack) {
                const currentTrackInfo = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .addFields({
                        name: '🎵 Şu Anda Çalıyor',
                        value: `**${queue.currentTrack.title}** - ${queue.currentTrack.author}\n(Karıştırma şu anda çalan şarkıyı etkilemez)`,
                        inline: false
                    })
                    .setTimestamp();

                await interaction.followUp({ embeds: [currentTrackInfo] });
            }
            
        } catch (error) {
            console.error('Shuffle komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Karıştırma Hatası')
                .setDescription('Kuyruk karıştırılırken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};



