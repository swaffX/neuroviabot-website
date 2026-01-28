const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('👤 Profil yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('👁️ Profil görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Profili görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bio')
                .setDescription('📝 Bio ayarla (max 100 karakter)')
                .addStringOption(option =>
                    option.setName('metin')
                        .setDescription('Bio metni')
                        .setMaxLength(100)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('🎨 Profil rengi ayarla')
                .addStringOption(option =>
                    option.setName('renk')
                        .setDescription('Hex renk kodu (örn: #8B5CF6)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('badge')
                .setDescription('🏅 Rozet yönetimi')
                .addStringOption(option =>
                    option.setName('işlem')
                        .setDescription('İşlem türü')
                        .addChoices(
                            { name: 'Ekle', value: 'equip' },
                            { name: 'Çıkar', value: 'unequip' },
                            { name: 'Listele', value: 'list' }
                        )
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('rozet')
                        .setDescription('Rozet ID\'si')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'view':
                    await this.handleView(interaction);
                    break;
                case 'bio':
                    await this.handleBio(interaction);
                    break;
                case 'color':
                    await this.handleColor(interaction);
                    break;
                case 'badge':
                    await this.handleBadge(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Profile komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('❌ Profil Hatası')
                .setDescription('Profil işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleView(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Bot Kullanıcısı')
                    .setDescription('Bot kullanıcılarının profili yoktur!')],
                ephemeral: true
            });
        }

        const db = getDatabase();
        const profile = this.getProfile(targetUser.id);
        const balance = db.getNeuroCoinBalance(targetUser.id);
        const level = db.getUserLevel(targetUser.id);
        const transactions = db.getUserTransactions(targetUser.id, 100);
        const streakData = db.data.dailyStreaks.get(targetUser.id) || { count: 0 };

        // Calculate stats
        const totalEarned = transactions
            .filter(tx => tx.to === targetUser.id)
            .reduce((sum, tx) => sum + tx.amount, 0);

        const totalSpent = transactions
            .filter(tx => tx.from === targetUser.id && tx.to !== targetUser.id)
            .reduce((sum, tx) => sum + tx.amount, 0);

        const tradeCount = transactions
            .filter(tx => tx.type === 'marketplace_purchase' || tx.type === 'marketplace_sale')
            .length;

        // Get user's guilds
        const mutualGuilds = interaction.client.guilds.cache.filter(guild => 
            guild.members.cache.has(targetUser.id)
        ).size;

        // Profile color
        const profileColor = profile.color || '#8B5CF6';

        // Build embed
        const embed = new EmbedBuilder()
            .setColor(profileColor)
            .setTitle(`👤 ${targetUser.username}'in Profili`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp();

        // Bio
        if (profile.bio) {
            embed.setDescription(`*"${profile.bio}"*`);
        }

        // Badges
        if (profile.badges && profile.badges.length > 0) {
            embed.addFields({
                name: '🏅 Rozetler',
                value: profile.badges.join(' '),
                inline: false
            });
        }

        // NeuroCoin Stats
        embed.addFields(
            {
                name: '💰 NeuroCoin',
                value: `**${balance.total.toLocaleString()}** NRC\n💵 Cüzdan: ${balance.wallet.toLocaleString()}\n🏦 Banka: ${balance.bank.toLocaleString()}`,
                inline: true
            },
            {
                name: '📊 İstatistikler',
                value: `⭐ Seviye: **${level.level}**\n🔥 Streak: **${streakData.count}** gün\n🛒 Ticaret: **${tradeCount}**`,
                inline: true
            },
            {
                name: '📈 Ekonomi',
                value: `📥 Kazanılan: ${totalEarned.toLocaleString()} NRC\n📤 Harcanan: ${totalSpent.toLocaleString()} NRC\n🏠 Sunucular: ${mutualGuilds}`,
                inline: true
            }
        );

        // Achievements
        const achievements = db.data.achievements.get(targetUser.id) || [];
        if (achievements.length > 0) {
            embed.addFields({
                name: '🏆 Başarılar',
                value: `${achievements.length} başarı kilidi açıldı`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },

    async handleBio(interaction) {
        const bio = interaction.options.getString('metin');
        const db = getDatabase();

        const profile = this.getProfile(interaction.user.id);
        profile.bio = bio;
        this.saveProfile(interaction.user.id, profile);

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('✅ Bio Güncellendi')
            .setDescription(`Yeni bio:\n*"${bio}"*`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleColor(interaction) {
        const color = interaction.options.getString('renk');

        // Validate hex color
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Geçersiz Renk')
                    .setDescription('Lütfen geçerli bir hex renk kodu girin (örn: #8B5CF6)')],
                ephemeral: true
            });
        }

        const profile = this.getProfile(interaction.user.id);
        profile.color = color;
        this.saveProfile(interaction.user.id, profile);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Profil Rengi Güncellendi')
            .setDescription(`Yeni renk: ${color}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleBadge(interaction) {
        const action = interaction.options.getString('işlem');
        const badgeId = interaction.options.getString('rozet');

        const profile = this.getProfile(interaction.user.id);
        const db = getDatabase();
        const userAchievements = db.data.achievements.get(interaction.user.id) || [];

        if (action === 'list') {
            const availableBadges = this.getAvailableBadges(userAchievements);
            
            const embed = new EmbedBuilder()
                .setColor('#8B5CF6')
                .setTitle('🏅 Rozetleriniz')
                .setDescription(availableBadges.length > 0 
                    ? availableBadges.map(b => `${b.emoji} **${b.name}** - ${b.description}`).join('\n')
                    : 'Henüz rozetiniz yok.')
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (!badgeId) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Rozet ID Gerekli')
                    .setDescription('Lütfen bir rozet ID\'si belirtin.')],
                ephemeral: true
            });
        }

        const badge = this.getBadgeById(badgeId);
        if (!badge) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Rozet Bulunamadı')
                    .setDescription('Bu rozet bulunamadı.')],
                ephemeral: true
            });
        }

        // Check if user has this badge
        if (!userAchievements.includes(badgeId)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('❌ Rozet Kilidi')
                    .setDescription('Bu rozete sahip değilsiniz.')],
                ephemeral: true
            });
        }

        if (action === 'equip') {
            if (!profile.badges) profile.badges = [];
            if (profile.badges.includes(badge.emoji)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#8B5CF6')
                        .setTitle('❌ Zaten Takılı')
                        .setDescription('Bu rozet zaten takılı.')],
                    ephemeral: true
                });
            }

            profile.badges.push(badge.emoji);
            this.saveProfile(interaction.user.id, profile);

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('✅ Rozet Takıldı')
                    .setDescription(`${badge.emoji} **${badge.name}** rozetini taktınız!`)]
            });
        }

        if (action === 'unequip') {
            if (!profile.badges || !profile.badges.includes(badge.emoji)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#8B5CF6')
                        .setTitle('❌ Rozet Takılı Değil')
                        .setDescription('Bu rozet zaten takılı değil.')],
                    ephemeral: true
                });
            }

            profile.badges = profile.badges.filter(b => b !== badge.emoji);
            this.saveProfile(interaction.user.id, profile);

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#8B5CF6')
                    .setTitle('✅ Rozet Çıkarıldı')
                    .setDescription(`${badge.emoji} **${badge.name}** rozetini çıkardınız!`)]
            });
        }
    },

    getProfile(userId) {
        const db = getDatabase();
        if (!db.data.userProfiles) {
            db.data.userProfiles = new Map();
        }

        let profile = db.data.userProfiles.get(userId);
        if (!profile) {
            profile = {
                bio: null,
                color: '#8B5CF6',
                badges: [],
                background: 'default',
                createdAt: new Date().toISOString()
            };
            db.data.userProfiles.set(userId, profile);
            db.saveData();
        }

        return profile;
    },

    saveProfile(userId, profile) {
        const db = getDatabase();
        if (!db.data.userProfiles) {
            db.data.userProfiles = new Map();
        }
        db.data.userProfiles.set(userId, profile);
        db.saveData();
    },

    getAvailableBadges(achievements) {
        const allBadges = [
            { id: 'rich', emoji: '🏆', name: 'Zengin', description: '5000 NRC kazan' },
            { id: 'trader', emoji: '🛒', name: 'Tüccar', description: '3 ticaret tamamla' },
            { id: 'legendary', emoji: '⭐', name: 'Efsane', description: '50. seviyeye ulaş' },
            { id: 'collector', emoji: '🛍️', name: 'Koleksiyoncu', description: '10 eşya al' },
            { id: 'loyal', emoji: '🔥', name: 'Sadık', description: '30 günlük streak' }
        ];

        return allBadges.filter(b => achievements.includes(b.id));
    },

    getBadgeById(badgeId) {
        const allBadges = [
            { id: 'rich', emoji: '🏆', name: 'Zengin', description: '5000 NRC kazan' },
            { id: 'trader', emoji: '🛒', name: 'Tüccar', description: '3 ticaret tamamla' },
            { id: 'legendary', emoji: '⭐', name: 'Efsane', description: '50. seviyeye ulaş' },
            { id: 'collector', emoji: '🛍️', name: 'Koleksiyoncu', description: '10 eşya al' },
            { id: 'loyal', emoji: '🔥', name: 'Sadık', description: '30 günlük streak' }
        ];

        return allBadges.find(b => b.id === badgeId);
    }
};

