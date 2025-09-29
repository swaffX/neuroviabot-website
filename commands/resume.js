const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Duraklatılmış şarkıyı devam ettir'),

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
        if (!queue || !queue.currentTrack) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Devam ettirilecek bir şarkı yok!')
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

        // Zaten çalıyor mu kontrol et
        if (!queue.node.isPaused()) {
            const alreadyPlayingEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('▶️ Zaten Çalıyor')
                .setDescription('Müzik zaten çalıyor! Duraklatmak için `/pause` komutunu kullanın.')
                .setTimestamp();
            
            return interaction.reply({ embeds: [alreadyPlayingEmbed], ephemeral: true });
        }

        try {
            // Müziği devam ettir
            queue.node.resume();

            const currentTrack = queue.currentTrack;
            const resumedEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('▶️ Müzik Devam Ediyor')
                .setDescription(`**${currentTrack.title}** devam ediyor!`)
                .setThumbnail(currentTrack.thumbnail)
                .addFields(
                    { name: '🎤 Sanatçı', value: currentTrack.author, inline: true },
                    { name: '👤 Devam Ettiren', value: interaction.user.username, inline: true },
                    { name: '💡 İpucu', value: 'Duraklatmak için `/pause` kullanın', inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [resumedEmbed] });
            
        } catch (error) {
            console.error('Resume komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Devam Ettirme Hatası')
                .setDescription('Müziği devam ettirirken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

