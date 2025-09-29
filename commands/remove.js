const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('🗑️ Belirli pozisyondaki şarkıyı kuyruktan kaldır')
        .addIntegerOption(option =>
            option.setName('pozisyon')
                .setDescription('Kaldırılacak şarkının kuyruk pozisyonu')
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);
        const position = interaction.options.getInteger('pozisyon');

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
                .setDescription('Kaldırılacak şarkı yok!')
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
        if (position > queue.tracks.size) {
            const invalidPositionEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Pozisyon')
                .setDescription(`Kuyrukta sadece ${queue.tracks.size} şarkı var! Lütfen 1-${queue.tracks.size} arasında bir pozisyon girin.`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [invalidPositionEmbed], ephemeral: true });
        }

        try {
            // Şarkıyı al (0-based index)
            const trackToRemove = queue.tracks.at(position - 1);
            
            if (!trackToRemove) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Şarkı Bulunamadı')
                    .setDescription('Belirtilen pozisyonda şarkı bulunamadı!')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Şarkıyı kaldır
            queue.node.remove(position - 1);

            const removedEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🗑️ Şarkı Kaldırıldı')
                .setDescription(`**${trackToRemove.title}** kuyruktan kaldırıldı!`)
                .setThumbnail(trackToRemove.thumbnail)
                .addFields(
                    { name: '🎤 Sanatçı', value: trackToRemove.author, inline: true },
                    { name: '📍 Önceki Pozisyon', value: position.toString(), inline: true },
                    { name: '👤 Kaldıran', value: interaction.user.username, inline: true },
                    { name: '⏱️ Süre', value: trackToRemove.duration, inline: true },
                    { name: '📊 Kalan Şarkı', value: queue.tracks.size.toString(), inline: true },
                    { name: '👤 Orijinal İsteyen', value: trackToRemove.requestedBy.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [removedEmbed] });
            
        } catch (error) {
            console.error('Remove komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kaldırma Hatası')
                .setDescription('Şarkı kaldırılırken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};



