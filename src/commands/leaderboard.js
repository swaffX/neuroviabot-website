const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('🏆 Liderlik tabloları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('neurocoin')
                .setDescription('💰 NeuroCoin zenginlik sıralaması')
                .addStringOption(option =>
                    option.setName('kapsam')
                        .setDescription('Sıralama kapsamı')
                        .addChoices(
                            { name: '🌍 Global', value: 'global' },
                            { name: '🏠 Bu Sunucu', value: 'server' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('activity')
                .setDescription('📊 Aktivite sıralaması')
                .addStringOption(option =>
                    option.setName('tür')
                        .setDescription('Aktivite türü')
                        .addChoices(
                            { name: '💬 Mesajlar', value: 'messages' },
                            { name: '🎤 Sesli Sohbet', value: 'voice' },
                            { name: '🎮 Oyun Kazanımları', value: 'games' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('trading')
                .setDescription('🛒 Ticaret hacmi sıralaması')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('quests')
                .setDescription('🗺️ Görev tamamlama sıralaması')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('streak')
                .setDescription('🔥 En uzun streak sıralaması')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'neurocoin':
                    await this.handleNeuroCoinLeaderboard(interaction);
                    break;
                case 'activity':
                    await this.handleActivityLeaderboard(interaction);
                    break;
                case 'trading':
                    await this.handleTradingLeaderboard(interaction);
                    break;
                case 'quests':
                    await this.handleQuestsLeaderboard(interaction);
                    break;
                case 'streak':
                    await this.handleStreakLeaderboard(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Leaderboard komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Sıralama Hatası')
                .setDescription('Sıralama işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleNeuroCoinLeaderboard(interaction) {
        const scope = interaction.options.getString('kapsam') || 'global';
        const db = getDatabase();

        let balances = [];

        if (scope === 'server') {
            // Server-specific leaderboard
            const guildMembers = await interaction.guild.members.fetch();
            
            for (const [userId, member] of guildMembers) {
                if (member.user.bot) continue;
                const balance = db.getNeuroCoinBalance(userId);
                balances.push({
                    userId,
                    username: member.user.username,
                    total: balance.total
                });
            }
        } else {
            // Global leaderboard
            for (const [userId, balance] of db.data.neuroCoinBalances) {
                const user = await interaction.client.users.fetch(userId).catch(() => null);
                if (!user || user.bot) continue;
                
                balances.push({
                    userId,
                    username: user.username,
                    total: balance.total
                });
            }
        }

        // Sort by total
        balances.sort((a, b) => b.total - a.total);

        // Top 10
        const top10 = balances.slice(0, 10);

        if (top10.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('🏆 NeuroCoin Sıralaması')
                    .setDescription('Henüz hiç kimse NeuroCoin kazanmamış!')],
                ephemeral: true
            });
        }

        const medals = ['🥇', '🥈', '🥉'];
        let description = '';

        for (let i = 0; i < top10.length; i++) {
            const entry = top10[i];
            const medal = i < 3 ? medals[i] : `**${i + 1}.**`;
            description += `${medal} **${entry.username}** - ${entry.total.toLocaleString()} NRC\n`;
        }

        // User's rank
        const userRank = balances.findIndex(b => b.userId === interaction.user.id) + 1;
        const userBalance = db.getNeuroCoinBalance(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`🏆 NeuroCoin Sıralaması ${scope === 'server' ? '- ' + interaction.guild.name : '- Global'}`)
            .setDescription(description)
            .addFields({
                name: '📍 Sizin Sıralamanız',
                value: userRank > 0 
                    ? `**#${userRank}** - ${userBalance.total.toLocaleString()} NRC`
                    : 'Henüz sıralamada değilsiniz',
                inline: false
            })
            .setFooter({ text: 'The Neural Currency of Discord' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleActivityLeaderboard(interaction) {
        const type = interaction.options.getString('tür');
        const db = getDatabase();

        const guildMembers = await interaction.guild.members.fetch();
        let stats = [];

        for (const [userId, member] of guildMembers) {
            if (member.user.bot) continue;
            
            const userStats = db.data.userStats?.get(userId);
            if (!userStats) continue;

            let value = 0;
            let unit = '';

            switch (type) {
                case 'messages':
                    value = userStats.messages || 0;
                    unit = 'mesaj';
                    break;
                case 'voice':
                    value = Math.floor((userStats.voiceTime || 0) / 3600000); // ms to hours
                    unit = 'saat';
                    break;
                case 'games':
                    value = userStats.gameWins || 0;
                    unit = 'zafer';
                    break;
            }

            stats.push({
                userId,
                username: member.user.username,
                value,
                unit
            });
        }

        // Sort
        stats.sort((a, b) => b.value - a.value);

        // Top 10
        const top10 = stats.slice(0, 10);

        if (top10.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('📊 Aktivite Sıralaması')
                    .setDescription('Henüz veri yok!')],
                ephemeral: true
            });
        }

        const typeNames = {
            messages: '💬 Mesaj',
            voice: '🎤 Sesli Sohbet',
            games: '🎮 Oyun Kazanımları'
        };

        const medals = ['🥇', '🥈', '🥉'];
        let description = '';

        for (let i = 0; i < top10.length; i++) {
            const entry = top10[i];
            const medal = i < 3 ? medals[i] : `**${i + 1}.**`;
            description += `${medal} **${entry.username}** - ${entry.value.toLocaleString()} ${entry.unit}\n`;
        }

        // User's rank
        const userRank = stats.findIndex(s => s.userId === interaction.user.id) + 1;
        const userEntry = stats.find(s => s.userId === interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`📊 ${typeNames[type]} Sıralaması - ${interaction.guild.name}`)
            .setDescription(description)
            .addFields({
                name: '📍 Sizin Sıralamanız',
                value: userRank > 0 && userEntry
                    ? `**#${userRank}** - ${userEntry.value.toLocaleString()} ${userEntry.unit}`
                    : 'Henüz sıralamada değilsiniz',
                inline: false
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleTradingLeaderboard(interaction) {
        const db = getDatabase();
        const guildMembers = await interaction.guild.members.fetch();
        
        let traders = [];

        for (const [userId, member] of guildMembers) {
            if (member.user.bot) continue;
            
            const transactions = db.getUserTransactions(userId, 1000);
            const tradeVolume = transactions
                .filter(tx => tx.type === 'marketplace_purchase' || tx.type === 'marketplace_sale')
                .reduce((sum, tx) => sum + tx.amount, 0);

            if (tradeVolume > 0) {
                traders.push({
                    userId,
                    username: member.user.username,
                    volume: tradeVolume
                });
            }
        }

        // Sort by volume
        traders.sort((a, b) => b.volume - a.volume);

        // Top 10
        const top10 = traders.slice(0, 10);

        if (top10.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('🛒 Ticaret Sıralaması')
                    .setDescription('Henüz hiç ticaret yapılmamış!')],
                ephemeral: true
            });
        }

        const medals = ['🥇', '🥈', '🥉'];
        let description = '';

        for (let i = 0; i < top10.length; i++) {
            const entry = top10[i];
            const medal = i < 3 ? medals[i] : `**${i + 1}.**`;
            description += `${medal} **${entry.username}** - ${entry.volume.toLocaleString()} NRC\n`;
        }

        // User's rank
        const userRank = traders.findIndex(t => t.userId === interaction.user.id) + 1;
        const userEntry = traders.find(t => t.userId === interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`🛒 Ticaret Hacmi Sıralaması - ${interaction.guild.name}`)
            .setDescription(description)
            .addFields({
                name: '📍 Sizin Sıralamanız',
                value: userRank > 0 && userEntry
                    ? `**#${userRank}** - ${userEntry.volume.toLocaleString()} NRC`
                    : 'Henüz ticaret yapmadınız',
                inline: false
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleQuestsLeaderboard(interaction) {
        const db = getDatabase();
        const guildMembers = await interaction.guild.members.fetch();
        
        let questers = [];

        for (const [userId, member] of guildMembers) {
            if (member.user.bot) continue;
            
            const questProgress = db.data.questProgress.get(userId) || {};
            const completedQuests = Object.values(questProgress).filter(q => q.completed).length;

            if (completedQuests > 0) {
                questers.push({
                    userId,
                    username: member.user.username,
                    completed: completedQuests
                });
            }
        }

        // Sort by completed quests
        questers.sort((a, b) => b.completed - a.completed);

        // Top 10
        const top10 = questers.slice(0, 10);

        if (top10.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('🗺️ Görev Sıralaması')
                    .setDescription('Henüz hiç görev tamamlanmamış!')],
                ephemeral: true
            });
        }

        const medals = ['🥇', '🥈', '🥉'];
        let description = '';

        for (let i = 0; i < top10.length; i++) {
            const entry = top10[i];
            const medal = i < 3 ? medals[i] : `**${i + 1}.**`;
            description += `${medal} **${entry.username}** - ${entry.completed} görev\n`;
        }

        // User's rank
        const userRank = questers.findIndex(q => q.userId === interaction.user.id) + 1;
        const userEntry = questers.find(q => q.userId === interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`🗺️ Görev Tamamlama Sıralaması - ${interaction.guild.name}`)
            .setDescription(description)
            .addFields({
                name: '📍 Sizin Sıralamanız',
                value: userRank > 0 && userEntry
                    ? `**#${userRank}** - ${userEntry.completed} görev`
                    : 'Henüz görev tamamlamadınız',
                inline: false
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleStreakLeaderboard(interaction) {
        const db = getDatabase();
        const guildMembers = await interaction.guild.members.fetch();
        
        let streakers = [];

        for (const [userId, member] of guildMembers) {
            if (member.user.bot) continue;
            
            const streakData = db.data.dailyStreaks.get(userId);
            if (streakData && streakData.count > 0) {
                streakers.push({
                    userId,
                    username: member.user.username,
                    streak: streakData.count
                });
            }
        }

        // Sort by streak
        streakers.sort((a, b) => b.streak - a.streak);

        // Top 10
        const top10 = streakers.slice(0, 10);

        if (top10.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('🔥 Streak Sıralaması')
                    .setDescription('Henüz hiç streak yok!')],
                ephemeral: true
            });
        }

        const medals = ['🥇', '🥈', '🥉'];
        let description = '';

        for (let i = 0; i < top10.length; i++) {
            const entry = top10[i];
            const medal = i < 3 ? medals[i] : `**${i + 1}.**`;
            description += `${medal} **${entry.username}** - ${entry.streak} gün 🔥\n`;
        }

        // User's rank
        const userRank = streakers.findIndex(s => s.userId === interaction.user.id) + 1;
        const userEntry = streakers.find(s => s.userId === interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`🔥 En Uzun Streak Sıralaması - ${interaction.guild.name}`)
            .setDescription(description)
            .addFields({
                name: '📍 Sizin Sıralamanız',
                value: userRank > 0 && userEntry
                    ? `**#${userRank}** - ${userEntry.streak} gün 🔥`
                    : 'Henüz streak\'iniz yok',
                inline: false
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

