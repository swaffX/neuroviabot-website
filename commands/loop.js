const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('🔁 Döngü modunu ayarla')
        .addStringOption(option =>
            option.setName('mod')
                .setDescription('Döngü modu')
                .addChoices(
                    { name: '❌ Kapalı', value: 'off' },
                    { name: '🔂 Şarkı', value: 'track' },
                    { name: '🔁 Kuyruk', value: 'queue' }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            const queue = useQueue(interaction.guild.id);
            const mode = interaction.options.getString('mod');

            if (!queue || !queue.isPlaying()) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Şu anda hiçbir şarkı çalmıyor!')
                    .setTimestamp();

                return interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }

            // Kullanıcının sesli kanalda olup olmadığını kontrol et
            const memberVoiceChannel = interaction.member.voice.channel;
            const botVoiceChannel = interaction.guild.members.me.voice.channel;

            if (!memberVoiceChannel) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Bu komutu kullanmak için sesli bir kanalda olmalısın!')
                    .setTimestamp();

                return interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }

            if (botVoiceChannel && memberVoiceChannel.id !== botVoiceChannel.id) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Benimle aynı sesli kanalda olmalısın!')
                    .setTimestamp();

                return interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }

            let loopMode;
            let loopText;
            let loopEmoji;

            switch (mode) {
                case 'off':
                    loopMode = 0; // QueueRepeatMode.OFF
                    loopText = 'Kapalı';
                    loopEmoji = '❌';
                    break;
                case 'track':
                    loopMode = 1; // QueueRepeatMode.TRACK
                    loopText = 'Şarkı Tekrarı';
                    loopEmoji = '🔂';
                    break;
                case 'queue':
                    loopMode = 2; // QueueRepeatMode.QUEUE
                    loopText = 'Kuyruk Tekrarı';
                    loopEmoji = '🔁';
                    break;
            }

            // Loop modunu ayarla
            queue.setRepeatMode(loopMode);

            const successEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🔁 Döngü Modu Ayarlandı')
                .setDescription(`${loopEmoji} Döngü modu **${loopText}** olarak ayarlandı!`)
                .addFields(
                    { 
                        name: '🎵 Şu Anki Şarkı', 
                        value: `[${queue.currentTrack.title}](${queue.currentTrack.url})`, 
                        inline: true 
                    },
                    { 
                        name: '📊 Kuyruk', 
                        value: `${queue.tracks.size} şarkı`, 
                        inline: true 
                    },
                    { 
                        name: '🔁 Mod', 
                        value: loopText, 
                        inline: true 
                    }
                )
                .setThumbnail(queue.currentTrack.thumbnail)
                .setFooter({ 
                    text: `İsteyen: ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Loop komutu hatası:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Döngü modu ayarlanırken bir hata oluştu!')
                .setFooter({ text: 'Hata devam ederse sunucu yöneticisine başvurun' })
                .setTimestamp();

            const replyMethod = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
            await interaction[replyMethod]({ embeds: [errorEmbed], flags: 64 });
        }
    },
};
