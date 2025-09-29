const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { Guild, Ticket } = require('../models');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('🎫 Ticket sistemi yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('📝 Ticket sistemini kur')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Ticket mesajının gönderileceği kanal')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('kategori')
                        .setDescription('Ticket kanallarının oluşturulacağı kategori')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('destek-rolü')
                        .setDescription('Ticket\'lere erişebilecek destek rolü')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('log-kanal')
                        .setDescription('Ticket loglarının gönderileceği kanal (isteğe bağlı)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('🔒 Ticket\'i kapat')
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Kapatma sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('➕ Ticket\'e kullanıcı ekle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Eklenecek kullanıcı')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('➖ Ticket\'ten kullanıcı çıkar')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Çıkarılacak kullanıcı')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('👋 Ticket\'i sahiplen')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unclaim')
                .setDescription('🚫 Ticket sahipliğini bırak')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcript')
                .setDescription('📄 Ticket transkriptini oluştur')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Ticket istatistikleri')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('İstatistikleri görüntülenecek kullanıcı (isteğe bağlı)')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Admin kontrolü (setup hariç diğer komutlar için)
        if (subcommand === 'setup' && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz Erişim')
                .setDescription('Bu komutu kullanabilmek için **Yönetici** yetkisine sahip olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'setup':
                    await this.handleSetup(interaction);
                    break;
                case 'close':
                    await this.handleClose(interaction);
                    break;
                case 'add':
                    await this.handleAdd(interaction);
                    break;
                case 'remove':
                    await this.handleRemove(interaction);
                    break;
                case 'claim':
                    await this.handleClaim(interaction);
                    break;
                case 'unclaim':
                    await this.handleUnclaim(interaction);
                    break;
                case 'transcript':
                    await this.handleTranscript(interaction);
                    break;
                case 'stats':
                    await this.handleStats(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Ticket komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ticket Hatası')
                .setDescription('Ticket işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleSetup(interaction) {
        const channel = interaction.options.getChannel('kanal');
        const category = interaction.options.getChannel('kategori');
        const supportRole = interaction.options.getRole('destek-rolü');
        const logChannel = interaction.options.getChannel('log-kanal');

        await interaction.deferReply();

        try {
            // Guild ayarlarını güncelle
            await Guild.update({
                ticketEnabled: true,
                ticketCategoryId: category.id,
                ticketSupportRoleId: supportRole.id,
                ticketLogChannelId: logChannel?.id || null
            }, {
                where: { id: interaction.guild.id }
            });

            // Ticket mesajı embed'i
            const ticketEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎫 Destek Ticket Sistemi')
                .setDescription('Destek ekibimizden yardım almak için aşağıdaki butonları kullanarak ticket oluşturabilirsiniz.')
                .addFields(
                    { name: '🎫 Genel Destek', value: 'Genel sorular ve yardım talepleriniz için', inline: true },
                    { name: '🔧 Teknik Destek', value: 'Teknik sorunlar ve hata raporları için', inline: true },
                    { name: '⚠️ Şikayet', value: 'Şikayetleriniz ve önerileriniz için', inline: true }
                )
                .setFooter({ 
                    text: 'Ticket oluşturmak için aşağıdaki butonlardan birini seçin',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            // Butonlar
            const ticketButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_general')
                        .setLabel('Genel Destek')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('ticket_technical')
                        .setLabel('Teknik Destek')
                        .setEmoji('🔧')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('ticket_complaint')
                        .setLabel('Şikayet')
                        .setEmoji('⚠️')
                        .setStyle(ButtonStyle.Danger)
                );

            // Mesajı gönder
            const ticketMessage = await channel.send({
                embeds: [ticketEmbed],
                components: [ticketButtons]
            });

            const setupEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Ticket Sistemi Kuruldu')
                .setDescription('Ticket sistemi başarıyla kuruldu!')
                .addFields(
                    { name: '📍 Kanal', value: `${channel}`, inline: true },
                    { name: '📁 Kategori', value: `${category}`, inline: true },
                    { name: '👥 Destek Rolü', value: `${supportRole}`, inline: true },
                    { name: '📋 Log Kanalı', value: logChannel ? `${logChannel}` : 'Ayarlanmadı', inline: true },
                    { name: '🆔 Mesaj ID', value: ticketMessage.id, inline: true },
                    { name: '📊 Durum', value: '✅ Aktif', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [setupEmbed] });

        } catch (error) {
            logger.error('Ticket setup hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kurulum Hatası')
                .setDescription('Ticket sistemi kurulurken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleClose(interaction) {
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        // Ticket kanalında mı kontrol et
        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: 'open'
            }
        });

        if (!ticket) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Kanal')
                .setDescription('Bu komut sadece aktif ticket kanallarında kullanılabilir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Yetki kontrolü
        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });
        const hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
                            interaction.member.roles.cache.has(guild.ticketSupportRoleId) ||
                            ticket.userId === interaction.user.id;

        if (!hasPermission) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz')
                .setDescription('Bu ticket\'i kapatmak için gerekli yetkiniz yok!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Onay butonları
            const confirmButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`close_confirm_${ticket.id}`)
                        .setLabel('✅ Kapat')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`close_cancel_${ticket.id}`)
                        .setLabel('❌ İptal')
                        .setStyle(ButtonStyle.Secondary)
                );

            const confirmEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🔒 Ticket Kapatma Onayı')
                .setDescription(`Bu ticket'i gerçekten kapatmak istiyor musunuz?`)
                .addFields(
                    { name: '🎫 Ticket ID', value: ticket.ticketId, inline: true },
                    { name: '👤 Oluşturan', value: `<@${ticket.userId}>`, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false },
                    { name: '⚠️ Uyarı', value: 'Bu işlem geri alınamaz!', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({
                embeds: [confirmEmbed],
                components: [confirmButtons]
            });

        } catch (error) {
            logger.error('Ticket close hatası', error);
        }
    },

    async handleAdd(interaction) {
        const user = interaction.options.getUser('kullanıcı');

        // Ticket kanalında mı kontrol et
        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: 'open'
            }
        });

        if (!ticket) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Kanal')
                .setDescription('Bu komut sadece aktif ticket kanallarında kullanılabilir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            // Kanalın izinlerini güncelle
            await interaction.channel.permissionOverwrites.create(user, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            // Ticket'e kullanıcıyı ekle
            const participants = ticket.participants || [];
            if (!participants.includes(user.id)) {
                participants.push(user.id);
                await ticket.update({ participants });
            }

            const addedEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('➕ Kullanıcı Eklendi')
                .setDescription(`${user} bu ticket'e eklendi!`)
                .addFields(
                    { name: '🎫 Ticket', value: ticket.ticketId, inline: true },
                    { name: '👤 Ekleyen', value: interaction.user.username, inline: true },
                    { name: '📊 Toplam Katılımcı', value: participants.length.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [addedEmbed] });

        } catch (error) {
            logger.error('Ticket add hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ekleme Hatası')
                .setDescription('Kullanıcı eklenirken bir hata oluştu!')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    async handleRemove(interaction) {
        const user = interaction.options.getUser('kullanıcı');

        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: 'open'
            }
        });

        if (!ticket) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Kanal')
                .setDescription('Bu komut sadece aktif ticket kanallarında kullanılabilir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            // Kanalın izinlerini kaldır
            await interaction.channel.permissionOverwrites.delete(user);

            // Ticket'ten kullanıcıyı çıkar
            const participants = ticket.participants || [];
            const index = participants.indexOf(user.id);
            if (index > -1) {
                participants.splice(index, 1);
                await ticket.update({ participants });
            }

            const removedEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('➖ Kullanıcı Çıkarıldı')
                .setDescription(`${user} bu ticket'ten çıkarıldı!`)
                .addFields(
                    { name: '🎫 Ticket', value: ticket.ticketId, inline: true },
                    { name: '👤 Çıkaran', value: interaction.user.username, inline: true },
                    { name: '📊 Kalan Katılımcı', value: participants.length.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [removedEmbed] });

        } catch (error) {
            logger.error('Ticket remove hatası', error);
        }
    },

    async handleClaim(interaction) {
        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: 'open'
            }
        });

        if (!ticket) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Kanal')
                .setDescription('Bu komut sadece aktif ticket kanallarında kullanılabilir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (ticket.assignedTo) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Zaten Sahiplenilmiş')
                .setDescription(`Bu ticket zaten <@${ticket.assignedTo}> tarafından sahiplenilmiş!`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            await ticket.update({ 
                assignedTo: interaction.user.id,
                status: 'in_progress'
            });

            const claimedEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('👋 Ticket Sahiplenildi')
                .setDescription(`Bu ticket ${interaction.user} tarafından sahiplenildi!`)
                .addFields(
                    { name: '🎫 Ticket', value: ticket.ticketId, inline: true },
                    { name: '👤 Sahiplenen', value: interaction.user.username, inline: true },
                    { name: '📊 Durum', value: 'İşleniyor', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [claimedEmbed] });

        } catch (error) {
            logger.error('Ticket claim hatası', error);
        }
    },

    async handleUnclaim(interaction) {
        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: { $in: ['open', 'in_progress'] }
            }
        });

        if (!ticket) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Kanal')
                .setDescription('Bu komut sadece aktif ticket kanallarında kullanılabilir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (ticket.assignedTo !== interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetki Yok')
                .setDescription('Bu ticket\'i sadece sahiplenen kişi bırakabilir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            await ticket.update({ 
                assignedTo: null,
                status: 'open'
            });

            const unclaimedEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('🚫 Ticket Sahipliği Bırakıldı')
                .setDescription(`${interaction.user} bu ticket\'in sahipliğini bıraktı!`)
                .addFields(
                    { name: '🎫 Ticket', value: ticket.ticketId, inline: true },
                    { name: '📊 Durum', value: 'Açık', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [unclaimedEmbed] });

        } catch (error) {
            logger.error('Ticket unclaim hatası', error);
        }
    },

    async handleTranscript(interaction) {
        const ticket = await Ticket.findOne({
            where: { channelId: interaction.channel.id }
        });

        if (!ticket) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Kanal')
                .setDescription('Bu komut sadece ticket kanallarında kullanılabilir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Mesajları al (basit versiyon)
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages.reverse().map(msg => 
                `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
            ).join('\n');

            // Transcript'i dosya olarak oluştur
            const transcriptBuffer = Buffer.from(transcript, 'utf-8');

            const transcriptEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📄 Ticket Transkripti')
                .setDescription(`${ticket.ticketId} ticket'inin transkripti oluşturuldu!`)
                .addFields(
                    { name: '📊 Mesaj Sayısı', value: messages.size.toString(), inline: true },
                    { name: '👤 İsteyen', value: interaction.user.username, inline: true },
                    { name: '📅 Oluşturulma', value: new Date().toLocaleString(), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({
                embeds: [transcriptEmbed],
                files: [{
                    attachment: transcriptBuffer,
                    name: `ticket-${ticket.ticketId}-transcript.txt`
                }]
            });

        } catch (error) {
            logger.error('Ticket transcript hatası', error);
        }
    },

    async handleStats(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        try {
            // Kullanıcının ticket istatistikleri
            const userTickets = await Ticket.findAll({
                where: {
                    guildId: interaction.guild.id,
                    userId: targetUser.id
                }
            });

            const openTickets = userTickets.filter(t => t.status === 'open').length;
            const closedTickets = userTickets.filter(t => t.status === 'closed').length;
            const totalTickets = userTickets.length;

            // Sunucu geneli istatistikler
            const guildTickets = await Ticket.findAll({
                where: { guildId: interaction.guild.id }
            });

            const guildOpenTickets = guildTickets.filter(t => t.status === 'open').length;
            const guildTotalTickets = guildTickets.length;

            const statsEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Ticket İstatistikleri')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: '👤 Kullanıcı', value: targetUser.username, inline: false },
                    { name: '🎫 Toplam Ticket', value: totalTickets.toString(), inline: true },
                    { name: '🟢 Açık Ticket', value: openTickets.toString(), inline: true },
                    { name: '🔴 Kapalı Ticket', value: closedTickets.toString(), inline: true },
                    { name: '🏢 Sunucu Geneli', value: `Toplam: ${guildTotalTickets}\nAçık: ${guildOpenTickets}`, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [statsEmbed] });

        } catch (error) {
            logger.error('Ticket stats hatası', error);
        }
    }
};
