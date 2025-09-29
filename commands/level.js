const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('📊 Seviye sistemi komutları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rank')
                .setDescription('📈 Seviyenizi görüntüleyin')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Seviyesi görüntülenecek kullanıcı (isteğe bağlı)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('🏆 Seviye sıralaması')
                .addIntegerOption(option =>
                    option.setName('sayfa')
                        .setDescription('Görüntülenecek sayfa numarası')
                        .setMinValue(1)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('⚙️ Seviye sistemini ayarla')
                .addBooleanOption(option =>
                    option.setName('durum')
                        .setDescription('Seviye sistemi aktif olsun mu?')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('xp-miktar')
                        .setDescription('Mesaj başına XP miktarı (varsayılan: 15)')
                        .setMinValue(1)
                        .setMaxValue(100)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('cooldown')
                        .setDescription('XP cooldown süresi (saniye, varsayılan: 60)')
                        .setMinValue(5)
                        .setMaxValue(300)
                        .setRequired(false)
                )
                .addChannelOption(option =>
                    option.setName('levelup-kanal')
                        .setDescription('Level up mesajlarının gönderileceği kanal')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-xp')
                .setDescription('➕ Kullanıcıya XP ekle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('XP eklenecek kullanıcı')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Eklenecek XP miktarı')
                        .setMinValue(1)
                        .setMaxValue(10000)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-xp')
                .setDescription('➖ Kullanıcıdan XP çıkar')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('XP çıkarılacak kullanıcı')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('miktar')
                        .setDescription('Çıkarılacak XP miktarı')
                        .setMinValue(1)
                        .setMaxValue(10000)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('🔄 Kullanıcının seviyesini sıfırla')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Seviyesi sıfırlanacak kullanıcı')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Yetki kontrolü (admin komutları için)
        const adminCommands = ['setup', 'add-xp', 'remove-xp', 'reset'];
        if (adminCommands.includes(subcommand) && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz Erişim')
                .setDescription('Bu komutu kullanabilmek için **Sunucuyu Yönet** yetkisine sahip olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'rank':
                    await this.handleRank(interaction);
                    break;
                case 'leaderboard':
                    await this.handleLeaderboard(interaction);
                    break;
                case 'setup':
                    await this.handleSetup(interaction);
                    break;
                case 'add-xp':
                    await this.handleAddXp(interaction);
                    break;
                case 'remove-xp':
                    await this.handleRemoveXp(interaction);
                    break;
                case 'reset':
                    await this.handleReset(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Level komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Seviye Hatası')
                .setDescription('Seviye işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleRank(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarının seviye verisi yoktur!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Seviye sistemi aktif mi kontrol et
        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });
        if (!guild || !guild.levelingEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Seviye Sistemi Kapalı')
                .setDescription('Bu sunucuda seviye sistemi etkin değil!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const guildMember = await GuildMember.findOne({
            where: {
                userId: targetUser.id,
                guildId: interaction.guild.id
            }
        });

        if (!guildMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Bu kullanıcının seviye verisi bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const currentXp = parseInt(guildMember.xp) || 0;
        const currentLevel = parseInt(guildMember.level) || 0;
        const xpForNextLevel = this.getXpForLevel(currentLevel + 1);
        const xpForCurrentLevel = this.getXpForLevel(currentLevel);
        const progressXp = currentXp - xpForCurrentLevel;
        const neededXp = xpForNextLevel - xpForCurrentLevel;
        const progressPercent = Math.floor((progressXp / neededXp) * 100);

        // Sıralamayı hesapla
        const { QueryTypes } = require('sequelize');
        const { sequelize } = require('../database/connection');

        const rankQuery = await sequelize.query(`
            SELECT COUNT(*) + 1 as rank
            FROM guild_members 
            WHERE guildId = ? AND (xp > ? OR (xp = ? AND level > ?))
        `, {
            replacements: [interaction.guild.id, currentXp, currentXp, currentLevel],
            type: QueryTypes.SELECT
        });

        const rank = rankQuery[0]?.rank || 1;

        // Progress bar oluştur
        const progressBar = this.createProgressBar(progressPercent);

        const rankEmbed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle(`📊 ${targetUser.username} - Seviye Bilgileri`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '🏆 Seviye', value: currentLevel.toString(), inline: true },
                { name: '⭐ XP', value: `${currentXp.toLocaleString()}`, inline: true },
                { name: '📈 Sıralama', value: `#${rank}`, inline: true },
                { name: '🎯 Sonraki Seviye', value: `${progressXp.toLocaleString()} / ${neededXp.toLocaleString()} XP`, inline: false },
                { name: '📊 İlerleme', value: `${progressBar} ${progressPercent}%`, inline: false },
                { name: '💬 Mesaj Sayısı', value: (guildMember.messageCount || 0).toString(), inline: true },
                { name: '⏰ Son Aktivite', value: guildMember.lastMessage ? `<t:${Math.floor(new Date(guildMember.lastMessage).getTime() / 1000)}:R>` : 'Bilinmiyor', inline: true }
            )
            .setFooter({
                text: `${interaction.guild.name} • Sonraki seviye için ${(neededXp - progressXp).toLocaleString()} XP gerekli`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [rankEmbed] });
    },

    async handleLeaderboard(interaction) {
        const page = interaction.options.getInteger('sayfa') || 1;
        const itemsPerPage = 10;
        const offset = (page - 1) * itemsPerPage;

        // Seviye sistemi aktif mi kontrol et
        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });
        if (!guild || !guild.levelingEnabled) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Seviye Sistemi Kapalı')
                .setDescription('Bu sunucuda seviye sistemi etkin değil!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const { QueryTypes } = require('sequelize');
        const { sequelize } = require('../database/connection');

        const leaderboard = await sequelize.query(`
            SELECT 
                gm.userId,
                gm.xp,
                gm.level,
                gm.messageCount
            FROM guild_members gm
            WHERE gm.guildId = ? AND gm.xp > 0
            ORDER BY gm.xp DESC, gm.level DESC
            LIMIT ? OFFSET ?
        `, {
            replacements: [interaction.guild.id, itemsPerPage, offset],
            type: QueryTypes.SELECT
        });

        if (leaderboard.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📊 Sıralama Boş')
                .setDescription('Henüz hiç seviye aktivitesi yok!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed] });
        }

        let description = '';
        for (let i = 0; i < leaderboard.length; i++) {
            const user = await interaction.client.users.fetch(leaderboard[i].userId).catch(() => null);
            if (!user) continue;

            const rank = offset + i + 1;
            const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const xp = parseInt(leaderboard[i].xp);
            const level = parseInt(leaderboard[i].level);
            const messages = parseInt(leaderboard[i].messageCount) || 0;

            description += `${emoji} **${user.username}**\n`;
            description += `└ 🏆 Seviye ${level} • ⭐ ${xp.toLocaleString()} XP • 💬 ${messages.toLocaleString()} mesaj\n\n`;
        }

        // Toplam sayfa sayısını hesapla
        const totalCount = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM guild_members
            WHERE guildId = ? AND xp > 0
        `, {
            replacements: [interaction.guild.id],
            type: QueryTypes.SELECT
        });

        const totalPages = Math.ceil(totalCount[0].count / itemsPerPage);

        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🏆 Seviye Sıralaması')
            .setDescription(description)
            .setFooter({
                text: `Sayfa ${page}/${totalPages} • Toplam ${totalCount[0].count} aktif kullanıcı`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [leaderboardEmbed] });
    },

    async handleSetup(interaction) {
        const enabled = interaction.options.getBoolean('durum');
        const xpAmount = interaction.options.getInteger('xp-miktar') || 15;
        const cooldown = interaction.options.getInteger('cooldown') || 60;
        const levelUpChannel = interaction.options.getChannel('levelup-kanal');

        await interaction.deferReply();

        try {
            await Guild.update({
                levelingEnabled: enabled,
                xpPerMessage: xpAmount,
                xpCooldown: cooldown * 1000, // saniyeyi milisaniyeye çevir
                levelUpChannelId: levelUpChannel?.id || null
            }, {
                where: { id: interaction.guild.id }
            });

            const setupEmbed = new EmbedBuilder()
                .setColor(enabled ? '#00ff00' : '#ff0000')
                .setTitle(`${enabled ? '✅' : '❌'} Seviye Sistemi ${enabled ? 'Aktif' : 'Pasif'}`)
                .setDescription(`Seviye sistemi başarıyla ${enabled ? 'aktif edildi' : 'pasif edildi'}!`)
                .addFields(
                    { name: '📊 Durum', value: enabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '⭐ Mesaj Başına XP', value: xpAmount.toString(), inline: true },
                    { name: '⏰ Cooldown', value: `${cooldown} saniye`, inline: true },
                    { name: '📍 Level Up Kanalı', value: levelUpChannel ? `${levelUpChannel}` : 'Mevcut kanal', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [setupEmbed] });

        } catch (error) {
            logger.error('Level setup hatası', error);
        }
    },

    // XP hesaplama fonksiyonları
    getXpForLevel(level) {
        // Exponential growth: level^2 * 100
        return Math.floor(Math.pow(level, 2) * 100);
    },

    getLevelFromXp(xp) {
        return Math.floor(Math.sqrt(xp / 100));
    },

    createProgressBar(percent) {
        const filledBlocks = Math.floor(percent / 10);
        const emptyBlocks = 10 - filledBlocks;
        
        return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
    }
};



