const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Bot gecikme süresini kontrol et'),

    async execute(interaction) {
        const start = Date.now();
        
        // İlk yanıt (API gecikmesi için)
        await interaction.deferReply();
        
        const end = Date.now();
        
        // Gecikme hesaplamaları
        const apiLatency = end - start; // API yanıt süresi
        const botLatency = interaction.client.ws.ping; // WebSocket gecikmesi
        
        // Gecikme kategorileri
        const getLatencyInfo = (ping) => {
            if (ping < 100) return { emoji: '🟢', status: 'Mükemmel', color: '#00ff00' };
            if (ping < 200) return { emoji: '🟡', status: 'İyi', color: '#ffff00' };
            if (ping < 500) return { emoji: '🟠', status: 'Orta', color: '#ff8000' };
            return { emoji: '🔴', status: 'Yavaş', color: '#ff0000' };
        };
        
        const apiInfo = getLatencyInfo(apiLatency);
        const botInfo = getLatencyInfo(botLatency);
        
        // Uptime hesaplama
        const uptime = process.uptime();
        const uptimeString = formatUptime(uptime);
        
        const pingEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🏓 Pong! Bot Durum Raporu')
            .setDescription('Bot performans bilgileri:')
            .addFields(
                {
                    name: `${apiInfo.emoji} API Gecikmesi`,
                    value: `${apiLatency}ms - ${apiInfo.status}`,
                    inline: true
                },
                {
                    name: `${botInfo.emoji} Bot Gecikmesi`,
                    value: `${botLatency}ms - ${botInfo.status}`,
                    inline: true
                },
                {
                    name: '⏱️ Çalışma Süresi',
                    value: uptimeString,
                    inline: true
                }
            )
            .addFields(
                {
                    name: '📊 Sistem Bilgileri',
                    value: `• **Node.js:** ${process.version}\n• **Bellek Kullanımı:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n• **Platform:** ${process.platform}`,
                    inline: false
                }
            )
            .addFields(
                {
                    name: '🔗 Bağlantı Kalitesi',
                    value: generateConnectionBar(botLatency),
                    inline: false
                }
            )
            .setFooter({ 
                text: `Sunucu: ${interaction.guild?.name || 'Bilinmiyor'} | Shard: ${interaction.guild?.shardId || 0}`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [pingEmbed] });
    },
};

// Uptime formatı
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}g`);
    if (hours > 0) parts.push(`${hours}s`);
    if (minutes > 0) parts.push(`${minutes}d`);
    if (secs > 0) parts.push(`${secs}sn`);
    
    return parts.join(' ') || '0sn';
}

// Bağlantı çubuğu
function generateConnectionBar(ping) {
    const maxPing = 500;
    const percentage = Math.min(ping / maxPing, 1);
    const barLength = 20;
    const filledLength = Math.round(barLength * percentage);
    const emptyLength = barLength - filledLength;
    
    let bar = '';
    if (ping < 100) {
        bar = '🟢'.repeat(filledLength) + '⚫'.repeat(emptyLength);
    } else if (ping < 200) {
        bar = '🟡'.repeat(filledLength) + '⚫'.repeat(emptyLength);
    } else if (ping < 500) {
        bar = '🟠'.repeat(filledLength) + '⚫'.repeat(emptyLength);
    } else {
        bar = '🔴'.repeat(filledLength) + '⚫'.repeat(emptyLength);
    }
    
    return bar + ` ${ping}ms`;
}





