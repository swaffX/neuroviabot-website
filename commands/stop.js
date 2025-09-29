const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Müziği durdur ve kuyruğu temizle'),

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
        if (!queue || (!queue.isPlaying() && !queue.node.isPaused())) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Şu anda çalan veya duraklatılmış bir şarkı yok!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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
            const currentTrack = queue.currentTrack;
            const queueSize = queue.tracks.size;

            // Müziği durdur ve kuyruğu temizle
            queue.delete();

            const stoppedEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('⏹️ Müzik Durduruldu')
                .setDescription('Müzik durduruldu ve kuyruk temizlendi!')
                .addFields(
                    { name: '🎵 Son Çalan', value: currentTrack ? `**${currentTrack.title}** - ${currentTrack.author}` : 'Bilinmiyor', inline: false },
                    { name: '🗑️ Temizlenen Şarkı', value: queueSize.toString(), inline: true },
                    { name: '👤 Durduran', value: interaction.user.username, inline: true },
                    { name: '💡 İpucu', value: 'Yeni şarkı çalmak için `/play` komutunu kullanın', inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [stoppedEmbed] });
            
        } catch (error) {
            console.error('Stop komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Durdurma Hatası')
                .setDescription('Müziği durdururken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

