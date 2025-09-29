const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('🔄 Şarkıyı kuyruktaki farklı bir pozisyona taşı')
        .addIntegerOption(option =>
            option.setName('eski-pozisyon')
                .setDescription('Taşınacak şarkının mevcut pozisyonu')
                .setMinValue(1)
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('yeni-pozisyon')
                .setDescription('Şarkının taşınacağı yeni pozisyon')
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);
        const oldPosition = interaction.options.getInteger('eski-pozisyon');
        const newPosition = interaction.options.getInteger('yeni-pozisyon');

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
            const emptyQueueEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📭 Kuyruk Boş')
                .setDescription('Taşınacak şarkı yok!')
                .addFields({
                    name: '🎵 Şarkı Ekle',
                    value: '`/play [şarkı adı]` komutunu kullanarak şarkı ekleyebilirsin!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [emptyQueueEmbed] });
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

        // Pozisyon kontrolü
        const queueSize = queue.tracks.size;
        if (oldPosition > queueSize || newPosition > queueSize) {
            const invalidPositionEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Pozisyon')
                .setDescription(`Kuyrukta sadece ${queueSize} şarkı var! Lütfen 1-${queueSize} arasında pozisyon belirtin.`)
                .addFields(
                    { name: '📊 Mevcut Kuyruk Boyutu', value: queueSize.toString(), inline: true },
                    { name: '📍 Girilen Eski Pozisyon', value: oldPosition.toString(), inline: true },
                    { name: '📍 Girilen Yeni Pozisyon', value: newPosition.toString(), inline: true }
                )
                .setTimestamp();
            
            return interaction.reply({ embeds: [invalidPositionEmbed], ephemeral: true });
        }

        // Aynı pozisyon kontrolü
        if (oldPosition === newPosition) {
            const samePositionEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('❌ Aynı Pozisyon')
                .setDescription('Şarkı zaten belirttiğiniz pozisyonda!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [samePositionEmbed], ephemeral: true });
        }

        // En az 2 şarkı kontrolü
        if (queueSize < 2) {
            const notEnoughEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('❌ Yetersiz Şarkı')
                .setDescription('Taşıma işlemi için en az 2 şarkı gerekli!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [notEnoughEmbed], ephemeral: true });
        }

        try {
            // Şarkıyı al (0-based index)
            const trackToMove = queue.tracks.at(oldPosition - 1);
            
            if (!trackToMove) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Şarkı Bulunamadı')
                    .setDescription('Belirtilen pozisyonda şarkı bulunamadı!')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Şarkıyı kaldır ve yeni pozisyona ekle
            queue.node.remove(oldPosition - 1);
            queue.node.insert(trackToMove, newPosition - 1);

            const direction = newPosition > oldPosition ? '⬇️' : '⬆️';
            const directionText = newPosition > oldPosition ? 'aşağı' : 'yukarı';

            const movedEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`🔄 Şarkı Taşındı ${direction}`)
                .setDescription(`**${trackToMove.title}** ${directionText} taşındı!`)
                .setThumbnail(trackToMove.thumbnail)
                .addFields(
                    { name: '🎤 Sanatçı', value: trackToMove.author, inline: true },
                    { name: '📍 Eski Pozisyon', value: oldPosition.toString(), inline: true },
                    { name: '📍 Yeni Pozisyon', value: newPosition.toString(), inline: true },
                    { name: '👤 Taşıyan', value: interaction.user.username, inline: true },
                    { name: '⏱️ Süre', value: trackToMove.duration, inline: true },
                    { name: '👤 Orijinal İsteyen', value: trackToMove.requestedBy.username, inline: true }
                )
                .addFields({
                    name: '💡 İpucu',
                    value: 'Kuyruğun güncel halini görmek için `/queue` komutunu kullanabilirsin!',
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [movedEmbed] });

            // Kuyruk önizlemesi (isteğe bağlı)
            if (queueSize <= 10) {
                const queuePreview = queue.tracks.toArray().slice(0, 5).map((track, index) => 
                    `${index + 1}. **${track.title}** - ${track.author}`
                ).join('\n');

                const previewEmbed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setTitle('📋 Güncel Kuyruk (İlk 5)')
                    .setDescription(queuePreview + (queueSize > 5 ? `\n... ve ${queueSize - 5} şarkı daha` : ''))
                    .setTimestamp();

                await interaction.followUp({ embeds: [previewEmbed] });
            }
            
        } catch (error) {
            console.error('Move komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Taşıma Hatası')
                .setDescription('Şarkı taşınırken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};



