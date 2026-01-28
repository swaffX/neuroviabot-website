const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../config.js');

class SpotifyHelper {
    constructor() {
        this.spotifyApi = null;
        this.initialized = false;
        this.tokenExpiryTime = null;
        
        this.init();
    }

    async init() {
        try {
            if (!config.spotify.clientId || !config.spotify.clientSecret) {
                console.log('⚠️  Spotify API anahtarları bulunamadı. Spotify özellikleri devre dışı.');
                return;
            }

            this.spotifyApi = new SpotifyWebApi({
                clientId: config.spotify.clientId,
                clientSecret: config.spotify.clientSecret
            });

            await this.refreshAccessToken();
            this.initialized = true;
            console.log('✅ Spotify API entegrasyonu başarıyla kuruldu!');
        } catch (error) {
            console.error('❌ Spotify API entegrasyonu başarısız:', error.message);
        }
    }

    async refreshAccessToken() {
        try {
            const data = await this.spotifyApi.clientCredentialsGrant();
            this.spotifyApi.setAccessToken(data.body['access_token']);
            this.tokenExpiryTime = Date.now() + (data.body['expires_in'] * 1000);
            console.log('🔑 Spotify access token yenilendi');
        } catch (error) {
            console.error('❌ Spotify token yenileme hatası:', error);
            throw error;
        }
    }

    async ensureValidToken() {
        if (!this.initialized) {
            throw new Error('Spotify API entegrasyonu başlatılmamış');
        }

        // Token süresi dolmuşsa yenile
        if (Date.now() >= this.tokenExpiryTime - 60000) { // 1 dakika önceden yenile
            await this.refreshAccessToken();
        }
    }

    isSpotifyUrl(url) {
        return url.includes('spotify.com/') || url.includes('open.spotify.com/');
    }

    extractSpotifyId(url) {
        const regex = /(?:spotify:|spotify\.com\/|open\.spotify\.com\/)(?:embed\/)?(?:track\/|playlist\/|album\/|artist\/)?([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    getSpotifyType(url) {
        if (url.includes('/track/')) return 'track';
        if (url.includes('/playlist/')) return 'playlist';
        if (url.includes('/album/')) return 'album';
        if (url.includes('/artist/')) return 'artist';
        return null;
    }

    async getTrackInfo(trackId) {
        if (!this.initialized) return null;

        try {
            await this.ensureValidToken();
            const track = await this.spotifyApi.getTrack(trackId);
            
            return {
                name: track.body.name,
                artists: track.body.artists.map(artist => artist.name).join(', '),
                album: track.body.album.name,
                duration: track.body.duration_ms,
                imageUrl: track.body.album.images[0]?.url,
                searchQuery: `${track.body.artists[0].name} ${track.body.name}`,
                spotifyUrl: track.body.external_urls.spotify,
                isrc: track.body.external_ids?.isrc
            };
        } catch (error) {
            console.error('Spotify track bilgisi alınamadı:', error);
            return null;
        }
    }

    async getPlaylistInfo(playlistId) {
        if (!this.initialized) return null;

        try {
            await this.ensureValidToken();
            const playlist = await this.spotifyApi.getPlaylist(playlistId);
            
            const tracks = [];
            let offset = 0;
            const limit = 100;

            // Tüm şarkıları al (sayfalama ile)
            while (true) {
                const playlistTracks = await this.spotifyApi.getPlaylistTracks(playlistId, {
                    offset: offset,
                    limit: limit
                });

                const validTracks = playlistTracks.body.items
                    .filter(item => item.track && item.track.type === 'track')
                    .map(item => ({
                        name: item.track.name,
                        artists: item.track.artists.map(artist => artist.name).join(', '),
                        album: item.track.album.name,
                        duration: item.track.duration_ms,
                        searchQuery: `${item.track.artists[0].name} ${item.track.name}`,
                        spotifyUrl: item.track.external_urls.spotify
                    }));

                tracks.push(...validTracks);

                if (playlistTracks.body.next === null) break;
                offset += limit;

                // Çok büyük playlistleri sınırla
                if (tracks.length >= config.maxPlaylistSize) break;
            }

            return {
                name: playlist.body.name,
                description: playlist.body.description,
                owner: playlist.body.owner.display_name,
                imageUrl: playlist.body.images[0]?.url,
                trackCount: playlist.body.tracks.total,
                tracks: tracks.slice(0, config.maxPlaylistSize),
                spotifyUrl: playlist.body.external_urls.spotify
            };
        } catch (error) {
            console.error('Spotify playlist bilgisi alınamadı:', error);
            return null;
        }
    }

    async getAlbumInfo(albumId) {
        if (!this.initialized) return null;

        try {
            await this.ensureValidToken();
            const album = await this.spotifyApi.getAlbum(albumId);
            
            const tracks = album.body.tracks.items.map(track => ({
                name: track.name,
                artists: track.artists.map(artist => artist.name).join(', '),
                album: album.body.name,
                duration: track.duration_ms,
                searchQuery: `${track.artists[0].name} ${track.name}`,
                spotifyUrl: track.external_urls.spotify
            }));

            return {
                name: album.body.name,
                artists: album.body.artists.map(artist => artist.name).join(', '),
                releaseDate: album.body.release_date,
                imageUrl: album.body.images[0]?.url,
                trackCount: album.body.total_tracks,
                tracks: tracks.slice(0, config.maxPlaylistSize),
                spotifyUrl: album.body.external_urls.spotify
            };
        } catch (error) {
            console.error('Spotify album bilgisi alınamadı:', error);
            return null;
        }
    }

    async searchTrack(query) {
        if (!this.initialized) return null;

        try {
            await this.ensureValidToken();
            const results = await this.spotifyApi.searchTracks(query, { limit: 1 });
            
            if (results.body.tracks.items.length === 0) return null;
            
            const track = results.body.tracks.items[0];
            return {
                name: track.name,
                artists: track.artists.map(artist => artist.name).join(', '),
                album: track.album.name,
                duration: track.duration_ms,
                imageUrl: track.album.images[0]?.url,
                searchQuery: `${track.artists[0].name} ${track.name}`,
                spotifyUrl: track.external_urls.spotify
            };
        } catch (error) {
            console.error('Spotify arama hatası:', error);
            return null;
        }
    }

    formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    async processSpotifyUrl(url) {
        if (!this.isSpotifyUrl(url)) return null;

        const spotifyId = this.extractSpotifyId(url);
        const spotifyType = this.getSpotifyType(url);

        if (!spotifyId || !spotifyType) return null;

        switch (spotifyType) {
            case 'track':
                return await this.getTrackInfo(spotifyId);
            case 'playlist':
                return await this.getPlaylistInfo(spotifyId);
            case 'album':
                return await this.getAlbumInfo(spotifyId);
            default:
                return null;
        }
    }
}

// Singleton instance
const spotifyHelper = new SpotifyHelper();

module.exports = {
    SpotifyHelper,
    spotifyHelper
};





