// ==========================================
// 🎯 Quest Command
// ==========================================
// Daily and weekly quest system

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { getQuestHandler } = require('../handlers/questHandler');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('🎯 Görev sistemi - Günlük ve haftalık görevler')
        .addSubcommand(subcommand =>
            subcommand
                .setName('liste')
                .setDescription('📜 Aktif görevlerini görüntüle')
                .addStringOption(option =>
                    option.setName('tür')
                        .setDescription('Görev türü filtresi')
                        .setRequired(false)
                        .addChoices(
                            { name: '📅 Günlük', value: 'daily' },
                            { name: '📆 Haftalık', value: 'weekly' },
                            { name: '🌐 Tümü', value: 'all' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('durum')
                .setDescription('📊 Görev ilerlemenizi kontrol edin')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Durumu görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ödül-al')
                .setDescription('🎁 Tamamlanan görev ödülünü al')
                .addStringOption(option =>
                    option.setName('görev-id')
                        .setDescription('Görev ID (liste komutunda görünür)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('geçmiş')
                .setDescription('✅ Tamamlanan görevleri görüntüle')
        ),

    category: 'economy',

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if economy is enabled
        const db = getDatabase();
        const settings = db.getGuildSettings(interaction.guild.id);
        const economyEnabled = settings.features?.economy || settings.economy?.enabled;
        
        if (!economyEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle('❌ Görev Sistemi Kapalı')
                .setDescription('Bu sunucuda ekonomi sistemi etkin değil!')
                .setFooter({ text: 'Ekonomi sistemini açmak için web dashboard\'u kullanın' })
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'liste':
                    await this.handleList(interaction);
                    break;
                case 'durum':
                    await this.handleStatus(interaction);
                    break;
                case 'ödül-al':
                    await this.handleClaim(interaction);
                    break;
                case 'geçmiş':
                    await this.handleHistory(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Quest komut hatası', error, { 
                subcommand, 
                user: interaction.user.id 
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle('❌ Hata')
                .setDescription('İşlem sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Show quest list
    async handleList(interaction) {
        const questHandler = getQuestHandler();
        const type = interaction.options.getString('tür') || 'all';

        const embed = questHandler.createQuestListEmbed(
            interaction.user.id,
            interaction.user.username,
            type
        );

        await interaction.reply({ embeds: [embed] });
    },

    // Show quest status/progress
    async handleStatus(interaction) {
        const questHandler = getQuestHandler();
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle('❌ Hata')
                .setDescription('Bot kullanıcılarının görevleri yoktur!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const userProgress = questHandler.getUserProgress(targetUser.id);

        const embed = new EmbedBuilder()
            .setColor('#F39C12')
            .setTitle(`🎯 ${targetUser.username} - Görev Durumu`)
            .setTimestamp();

        const totalQuests = userProgress.activeQuests.length;
        const completedQuests = userProgress.activeQuests.filter(q => q.completed).length;
        const claimableQuests = userProgress.activeQuests.filter(q => q.completed && !q.claimed).length;

        embed.addFields(
            { name: '📊 Aktif Görevler', value: `**${totalQuests}**`, inline: true },
            { name: '✅ Tamamlanan', value: `**${completedQuests}**`, inline: true },
            { name: '🎁 Ödül Alınabilir', value: `**${claimableQuests}**`, inline: true }
        );

        if (userProgress.dailyStreak > 0 || userProgress.weeklyStreak > 0) {
            const streakText = [];
            if (userProgress.dailyStreak > 0) {
                streakText.push(`🔥 Günlük: **${userProgress.dailyStreak}** gün`);
            }
            if (userProgress.weeklyStreak > 0) {
                streakText.push(`⭐ Haftalık: **${userProgress.weeklyStreak}** hafta`);
            }

            embed.addFields({
                name: '📈 Streak',
                value: streakText.join('\n'),
                inline: false
            });
        }

        embed.addFields(
            { name: '🏆 Toplam Tamamlanan', value: `**${userProgress.totalCompleted}**`, inline: true }
        );

        embed.setFooter({ text: 'Detaylı liste için: /quest liste' });

        await interaction.reply({ embeds: [embed] });
    },

    // Claim quest reward
    async handleClaim(interaction) {
        const questHandler = getQuestHandler();
        const questId = interaction.options.getString('görev-id');

        try {
            await interaction.deferReply();

            const result = await questHandler.claimReward(interaction.user.id, questId);

            if (!result.success) {
                throw new Error('Ödül alınamadı!');
            }

            const { reward, newBalance } = result;
            const db = getDatabase();
            const template = db.data.questTemplates.get(questId);

            const claimEmbed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🎁 Görev Ödülü Alındı!')
                .setDescription(`${template?.emoji || '🎯'} **${template?.name || questId}**\n\nTebrikler! Görevi tamamladınız.`)
                .addFields(
                    { name: '💰 Kazanılan', value: `+**${reward.toLocaleString()}** NRC`, inline: true },
                    { name: '💵 Yeni Bakiye', value: `**${newBalance.wallet.toLocaleString()}** NRC`, inline: true }
                )
                .setFooter({ text: 'Daha fazla görev için: /quest liste' })
                .setTimestamp();

            await interaction.editReply({ embeds: [claimEmbed] });

            // Broadcast to socket
            const socket = interaction.client.socket;
            if (socket) {
                socket.emit('quest_claimed', {
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    questId,
                    reward,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error('[Quest Claim] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle('❌ Ödül Alma Hatası')
                .setDescription(error.message || 'Ödül alınırken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Show completed quests history
    async handleHistory(interaction) {
        const questHandler = getQuestHandler();
        const userProgress = questHandler.getUserProgress(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor('#F39C12')
            .setTitle('✅ Tamamlanan Görevler')
            .setTimestamp();

        if (userProgress.completedQuests.length === 0) {
            embed.setDescription('❌ Henüz hiç görev tamamlamadınız!');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const recentCompleted = userProgress.completedQuests.slice(-10).reverse();
        const db = getDatabase();

        const historyText = recentCompleted.map(completed => {
            const template = db.data.questTemplates.get(completed.questId);
            const date = new Date(completed.completedAt).toLocaleDateString('tr-TR');
            
            return `${template?.emoji || '🎯'} **${template?.name || completed.questId}**\n└ ${date} • +${completed.reward} NRC`;
        }).join('\n\n');

        embed.setDescription(`**Son ${recentCompleted.length} görev:**\n\n${historyText}`);

        embed.addFields({
            name: '📊 Toplam',
            value: `**${userProgress.totalCompleted}** görev tamamlandı`,
            inline: false
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
