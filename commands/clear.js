const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('🗑️ Müzik kuyruğunu temizle')
        .addBooleanOption(option =>
            option.setName('şu-anda-çalanı-koru')
                .setDescription('Şu anda çalan şarkıyı koruyup sadece kuyruğu temizle (varsayılan: false)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guild);
        const keepCurrentTrack = interaction.options.getBoolean('şu-anda-çalanı-koru') || false;

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
        if (!queue || (queue.tracks.size === 0 && !queue.currentTrack)) {
            const emptyQueueEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📭 Kuyruk Zaten Boş')
                .setDescription('Temizlenecek bir kuyruk yok!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [emptyQueueEmbed], ephemeral: true });
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
            const clearedCount = queue.tracks.size;

            if (keepCurrentTrack) {
                // Sadece kuyruğu temizle, şu anda çalanı koru
                queue.tracks.clear();
                
                const clearedEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('🗑️ Kuyruk Temizlendi')
                    .setDescription(`${clearedCount} şarkı kuyruktan temizlendi!`)
                    .addFields(
                        { name: '🎵 Devam Eden', value: currentTrack ? `**${currentTrack.title}** - ${currentTrack.author}` : 'Hiçbiri', inline: false },
                        { name: '👤 Temizleyen', value: interaction.user.username, inline: true },
                        { name: '📊 Temizlenen Şarkı', value: clearedCount.toString(), inline: true },
                        { name: '💡 İpucu', value: 'Şu anda çalan şarkı korundu ve çalmaya devam ediyor', inline: false }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [clearedEmbed] });
                
            } else {
                // Her şeyi temizle ve müziği durdur
                queue.delete();
                
                const fullyCleared = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('🗑️ Kuyruk Tamamen Temizlendi')
                    .setDescription('Kuyruk tamamen temizlendi ve müzik durduruldu!')
                    .addFields(
                        { name: '🎵 Durdurulan', value: currentTrack ? `**${currentTrack.title}** - ${currentTrack.author}` : 'Hiçbiri', inline: false },
                        { name: '👤 Temizleyen', value: interaction.user.username, inline: true },
                        { name: '📊 Temizlenen Şarkı', value: (clearedCount + (currentTrack ? 1 : 0)).toString(), inline: true },
                        { name: '💡 İpucu', value: 'Yeni şarkı çalmak için `/play` komutunu kullanın', inline: false }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [fullyCleared] });
            }
            
        } catch (error) {
            console.error('Clear komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Temizleme Hatası')
                .setDescription('Kuyruk temizlenirken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

