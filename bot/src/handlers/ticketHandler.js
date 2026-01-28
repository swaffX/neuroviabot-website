const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { Guild, Ticket, User } = require('../models');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class TicketHandler {
    constructor(client) {
        this.client = client;
        this.isEnabled = true; // Handler her zaman aktif
        this.setupEventListeners();
        console.log('[TICKET-HANDLER] Ticket handler başlatıldı');
    }

    // Handler'ı yeniden başlat
    restart() {
        console.log('[TICKET-HANDLER] Handler yeniden başlatıldı');
    }

    setupEventListeners() {
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            // Ticket butonları
            if (interaction.customId.startsWith('ticket_')) {
                await this.handleTicketCreate(interaction);
            }
            // Ticket kapatma butonları
            else if (interaction.customId.startsWith('close_confirm_')) {
                await this.handleTicketCloseConfirm(interaction);
            }
            else if (interaction.customId.startsWith('close_cancel_')) {
                await this.handleTicketCloseCancel(interaction);
            }
            // Ticket kontrol butonları
            else if (interaction.customId.startsWith('ticket_control_')) {
                await this.handleTicketControl(interaction);
            }
        });
    }

    async handleTicketCreate(interaction) {
        try {
            await interaction.deferReply({ flags: 64 });

            // Guild ayarlarını al
            const guild = await Guild.findOne({ where: { id: interaction.guild.id } });
            if (!guild || !guild.ticketEnabled) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Ticket Sistemi Kapalı')
                    .setDescription('Bu sunucuda ticket sistemi etkin değil!')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Kategori türünü belirle
            const ticketType = interaction.customId.split('_')[1];
            const categoryInfo = this.getTicketCategory(ticketType);

            // Kullanıcının açık ticket'i var mı kontrol et
            const existingTicket = await Ticket.findOne({
                where: {
                    userId: interaction.user.id,
                    guildId: interaction.guild.id,
                    status: 'open'
                }
            });

            if (existingTicket && guild.maxTicketsPerUser && guild.maxTicketsPerUser <= 1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Zaten Açık Ticket Var')
                    .setDescription(`Zaten açık bir ticket'iniz var: <#${existingTicket.channelId}>`)
                    .addFields({
                        name: '🎫 Mevcut Ticket',
                        value: `ID: ${existingTicket.ticketId}\nKategori: ${existingTicket.category}`,
                        inline: false
                    })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Ticket ID oluştur
            const ticketId = `ticket-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            
            // Ticket kanalını oluştur
            const category = await interaction.guild.channels.fetch(guild.ticketCategoryId);
            if (!category) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Kategori Bulunamadı')
                    .setDescription('Ticket kategorisi bulunamadı! Lütfen yöneticiye başvurun.')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Kanal oluştur
            const ticketChannel = await interaction.guild.channels.create({
                name: `${categoryInfo.prefix}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles
                        ]
                    },
                    {
                        id: guild.ticketSupportRoleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ]
            });

            // Database'e ticket'i kaydet
            const ticket = await Ticket.create({
                ticketId: ticketId,
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                channelId: ticketChannel.id,
                category: categoryInfo.name,
                status: 'open',
                openedAt: new Date()
            });

            // Ticket mesajı
            const ticketEmbed = new EmbedBuilder()
                .setColor(categoryInfo.color)
                .setTitle(`${categoryInfo.emoji} ${categoryInfo.name} Ticket`)
                .setDescription(`Merhaba ${interaction.user}!\n\n${categoryInfo.description}\n\nDestek ekibimiz en kısa sürede size yardımcı olacak.`)
                .addFields(
                    { name: '🎫 Ticket ID', value: ticketId, inline: true },
                    { name: '📁 Kategori', value: categoryInfo.name, inline: true },
                    { name: '📅 Oluşturulma', value: new Date().toLocaleString('tr-TR'), inline: true },
                    { name: '💡 İpuçları', value: '• Sorununuzu detaylı bir şekilde açıklayın\n• Gerekiyorsa ekran görüntüleri ekleyin\n• Sabırlı olun, en kısa sürede yanıt vereceğiz', inline: false }
                )
                .setTimestamp();

            // Kontrol butonları
            const controlButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_control_close_${ticket.id}`)
                        .setLabel('🔒 Kapat')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`ticket_control_claim_${ticket.id}`)
                        .setLabel('👋 Sahiplen')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`ticket_control_transcript_${ticket.id}`)
                        .setLabel('📄 Transcript')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Ticket kanalına mesajı gönder
            await ticketChannel.send({
                content: `${interaction.user} | <@&${guild.ticketSupportRoleId}>`,
                embeds: [ticketEmbed],
                components: [controlButtons]
            });

            // Kullanıcıya onay mesajı
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Ticket Oluşturuldu')
                .setDescription(`Ticket'iniz başarıyla oluşturuldu!`)
                .addFields(
                    { name: '🎫 Ticket ID', value: ticketId, inline: true },
                    { name: '📁 Kategori', value: categoryInfo.name, inline: true },
                    { name: '📍 Kanal', value: `${ticketChannel}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            // Log kanalına bildir
            if (guild.ticketLogChannelId) {
                const logChannel = await interaction.guild.channels.fetch(guild.ticketLogChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('🎫 Yeni Ticket Oluşturuldu')
                        .addFields(
                            { name: '👤 Kullanıcı', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: '🎫 Ticket ID', value: ticketId, inline: true },
                            { name: '📁 Kategori', value: categoryInfo.name, inline: true },
                            { name: '📍 Kanal', value: `${ticketChannel}`, inline: true },
                            { name: '📅 Oluşturulma', value: new Date().toLocaleString('tr-TR'), inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            logger.error('Ticket oluşturma hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Ticket Hatası')
                .setDescription('Ticket oluşturulurken bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }

    async handleTicketCloseConfirm(interaction) {
        try {
            const ticketId = interaction.customId.split('_')[2];
            const ticket = await Ticket.findByPk(ticketId);

            if (!ticket) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Ticket Bulunamadı')
                    .setDescription('Bu ticket bulunamadı!')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }

            await interaction.deferUpdate();

            // Ticket'i kapat
            await ticket.update({
                status: 'closed',
                closedAt: new Date(),
                closedBy: interaction.user.id,
                closeReason: 'Manuel kapatma'
            });

            // Kapatma mesajı
            const closedEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔒 Ticket Kapatıldı')
                .setDescription('Bu ticket kapatıldı!')
                .addFields(
                    { name: '🎫 Ticket ID', value: ticket.ticketId, inline: true },
                    { name: '👤 Kapatan', value: interaction.user.username, inline: true },
                    { name: '📅 Kapatılma', value: new Date().toLocaleString('tr-TR'), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({
                embeds: [closedEmbed],
                components: []
            });

            // 10 saniye sonra kanalı sil
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    logger.error('Ticket kanal silme hatası', error);
                }
            }, 10000);

        } catch (error) {
            logger.error('Ticket kapatma hatası', error);
        }
    }

    async handleTicketCloseCancel(interaction) {
        const cancelEmbed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('❌ İptal Edildi')
            .setDescription('Ticket kapatma işlemi iptal edildi.')
            .setTimestamp();

        await interaction.update({
            embeds: [cancelEmbed],
            components: []
        });
    }

    async handleTicketControl(interaction) {
        const action = interaction.customId.split('_')[2];
        const ticketId = interaction.customId.split('_')[3];

        try {
            switch (action) {
                case 'close':
                    // Kapatma onayı
                    const confirmButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`close_confirm_${ticketId}`)
                                .setLabel('✅ Kapat')
                                .setStyle(ButtonStyle.Danger),
                            new ButtonBuilder()
                                .setCustomId(`close_cancel_${ticketId}`)
                                .setLabel('❌ İptal')
                                .setStyle(ButtonStyle.Secondary)
                        );

                    const confirmEmbed = new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setTitle('🔒 Ticket Kapatma Onayı')
                        .setDescription('Bu ticket\'i gerçekten kapatmak istiyor musunuz?')
                        .addFields({
                            name: '⚠️ Uyarı',
                            value: 'Bu işlem geri alınamaz ve kanal silinecek!',
                            inline: false
                        })
                        .setTimestamp();

                    await interaction.reply({
                        embeds: [confirmEmbed],
                        components: [confirmButtons],
                        flags: 64
                    });
                    break;

                case 'claim':
                    // Ticket sahiplenme
                    const ticket = await Ticket.findByPk(ticketId);
                    if (!ticket) return;

                    if (ticket.assignedTo) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Zaten Sahiplenilmiş')
                            .setDescription(`Bu ticket zaten <@${ticket.assignedTo}> tarafından sahiplenilmiş!`)
                            .setTimestamp();
                        
                        return interaction.reply({ embeds: [errorEmbed], flags: 64 });
                    }

                    await ticket.update({
                        assignedTo: interaction.user.id,
                        status: 'in_progress'
                    });

                    const claimedEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('👋 Ticket Sahiplenildi')
                        .setDescription(`Bu ticket ${interaction.user} tarafından sahiplenildi!`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [claimedEmbed] });
                    break;

                case 'transcript':
                    // Transcript oluştur
                    await interaction.deferReply({ flags: 64 });

                    const messages = await interaction.channel.messages.fetch({ limit: 100 });
                    const transcript = messages.reverse().map(msg => 
                        `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
                    ).join('\n');

                    const transcriptBuffer = Buffer.from(transcript, 'utf-8');

                    await interaction.editReply({
                        content: '📄 Transcript oluşturuldu!',
                        files: [{
                            attachment: transcriptBuffer,
                            name: `ticket-${ticketId}-transcript.txt`
                        }]
                    });
                    break;
            }
        } catch (error) {
            logger.error('Ticket kontrol hatası', error);
        }
    }

    getTicketCategory(type) {
        const categories = {
            general: {
                name: 'Genel Destek',
                emoji: '🎫',
                description: 'Genel sorularınız ve yardım talepleriniz için bu kategoriyi kullanabilirsiniz.',
                color: '#0099ff',
                prefix: 'general'
            },
            technical: {
                name: 'Teknik Destek',
                emoji: '🔧',
                description: 'Teknik sorunlarınız, hata raporlarınız ve bot ile ilgili problemleriniz için.',
                color: '#ff9900',
                prefix: 'tech'
            },
            complaint: {
                name: 'Şikayet',
                emoji: '⚠️',
                description: 'Şikayetleriniz, önerileriniz ve iyileştirme fikirleriniz için.',
                color: '#ff0000',
                prefix: 'complaint'
            }
        };

        return categories[type] || categories.general;
    }
}

module.exports = TicketHandler;





