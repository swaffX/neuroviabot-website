const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('👋 Botu sesli kanaldan çıkar'),

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

        // Bot sesli kanalda mı kontrol et
        const botChannel = interaction.guild.members.me?.voice?.channel;
        if (!botChannel) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Zaten herhangi bir sesli kanalda değilim!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Bot ve kullanıcı aynı kanalda mı
        if (voiceChannel.id !== botChannel.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Benimle aynı sesli kanalda olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            const channelName = botChannel.name;
            const wasPlaying = queue && (queue.isPlaying() || queue.node.isPaused());
            const currentTrack = queue?.currentTrack;
            const queueSize = queue?.tracks.size || 0;

            // Eğer queue varsa onu sil (bu otomatik olarak kanaldan çıkar)
            if (queue) {
                queue.delete();
            }

            const leftEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('👋 Kanaldan Ayrıldım')
                .setDescription(`**${channelName}** kanalından ayrıldım!`)
                .addFields(
                    { name: '👤 Ayrılma İsteği', value: interaction.user.username, inline: true },
                    { name: '🎵 Müzik Durumu', value: wasPlaying ? 'Çalıyor/Duraklatılmıştı' : 'Çalmıyordu', inline: true },
                    { name: '🗑️ Temizlenen Kuyruk', value: queueSize.toString(), inline: true }
                );

            if (currentTrack) {
                leftEmbed.addFields({
                    name: '🎵 Son Çalan Şarkı',
                    value: `**${currentTrack.title}** - ${currentTrack.author}`,
                    inline: false
                });
            }

            leftEmbed.addFields({
                name: '💡 Tekrar Davet Et',
                value: 'Beni tekrar davet etmek için `/join` komutunu kullanabilirsin!',
                inline: false
            })
            .setTimestamp();

            await interaction.reply({ embeds: [leftEmbed] });
            
        } catch (error) {
            console.error('Leave komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ayrılma Hatası')
                .setDescription('Sesli kanaldan ayrılırken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

