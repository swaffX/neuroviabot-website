const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { useMainPlayer, QueryType } = require('discord-player');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const { logger } = require('../utils/logger');

// Playlist dosya yolu
const PLAYLISTS_DIR = path.join(__dirname, '..', 'data');
const PLAYLISTS_FILE = path.join(PLAYLISTS_DIR, 'playlists.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('📋 Playlist yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('📝 Yeni playlist oluştur')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Playlist ismi')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('açıklama')
                        .setDescription('Playlist açıklaması (isteğe bağlı)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('➕ Playlist\'e şarkı ekle')
                .addStringOption(option =>
                    option.setName('playlist')
                        .setDescription('Playlist ismi')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('şarkı')
                        .setDescription('Eklenecek şarkı (isim, YouTube/Spotify linki)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('➖ Playlist\'ten şarkı kaldır')
                .addStringOption(option =>
                    option.setName('playlist')
                        .setDescription('Playlist ismi')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addIntegerOption(option =>
                    option.setName('pozisyon')
                        .setDescription('Kaldırılacak şarkının pozisyonu')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('▶️ Playlist\'i çal')
                .addStringOption(option =>
                    option.setName('playlist')
                        .setDescription('Çalınacak playlist ismi')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addBooleanOption(option =>
                    option.setName('karıştır')
                        .setDescription('Playlist\'i karıştırarak çal (varsayılan: false)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Playlist\'leri listele')
                .addStringOption(option =>
                    option.setName('playlist')
                        .setDescription('Detayları görüntülenecek playlist (isteğe bağlı)')
                        .setRequired(false)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('🗑️ Playlist\'i sil')
                .addStringOption(option =>
                    option.setName('playlist')
                        .setDescription('Silinecek playlist ismi')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            switch (subcommand) {
                case 'create':
                    await this.handleCreate(interaction);
                    break;
                case 'add':
                    await this.handleAdd(interaction);
                    break;
                case 'remove':
                    await this.handleRemove(interaction);
                    break;
                case 'play':
                    await this.handlePlay(interaction);
                    break;
                case 'list':
                    await this.handleList(interaction);
                    break;
                case 'delete':
                    await this.handleDelete(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Playlist komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playlist Hatası')
                .setDescription('Playlist işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleCreate(interaction) {
        const name = interaction.options.getString('isim');
        const description = interaction.options.getString('açıklama') || '';
        const userId = interaction.user.id;

        // Playlist ismini temizle
        const cleanName = name.trim().toLowerCase();
        if (cleanName.length < 2 || cleanName.length > 50) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz İsim')
                .setDescription('Playlist ismi 2-50 karakter arasında olmalı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const playlists = this.loadPlaylists();
        const userPlaylists = playlists[userId] || {};

        // Aynı isimde playlist var mı kontrol et
        if (userPlaylists[cleanName]) {
            const existsEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playlist Zaten Mevcut')
                .setDescription(`**${name}** isimli bir playlist zaten var!`)
                .addFields({
                    name: '💡 İpucu',
                    value: 'Farklı bir isim deneyin veya mevcut playlist\'i güncelleyin.',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [existsEmbed], ephemeral: true });
        }

        // Yeni playlist oluştur
        const newPlaylist = {
            name: name,
            description: description,
            tracks: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            totalDuration: 0
        };

        if (!playlists[userId]) playlists[userId] = {};
        playlists[userId][cleanName] = newPlaylist;

        this.savePlaylists(playlists);

        const createdEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📝 Playlist Oluşturuldu')
            .setDescription(`**${name}** playlist\'i başarıyla oluşturuldu!`)
            .addFields(
                { name: '📋 İsim', value: name, inline: true },
                { name: '📝 Açıklama', value: description || 'Açıklama yok', inline: true },
                { name: '🎵 Şarkı Sayısı', value: '0', inline: true },
                { name: '➕ Şarkı Ekle', value: '`/playlist add playlist:' + name + ' şarkı:[şarkı adı]`', inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [createdEmbed] });
        logger.commandUsage('playlist create', interaction.user, interaction.guild, true);
    },

    async handleAdd(interaction) {
        const playlistName = interaction.options.getString('playlist').toLowerCase();
        const songQuery = interaction.options.getString('şarkı');
        const userId = interaction.user.id;

        const playlists = this.loadPlaylists();
        const userPlaylists = playlists[userId] || {};

        if (!userPlaylists[playlistName]) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playlist Bulunamadı')
                .setDescription(`**${playlistName}** isimli playlist bulunamadı!`)
                .addFields({
                    name: '💡 İpucu',
                    value: '`/playlist list` komutu ile playlist\'lerinizi görüntüleyebilirsin.',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const player = useMainPlayer();
            const searchResult = await player.search(songQuery, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            });

            if (!searchResult || !searchResult.tracks.length) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Şarkı Bulunamadı')
                    .setDescription(`**${songQuery}** için hiçbir sonuç bulunamadı!`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [notFoundEmbed] });
            }

            const track = searchResult.tracks[0];
            const playlist = userPlaylists[playlistName];

            // Şarkı zaten playlist'te var mı kontrol et
            const existingTrack = playlist.tracks.find(t => t.url === track.url);
            if (existingTrack) {
                const alreadyExistsEmbed = new EmbedBuilder()
                    .setColor('#ffa500')
                    .setTitle('⚠️ Şarkı Zaten Mevcut')
                    .setDescription(`**${track.title}** zaten **${playlist.name}** playlist\'inde!`)
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [alreadyExistsEmbed] });
            }

            // Playlist boyut limiti kontrolü
            if (playlist.tracks.length >= config.maxPlaylistSize) {
                const limitEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Playlist Dolu')
                    .setDescription(`Playlist maksimum ${config.maxPlaylistSize} şarkı içerebilir!`)
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [limitEmbed] });
            }

            // Şarkıyı playlist'e ekle
            const trackData = {
                title: track.title,
                author: track.author,
                url: track.url,
                duration: track.duration,
                thumbnail: track.thumbnail,
                source: track.source,
                addedAt: Date.now(),
                addedBy: interaction.user.id
            };

            playlist.tracks.push(trackData);
            playlist.updatedAt = Date.now();

            this.savePlaylists(playlists);

            const addedEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('➕ Şarkı Eklendi')
                .setDescription(`**${track.title}** playlist\'e eklendi!`)
                .setThumbnail(track.thumbnail)
                .addFields(
                    { name: '📋 Playlist', value: playlist.name, inline: true },
                    { name: '🎤 Sanatçı', value: track.author, inline: true },
                    { name: '⏱️ Süre', value: track.duration, inline: true },
                    { name: '📊 Toplam Şarkı', value: playlist.tracks.length.toString(), inline: true },
                    { name: '🔗 Kaynak', value: track.source, inline: true },
                    { name: '📍 Pozisyon', value: playlist.tracks.length.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [addedEmbed] });

        } catch (error) {
            logger.error('Playlist add hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ekleme Hatası')
                .setDescription('Şarkı playlist\'e eklenirken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handlePlay(interaction) {
        const playlistName = interaction.options.getString('playlist').toLowerCase();
        const shuffle = interaction.options.getBoolean('karıştır') || false;
        const userId = interaction.user.id;

        // Kullanıcının sesli kanalda olup olmadığını kontrol et
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Playlist çalabilmek için bir sesli kanalda olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const playlists = this.loadPlaylists();
        const userPlaylists = playlists[userId] || {};

        if (!userPlaylists[playlistName]) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playlist Bulunamadı')
                .setDescription(`**${playlistName}** isimli playlist bulunamadı!`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        const playlist = userPlaylists[playlistName];

        if (playlist.tracks.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📭 Playlist Boş')
                .setDescription(`**${playlist.name}** playlist\'i boş!`)
                .addFields({
                    name: '➕ Şarkı Ekle',
                    value: '`/playlist add` komutu ile şarkı ekleyebilirsin.',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [emptyEmbed] });
        }

        await interaction.deferReply();

        try {
            const player = useMainPlayer();
            const queue = player.nodes.create(interaction.guild, {
                metadata: interaction.channel,
                volume: config.defaultVolume,
                leaveOnEmpty: true,
                leaveOnEmptyDelay: config.leaveOnEmptyDelay,
                leaveOnEnd: true,
                leaveOnEndDelay: config.leaveOnEndDelay,
                selfDeaf: true
            });

            if (!queue.connection) {
                await queue.connect(voiceChannel);
            }

            let tracks = [...playlist.tracks];
            if (shuffle) {
                tracks = this.shuffleArray(tracks);
            }

            // Şarkıları kuyruğa ekle
            const searchPromises = tracks.map(async (trackData) => {
                try {
                    const searchResult = await player.search(trackData.url || `${trackData.author} ${trackData.title}`, {
                        requestedBy: interaction.user,
                        searchEngine: QueryType.AUTO
                    });
                    return searchResult.tracks[0] || null;
                } catch {
                    return null;
                }
            });

            const resolvedTracks = (await Promise.all(searchPromises)).filter(track => track !== null);

            if (resolvedTracks.length === 0) {
                const noTracksEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Çalınamadı')
                    .setDescription('Playlist\'teki hiçbir şarkı bulunamadı!')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [noTracksEmbed] });
            }

            queue.addTrack(resolvedTracks);

            const playlistEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('📋 Playlist Çalınıyor')
                .setDescription(`**${playlist.name}** playlist\'i çalınıyor!`)
                .addFields(
                    { name: '🎵 Toplam Şarkı', value: playlist.tracks.length.toString(), inline: true },
                    { name: '✅ Başarılı', value: resolvedTracks.length.toString(), inline: true },
                    { name: '❌ Başarısız', value: (playlist.tracks.length - resolvedTracks.length).toString(), inline: true },
                    { name: '🎲 Karıştır', value: shuffle ? 'Açık' : 'Kapalı', inline: true },
                    { name: '👤 Çalan', value: interaction.user.username, inline: true },
                    { name: '📝 Açıklama', value: playlist.description || 'Açıklama yok', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [playlistEmbed] });

            if (!queue.isPlaying()) {
                await queue.node.play();
            }

        } catch (error) {
            logger.error('Playlist play hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Çalma Hatası')
                .setDescription('Playlist çalınırken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleList(interaction) {
        const specificPlaylist = interaction.options.getString('playlist');
        const userId = interaction.user.id;

        const playlists = this.loadPlaylists();
        const userPlaylists = playlists[userId] || {};

        if (Object.keys(userPlaylists).length === 0) {
            const noPlaylistsEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📭 Playlist Yok')
                .setDescription('Henüz hiç playlist oluşturmamışsın!')
                .addFields({
                    name: '📝 Playlist Oluştur',
                    value: '`/playlist create isim:[playlist adı]` komutu ile yeni playlist oluşturabilirsin.',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [noPlaylistsEmbed] });
        }

        if (specificPlaylist) {
            // Belirli bir playlist'in detayları
            const playlist = userPlaylists[specificPlaylist.toLowerCase()];
            if (!playlist) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Playlist Bulunamadı')
                    .setDescription(`**${specificPlaylist}** isimli playlist bulunamadı!`)
                    .setTimestamp();
                
                return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
            }

            const detailEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`📋 ${playlist.name}`)
                .setDescription(playlist.description || 'Açıklama yok')
                .addFields(
                    { name: '🎵 Şarkı Sayısı', value: playlist.tracks.length.toString(), inline: true },
                    { name: '📅 Oluşturulma', value: new Date(playlist.createdAt).toLocaleDateString('tr-TR'), inline: true },
                    { name: '🔄 Son Güncelleme', value: new Date(playlist.updatedAt).toLocaleDateString('tr-TR'), inline: true }
                );

            if (playlist.tracks.length > 0) {
                const trackList = playlist.tracks.slice(0, 10).map((track, index) => 
                    `${index + 1}. **${track.title}** - ${track.author} (${track.duration})`
                ).join('\n');

                detailEmbed.addFields({
                    name: '🎵 Şarkılar (İlk 10)',
                    value: trackList + (playlist.tracks.length > 10 ? `\n... ve ${playlist.tracks.length - 10} şarkı daha` : ''),
                    inline: false
                });
            }

            detailEmbed.setTimestamp();
            return interaction.reply({ embeds: [detailEmbed] });
        }

        // Tüm playlist'leri listele
        const playlistList = Object.entries(userPlaylists).map(([key, playlist]) => 
            `**${playlist.name}** - ${playlist.tracks.length} şarkı`
        ).join('\n');

        const listEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📋 Playlist\'leriniz')
            .setDescription(playlistList)
            .addFields({
                name: '💡 Detaylı Görüntüleme',
                value: '`/playlist list playlist:[playlist adı]` komutu ile detayları görebilirsin.',
                inline: false
            })
            .setFooter({
                text: `Toplam ${Object.keys(userPlaylists).length} playlist`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [listEmbed] });
    },

    async handleRemove(interaction) {
        const playlistName = interaction.options.getString('playlist').toLowerCase();
        const position = interaction.options.getInteger('pozisyon');
        const userId = interaction.user.id;

        const playlists = this.loadPlaylists();
        const userPlaylists = playlists[userId] || {};

        if (!userPlaylists[playlistName]) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playlist Bulunamadı')
                .setDescription(`**${playlistName}** isimli playlist bulunamadı!`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        const playlist = userPlaylists[playlistName];

        if (playlist.tracks.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📭 Playlist Boş')
                .setDescription(`**${playlist.name}** playlist\'i zaten boş!`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
        }

        if (position > playlist.tracks.length || position < 1) {
            const invalidEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Pozisyon')
                .setDescription(`Lütfen 1-${playlist.tracks.length} arasında bir pozisyon girin!`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [invalidEmbed], ephemeral: true });
        }

        const removedTrack = playlist.tracks[position - 1];
        playlist.tracks.splice(position - 1, 1);
        playlist.updatedAt = Date.now();

        this.savePlaylists(playlists);

        const removedEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('➖ Şarkı Kaldırıldı')
            .setDescription(`**${removedTrack.title}** playlist\'ten kaldırıldı!`)
            .setThumbnail(removedTrack.thumbnail)
            .addFields(
                { name: '📋 Playlist', value: playlist.name, inline: true },
                { name: '🎤 Sanatçı', value: removedTrack.author, inline: true },
                { name: '📍 Önceki Pozisyon', value: position.toString(), inline: true },
                { name: '📊 Kalan Şarkı', value: playlist.tracks.length.toString(), inline: true },
                { name: '⏱️ Süre', value: removedTrack.duration, inline: true },
                { name: '👤 Kaldıran', value: interaction.user.username, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [removedEmbed] });
    },

    async handleDelete(interaction) {
        const playlistName = interaction.options.getString('playlist').toLowerCase();
        const userId = interaction.user.id;

        const playlists = this.loadPlaylists();
        const userPlaylists = playlists[userId] || {};

        if (!userPlaylists[playlistName]) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playlist Bulunamadı')
                .setDescription(`**${playlistName}** isimli playlist bulunamadı!`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        const playlist = userPlaylists[playlistName];
        
        // Onay mesajı
        const confirmEmbed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('⚠️ Playlist Silme Onayı')
            .setDescription(`**${playlist.name}** playlist\'ini gerçekten silmek istiyor musunuz?`)
            .addFields(
                { name: '📋 Playlist', value: playlist.name, inline: true },
                { name: '🎵 Şarkı Sayısı', value: playlist.tracks.length.toString(), inline: true },
                { name: '📅 Oluşturulma', value: new Date(playlist.createdAt).toLocaleDateString('tr-TR'), inline: true },
                { name: '⚠️ Uyarı', value: 'Bu işlem geri alınamaz!', inline: false }
            )
            .setTimestamp();

        const confirmButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_playlist_${playlistName}_${userId}`)
                    .setLabel('✅ Evet, Sil')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`cancel_delete_${userId}`)
                    .setLabel('❌ İptal')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ 
            embeds: [confirmEmbed], 
            components: [confirmButtons],
            ephemeral: true 
        });

        // Button collector
        const filter = (buttonInteraction) => {
            return buttonInteraction.user.id === userId && 
                   (buttonInteraction.customId.startsWith('delete_playlist_') || 
                    buttonInteraction.customId.startsWith('cancel_delete_'));
        };

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 30000,
            max: 1
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.customId.startsWith('delete_playlist_')) {
                // Playlist'i sil
                delete userPlaylists[playlistName];
                this.savePlaylists(playlists);

                const deletedEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🗑️ Playlist Silindi')
                    .setDescription(`**${playlist.name}** playlist\'i başarıyla silindi!`)
                    .addFields(
                        { name: '📊 Silinen Şarkı', value: playlist.tracks.length.toString(), inline: true },
                        { name: '👤 Silen', value: interaction.user.username, inline: true },
                        { name: '📅 Silinme Tarihi', value: new Date().toLocaleDateString('tr-TR'), inline: true }
                    )
                    .setTimestamp();

                await buttonInteraction.update({ 
                    embeds: [deletedEmbed], 
                    components: [] 
                });

            } else {
                // İptal
                const cancelledEmbed = new EmbedBuilder()
                    .setColor('#ffa500')
                    .setTitle('❌ Silme İptal Edildi')
                    .setDescription(`**${playlist.name}** playlist\'i silme işlemi iptal edildi.`)
                    .setTimestamp();

                await buttonInteraction.update({ 
                    embeds: [cancelledEmbed], 
                    components: [] 
                });
            }
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                // Zaman aşımı
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Zaman Aşımı')
                    .setDescription('Silme işlemi zaman aşımına uğradı.')
                    .setTimestamp();

                interaction.editReply({ 
                    embeds: [timeoutEmbed], 
                    components: [] 
                }).catch(() => {});
            }
        });
    },

    // Yardımcı metodlar
    loadPlaylists() {
        try {
            if (!fs.existsSync(PLAYLISTS_DIR)) {
                fs.mkdirSync(PLAYLISTS_DIR, { recursive: true });
            }
            
            if (!fs.existsSync(PLAYLISTS_FILE)) {
                return {};
            }
            
            const data = fs.readFileSync(PLAYLISTS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Playlist yükleme hatası', error);
            return {};
        }
    },

    savePlaylists(playlists) {
        try {
            if (!fs.existsSync(PLAYLISTS_DIR)) {
                fs.mkdirSync(PLAYLISTS_DIR, { recursive: true });
            }
            
            fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
        } catch (error) {
            logger.error('Playlist kaydetme hatası', error);
        }
    },

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // Autocomplete handler
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const userId = interaction.user.id;
        
        const playlists = this.loadPlaylists();
        const userPlaylists = playlists[userId] || {};
        
        const choices = Object.values(userPlaylists)
            .filter(playlist => playlist.name.toLowerCase().includes(focusedValue.toLowerCase()))
            .slice(0, 25)
            .map(playlist => ({
                name: `${playlist.name} (${playlist.tracks.length} şarkı)`,
                value: playlist.name.toLowerCase()
            }));

        await interaction.respond(choices);
    }
};
