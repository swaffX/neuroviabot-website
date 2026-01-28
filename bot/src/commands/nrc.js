// ==========================================
// 🪙 NRC (NeuroCoin) - Main Command
// ==========================================

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const NRCUser = require('../models/NRCUser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nrc')
        .setDescription('🪙 NeuroCoin (NRC) işlemleri')
        .addSubcommand(subcommand => subcommand.setName('bakiye').setDescription('💳 Bakiyeni gör').addUserOption(o => o.setName('kullanıcı').setDescription('Kullanıcı seç')))
        .addSubcommand(subcommand => subcommand.setName('günlük').setDescription('🎁 Günlük ödülünü al'))
        .addSubcommand(subcommand => subcommand.setName('çalış').setDescription('💼 Çalış ve kazan'))
        .addSubcommand(subcommand => subcommand.setName('profil').setDescription('👤 Profilini gör').addUserOption(o => o.setName('kullanıcı').setDescription('Kullanıcı seç')))
        .addSubcommand(subcommand => subcommand.setName('gönder').setDescription('💸 Para transfer et')
            .addUserOption(o => o.setName('kullanıcı').setDescription('Alıcı').setRequired(true))
            .addIntegerOption(o => o.setName('miktar').setDescription('Miktar').setMinValue(1).setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('yatır').setDescription('🏦 Bankaya yatır')
            .addStringOption(o => o.setName('miktar').setDescription('Miktar veya "all"').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('çek').setDescription('🏧 Bankadan çek')
            .addStringOption(o => o.setName('miktar').setDescription('Miktar veya "all"').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('sıralama').setDescription('🏆 Zenginlik sıralaması')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Harici dosyalara yönlendirme
        if (subcommand === 'günlük') return require('./daily').execute(interaction);
        if (subcommand === 'çalış') return require('./work').execute(interaction);
        if (subcommand === 'profil') return require('./profile').execute(interaction);

        // Kullanıcı verisini al
        let user = await NRCUser.findOne({ odasi: userId, odaId: guildId });
        if (!user) {
            user = await NRCUser.create({ odasi: userId, odaId: guildId, username: interaction.user.username });
        }

        // --- BAKİYE ---
        if (subcommand === 'bakiye') {
            const target = interaction.options.getUser('kullanıcı') || interaction.user;
            if (target.bot) return interaction.reply({ content: 'Botların bakiyesi yoktur.', flags: MessageFlags.Ephemeral });

            const targetData = (target.id === userId) ? user : await NRCUser.findOne({ odasi: target.id, odaId: guildId });

            if (!targetData) return interaction.reply({ content: 'Bu kullanıcının hesabı yok.', flags: MessageFlags.Ephemeral });

            const embed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle(`🪙 ${target.username} Bakiyesi`)
                .addFields(
                    { name: '💵 Cüzdan', value: `${targetData.balance.toLocaleString()} NRC`, inline: true },
                    { name: '🏦 Banka', value: `${targetData.bank.toLocaleString()} NRC`, inline: true },
                    { name: '📊 Toplam', value: `${(targetData.balance + targetData.bank).toLocaleString()} NRC`, inline: true }
                );
            return interaction.reply({ embeds: [embed] });
        }

        // --- TRANSFER ---
        if (subcommand === 'gönder') {
            const targetUser = interaction.options.getUser('kullanıcı');
            const amount = interaction.options.getInteger('miktar');

            if (targetUser.bot || targetUser.id === userId) return interaction.reply({ content: 'Kendine veya botlara gönderemezsin.', flags: MessageFlags.Ephemeral });
            if (user.balance < amount) return interaction.reply({ content: 'Yetersiz bakiye!', flags: MessageFlags.Ephemeral });

            let recipient = await NRCUser.findOne({ odasi: targetUser.id, odaId: guildId });
            if (!recipient) {
                recipient = await NRCUser.create({ odasi: targetUser.id, odaId: guildId, username: targetUser.username });
            }

            user.balance -= amount;
            recipient.balance += amount;

            await user.save();
            await recipient.save();

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('💸 Transfer Başarılı')
                .setDescription(`**${targetUser.username}** kullanıcısına **${amount.toLocaleString()} NRC** gönderdin.\nKalan: ${user.balance.toLocaleString()} NRC`);

            return interaction.reply({ embeds: [embed] });
        }

        // --- YATIR / ÇEK ---
        if (subcommand === 'yatır' || subcommand === 'çek') {
            const input = interaction.options.getString('miktar').toLowerCase();
            let amount = 0;

            if (subcommand === 'yatır') {
                if (['all', 'hepsi'].includes(input)) amount = user.balance;
                else amount = parseInt(input);

                if (isNaN(amount) || amount <= 0) return interaction.reply({ content: 'Geçersiz miktar.', flags: MessageFlags.Ephemeral });
                if (user.balance < amount) return interaction.reply({ content: 'Cüzdanında bu kadar para yok!', flags: MessageFlags.Ephemeral });

                user.balance -= amount;
                user.bank += amount;
                await user.save();

                return interaction.reply({ content: `🏦 Bankaya **${amount.toLocaleString()} NRC** yatırdın. Yeni Banka Bakiyesi: **${user.bank.toLocaleString()} NRC**` });
            }
            else { // Çek
                if (['all', 'hepsi'].includes(input)) amount = user.bank;
                else amount = parseInt(input);

                if (isNaN(amount) || amount <= 0) return interaction.reply({ content: 'Geçersiz miktar.', flags: MessageFlags.Ephemeral });
                if (user.bank < amount) return interaction.reply({ content: 'Bankanda bu kadar para yok!', flags: MessageFlags.Ephemeral });

                user.bank -= amount;
                user.balance += amount;
                await user.save();

                return interaction.reply({ content: `🏧 Bankadan **${amount.toLocaleString()} NRC** çektin. Yeni Cüzdan Bakiyesi: **${user.balance.toLocaleString()} NRC**` });
            }
        }

        // --- SIRALAMA ---
        if (subcommand === 'sıralama') {
            // MongoDB sort
            const topUsers = await NRCUser.find({ odaId: guildId }).sort({ balance: -1 }).limit(10);

            if (topUsers.length === 0) return interaction.reply({ content: 'Henüz veri yok.', flags: MessageFlags.Ephemeral });

            let description = '';
            topUsers.forEach((u, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
                description += `${medal} **${u.username || 'Bilinmeyen'}** - ${u.balance.toLocaleString()} NRC\n`;
            });

            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('🏆 En Zenginler (Cüzdan)')
                .setDescription(description);

            return interaction.reply({ embeds: [embed] });
        }
    }
};
