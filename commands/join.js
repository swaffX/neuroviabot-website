const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('🔗 Botu sesli kanala davet et'),

    async execute(interaction) {
        const player = useMainPlayer();

        // Kullanıcının sesli kanalda olup olmadığını kontrol et
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Beni davet edebilmek için bir sesli kanalda olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Bot'un o kanala katılma izni var mı kontrol et
        const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has(['Connect', 'Speak'])) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ İzin Hatası')
                .setDescription('Bu sesli kanala katılmak veya konuşmak için gerekli izinlerim yok!')
                .addFields({
                    name: '🔒 Gerekli İzinler',
                    value: '• Katıl (Connect)\n• Konuş (Speak)',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Bot zaten bu kanalda mı kontrol et
        const botChannel = interaction.guild.members.me?.voice?.channel;
        if (botChannel && voiceChannel.id === botChannel.id) {
            const alreadyInChannelEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('🔗 Zaten Kanalda')
                .setDescription(`Zaten **${voiceChannel.name}** kanalındayım!`)
                .addFields({
                    name: '🎵 Müzik Çalmaya Başla',
                    value: '`/play` komutunu kullanarak şarkı çalmaya başlayabilirsin!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [alreadyInChannelEmbed], ephemeral: true });
        }

        try {
            await interaction.deferReply();

            // Queue oluştur veya al
            const queue = player.nodes.create(interaction.guild, {
                metadata: interaction.channel,
                volume: config.defaultVolume,
                leaveOnEmpty: true,
                leaveOnEmptyDelay: config.leaveOnEmptyDelay,
                leaveOnEnd: true,
                leaveOnEndDelay: config.leaveOnEndDelay,
                selfDeaf: true
            });

            // Sesli kanala bağlan
            await queue.connect(voiceChannel);

            const joinedEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🔗 Kanala Katıldım')
                .setDescription(`**${voiceChannel.name}** kanalına başarıyla katıldım!`)
                .addFields(
                    { name: '🎵 Şarkı Çalmaya Başla', value: '`/play [şarkı adı]` komutunu kullan', inline: true },
                    { name: '👥 Kanal Üyeleri', value: voiceChannel.members.size.toString(), inline: true },
                    { name: '🔊 Ses Kalitesi', value: `${voiceChannel.bitrate / 1000}kbps`, inline: true },
                    { name: '💡 Faydalı Komutlar', value: '`/help` - Tüm komutları görüntüle\n`/queue` - Kuyruğu görüntüle\n`/nowplaying` - Şu anda çalanı görüntüle', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [joinedEmbed] });
            
        } catch (error) {
            console.error('Join komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Katılma Hatası')
                .setDescription('Sesli kanala katılırken bir hata oluştu!')
                .addFields({
                    name: '🔧 Olası Nedenler',
                    value: '• Kanal dolu olabilir\n• Gerekli izinler eksik olabilir\n• Geçici bir bağlantı sorunu olabilir',
                    inline: false
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};

