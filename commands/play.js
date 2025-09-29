const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer, QueryType } = require('discord-player');
const config = require('../config.json');
const { spotifyHelper } = require('../utils/spotify');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Şarkı çal veya kuyruğa ekle')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı, YouTube/Spotify linki veya arama terimi')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('başa-ekle')
                .setDescription('Şarkıyı kuyruğun başına ekle (varsayılan: false)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const player = useMainPlayer();
        const query = interaction.options.getString('şarkı');
        const insertFirst = interaction.options.getBoolean('başa-ekle') || false;

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

        // Bot'un o kanala katılma izni var mı kontrol et
        const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has(['Connect', 'Speak'])) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ İzin Hatası')
                .setDescription('Bu sesli kanala katılmak veya konuşmak için gerekli izinlerim yok!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Loading embed
            const loadingEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🔍 Aranıyor...')
                .setDescription(`**${query}** aranıyor, lütfen bekleyin...`)
                .setTimestamp();

            await interaction.editReply({ embeds: [loadingEmbed] });

            let searchResult;
            let spotifyData = null;

            // Spotify URL kontrolü
            if (spotifyHelper.isSpotifyUrl(query)) {
                try {
                    spotifyData = await spotifyHelper.processSpotifyUrl(query);
                    
                    if (spotifyData) {
                        if (spotifyData.tracks) {
                            // Playlist veya album
                            const searchPromises = spotifyData.tracks.slice(0, config.maxPlaylistSize).map(async (track) => {
                                try {
                                    const result = await player.search(track.searchQuery, {
                                        requestedBy: interaction.user,
                                        searchEngine: QueryType.YOUTUBE_SEARCH
                                    });
                                    return result.tracks[0] || null;
                                } catch {
                                    return null;
                                }
                            });

                            const resolvedTracks = (await Promise.all(searchPromises)).filter(track => track !== null);
                            
                            if (resolvedTracks.length > 0) {
                                searchResult = {
                                    tracks: resolvedTracks,
                                    playlist: {
                                        title: spotifyData.name,
                                        description: spotifyData.description || '',
                                        thumbnail: spotifyData.imageUrl,
                                        source: 'spotify'
                                    }
                                };
                            }
                        } else {
                            // Tek şarkı
                            searchResult = await player.search(spotifyData.searchQuery, {
                                requestedBy: interaction.user,
                                searchEngine: QueryType.YOUTUBE_SEARCH
                            });
                        }
                    }
                } catch (error) {
                    logger.error('Spotify işleme hatası', error);
                    // Spotify hatası varsa normal arama yap
                    searchResult = await player.search(query, {
                        requestedBy: interaction.user,
                        searchEngine: QueryType.AUTO
                    });
                }
            }

            // Normal arama (Spotify değilse veya Spotify başarısızsa)
            if (!searchResult) {
                searchResult = await player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                });
            }

            if (!searchResult || !searchResult.tracks.length) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Bulunamadı')
                    .setDescription(`**${query}** için hiçbir sonuç bulunamadı!`)
                    .addFields({
                        name: '💡 Öneriler',
                        value: '• Şarkı adını ve sanatçı adını birlikte yazın\n• YouTube veya Spotify linkini doğrudan yapıştırın\n• Farklı anahtar kelimeler deneyin'
                    })
                    .setTimestamp();

                return interaction.editReply({ embeds: [notFoundEmbed] });
            }

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

            // Bot zaten bağlı değilse bağlan
            if (!queue.connection) {
                await queue.connect(voiceChannel);
            }

            // Şarkıları ekle
            if (searchResult.playlist) {
                // Playlist ise
                queue.addTrack(searchResult.tracks);
                
                const isSpotify = searchResult.playlist.source === 'spotify';
                const playlistEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`📋 ${isSpotify ? 'Spotify ' : ''}Playlist Eklendi`)
                    .setDescription(`**${searchResult.playlist.title}** ${isSpotify ? 'Spotify ' : ''}playlistindeki **${searchResult.tracks.length}** şarkı kuyruğa eklendi!`)
                    .setThumbnail(searchResult.playlist.thumbnail)
                    .addFields(
                        { name: '🎵 Toplam Şarkı', value: searchResult.tracks.length.toString(), inline: true },
                        { name: '👤 Ekleyen', value: interaction.user.username, inline: true },
                        { name: '🔗 Kaynak', value: isSpotify ? 'Spotify → YouTube' : searchResult.playlist.source, inline: true }
                    );

                if (spotifyData && spotifyData.trackCount && spotifyData.trackCount > searchResult.tracks.length) {
                    playlistEmbed.addFields({
                        name: '⚠️ Not',
                        value: `Orijinal playlist ${spotifyData.trackCount} şarkı içeriyor, ${searchResult.tracks.length} şarkı başarıyla eklendi.`,
                        inline: false
                    });
                }

                playlistEmbed.setTimestamp();
                await interaction.editReply({ embeds: [playlistEmbed] });
            } else {
                // Tek şarkı ise
                const track = searchResult.tracks[0];
                
                if (insertFirst && queue.tracks.size > 0) {
                    queue.insertTrack(track, 0);
                } else {
                    queue.addTrack(track);
                }

                const isSpotifyTrack = spotifyData && !spotifyData.tracks;
                const trackEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`🎵 ${isSpotifyTrack ? 'Spotify ' : ''}Şarkı Eklendi`)
                    .setDescription(`**${track.title}** ${insertFirst && queue.tracks.size > 1 ? 'kuyruğun başına' : 'kuyruğa'} eklendi!`)
                    .setThumbnail(track.thumbnail)
                    .addFields(
                        { name: '🎤 Sanatçı', value: track.author, inline: true },
                        { name: '⏱️ Süre', value: track.duration, inline: true },
                        { name: '👤 Ekleyen', value: track.requestedBy.username, inline: true },
                        { name: '📍 Kuyruk Pozisyonu', value: insertFirst && queue.tracks.size > 1 ? '1' : queue.tracks.size.toString(), inline: true },
                        { name: '🔗 Kaynak', value: isSpotifyTrack ? 'Spotify → YouTube' : track.source, inline: true },
                        { name: '👁️ Görüntülenme', value: track.views ? track.views.toLocaleString() : 'Bilinmiyor', inline: true }
                    );

                if (isSpotifyTrack) {
                    trackEmbed.addFields({
                        name: '🎧 Spotify Bilgisi',
                        value: `Spotify'dan alınan **${spotifyData.name}** şarkısı YouTube'da bulundu!`,
                        inline: false
                    });
                }

                trackEmbed.setTimestamp();
                await interaction.editReply({ embeds: [trackEmbed] });
            }

            // Eğer şu anda çalmıyorsa çalmaya başla
            if (!queue.isPlaying()) {
                await queue.node.play();
            }

        } catch (error) {
            console.error('Play komutunda hata:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Çalma Hatası')
                .setDescription('Şarkı çalarken bir hata oluştu!')
                .addFields({
                    name: '🔧 Hata Detayı',
                    value: `\`\`\`${error.message}\`\`\``,
                    inline: false
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
