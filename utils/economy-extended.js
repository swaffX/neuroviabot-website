// Economy komutunun geri kalan metodları
const { EmbedBuilder } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const moment = require('moment');

// Transfer metodu
async function handleTransfer(interaction, guild) {
    const targetUser = interaction.options.getUser('kullanıcı');
    const amount = interaction.options.getInteger('miktar');

    // Kendine transfer kontrolü
    if (targetUser.id === interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Geçersiz Transfer')
            .setDescription('Kendinize para gönderemezsiniz!')
            .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Bot kontrolü
    if (targetUser.bot) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Bot Kullanıcısı')
            .setDescription('Bot kullanıcılarına para gönderemezsiniz!')
            .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const senderMember = await GuildMember.findOne({
        where: { userId: interaction.user.id, guildId: interaction.guild.id }
    });

    if (!senderMember || parseInt(senderMember.balance) < amount) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Yetersiz Bakiye')
            .setDescription('Bu transfer için yeterli bakiyeniz yok!')
            .addFields({
                name: '💵 Mevcut Bakiye',
                value: `${(parseInt(senderMember?.balance) || 0).toLocaleString()} ${guild.currencySymbol}`,
                inline: true
            })
            .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const receiverMember = await GuildMember.findOne({
        where: { userId: targetUser.id, guildId: interaction.guild.id }
    });

    if (!receiverMember) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Kullanıcı Bulunamadı')
            .setDescription('Hedef kullanıcının ekonomi verisi bulunamadı!')
            .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Transfer işlemi
    await senderMember.update({
        balance: parseInt(senderMember.balance) - amount
    });

    await receiverMember.update({
        balance: parseInt(receiverMember.balance) + amount
    });

    const transferEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('💸 Transfer Başarılı')
        .setDescription(`${targetUser} kullanıcısına para gönderildi!`)
        .addFields(
            { name: '💰 Gönderilen', value: `${amount.toLocaleString()} ${guild.currencySymbol}`, inline: true },
            { name: '👤 Alıcı', value: targetUser.username, inline: true },
            { name: '💵 Kalan Bakiye', value: `${(parseInt(senderMember.balance) - amount).toLocaleString()} ${guild.currencySymbol}`, inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [transferEmbed] });
}

// Diğer metodlar buraya eklenecek...

module.exports = {
    handleTransfer
};
