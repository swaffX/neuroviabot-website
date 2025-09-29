const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸️ Şu anda çalan şarkıyı duraklat'),

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
        if (!queue || !queue.isPlaying()) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Şu anda çalan bir şarkı yok!')
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

        // Zaten duraklatılmış mı kontrol et
        if (queue.node.isPaused()) {
            const alreadyPausedEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('⏸️ Zaten Duraklatılmış')
                .setDescription('Müzik zaten duraklatılmış! Devam ettirmek için `/resume` komutunu kullanın.')
                .setTimestamp();
            
            return interaction.reply({ embeds: [alreadyPausedEmbed], ephemeral: true });
        }

        try {
            // Müziği duraklat
            queue.node.pause();

            const currentTrack = queue.currentTrack;
            const pausedEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('⏸️ Müzik Duraklatıldı')
                .setDescription(`**${currentTrack.title}** duraklatıldı!`)
                .setThumbnail(currentTrack.thumbnail)
                .addFields(
                    { name: '🎤 Sanatçı', value: currentTrack.author, inline: true },
                    { name: '👤 Duraklatan', value: interaction.user.username, inline: true },
                    { name: '💡 İpucu', value: 'Devam ettirmek için `/resume` kullanın', inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [pausedEmbed] });
            
        } catch (error) {
            console.error('Pause komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Duraklatma Hatası')
                .setDescription('Müziği duraklatırken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

