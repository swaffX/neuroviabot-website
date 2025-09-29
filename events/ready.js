module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
        console.log(`🎵 Discord Player hazır!`);
        console.log(`📊 ${client.guilds.cache.size} sunucuda aktif`);
        console.log(`👥 ${client.users.cache.size} kullanıcıya hizmet veriyor`);
        
        // Bot status'unu ayarla
        const activities = [
            '🎵 Müzik çalıyor | /help',
            '🎧 Kaliteli ses deneyimi',
            '🎤 Spotify desteği aktif',
            '📻 Playlist oluştur'
        ];
        
        let currentActivity = 0;
        
        // İlk activity'i ayarla
        client.user.setActivity(activities[currentActivity], { type: 'LISTENING' });
        
        // Her 30 saniyede bir activity değiştir
        setInterval(() => {
            currentActivity = (currentActivity + 1) % activities.length;
            client.user.setActivity(activities[currentActivity], { type: 'LISTENING' });
        }, 30000);
        
        console.log('🚀 Bot tamamen hazır ve çalışıyor!');
    },
};

