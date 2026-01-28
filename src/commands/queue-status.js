const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const CommandQueueManager = require('../utils/commandQueueManager');
const rateLimitQueue = require('../utils/rateLimitQueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue-status')
        .setDescription('📊 Rate limit queue durumunu göster'),
    
    async execute(interaction) {
        try {
            const commandQueueManager = new CommandQueueManager(interaction.client);
            const queueStatus = commandQueueManager.getQueueStatus();
            const globalStatus = rateLimitQueue.getQueueStatus();
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📊 Rate Limit Queue Durumu')
                .setTimestamp();
            
            // Global queue durumu
            embed.addFields({
                name: '🌐 Global Queue',
                value: `**Kuyruk:** ${globalStatus.queueLength}\n**İstek:** ${globalStatus.requestCount}/${globalStatus.maxRequests}\n**İşleniyor:** ${globalStatus.isProcessing ? 'Evet' : 'Hayır'}\n**Kalan Süre:** ${globalStatus.windowRemaining}ms`,
                inline: true
            });
            
            // Guild queue durumu
            const guildCount = Object.keys(queueStatus.guilds).length;
            const totalGuildQueue = Object.values(queueStatus.guilds).reduce((sum, guild) => sum + guild.queueLength, 0);
            const processingGuilds = Object.values(queueStatus.guilds).filter(guild => guild.isProcessing).length;
            
            embed.addFields({
                name: '🏠 Guild Queues',
                value: `**Sunucu Sayısı:** ${guildCount}\n**Toplam Kuyruk:** ${totalGuildQueue}\n**İşlenen:** ${processingGuilds}`,
                inline: true
            });
            
            // Rate limit bilgisi
            embed.addFields({
                name: '⚡ Rate Limit',
                value: `**Limit:** 50 req/s\n**Kullanılan:** ${globalStatus.requestCount}\n**Kalan:** ${globalStatus.maxRequests - globalStatus.requestCount}`,
                inline: true
            });
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            
        } catch (error) {
            console.error('Queue status error:', error);
            await interaction.reply({
                content: '❌ Queue durumu alınırken hata oluştu.',
                flags: 64
            });
        }
    }
};
