const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Şu anda çalan şarkıyı atla')
        .addIntegerOption(option =>
            option.setName('sayı')
                .setDescription('Atlanacak şarkı sayısı (varsayılan: 1)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        ),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);
        const skipCount = interaction.options.getInteger('sayı') || 1;

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

        // Atlanacak şarkı sayısı queue'dan fazla mı
        if (skipCount > 1 && skipCount > queue.tracks.size + 1) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Sayı')
                .setDescription(`Kuyrukte sadece ${queue.tracks.size + 1} şarkı var! En fazla ${queue.tracks.size + 1} şarkı atlayabilirsiniz.`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            const currentTrack = queue.currentTrack;
            
            if (skipCount === 1) {
                // Tek şarkı atla
                const success = queue.node.skip();
                
                if (!success) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Atlama Hatası')
                        .setDescription('Şarkı atlanırken bir hata oluştu!')
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                const skippedEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('⏭️ Şarkı Atlandı')
                    .setDescription(`**${currentTrack.title}** atlandı!`)
                    .setThumbnail(currentTrack.thumbnail)
                    .addFields(
                        { name: '🎤 Sanatçı', value: currentTrack.author, inline: true },
                        { name: '👤 Atlayan', value: interaction.user.username, inline: true },
                        { name: '📊 Kalan Şarkı', value: queue.tracks.size.toString(), inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [skippedEmbed] });

            } else {
                // Çoklu şarkı atla
                const skippedTracks = [currentTrack];
                
                // Kuyruktaki şarkıları da listeye ekle
                for (let i = 0; i < skipCount - 1; i++) {
                    if (queue.tracks.at(i)) {
                        skippedTracks.push(queue.tracks.at(i));
                    }
                }

                // Şarkıları atla
                for (let i = 0; i < skipCount - 1; i++) {
                    if (queue.tracks.size > 0) {
                        queue.node.skipTo(0);
                    }
                }
                
                // Son şarkıyı atla
                queue.node.skip();

                const skippedListEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`⏭️ ${skipCount} Şarkı Atlandı`)
                    .setDescription(`${skipCount} şarkı başarıyla atlandı!`)
                    .addFields(
                        { name: '👤 Atlayan', value: interaction.user.username, inline: true },
                        { name: '📊 Kalan Şarkı', value: queue.tracks.size.toString(), inline: true },
                        { 
                            name: '📋 Atlanan Şarkılar', 
                            value: skippedTracks.slice(0, 5).map((track, index) => 
                                `${index + 1}. **${track.title}** - ${track.author}`
                            ).join('\n') + (skippedTracks.length > 5 ? `\n... ve ${skippedTracks.length - 5} şarkı daha` : ''),
                            inline: false 
                        }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [skippedListEmbed] });
            }
            
        } catch (error) {
            console.error('Skip komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Atlama Hatası')
                .setDescription('Şarkı atlanırken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

