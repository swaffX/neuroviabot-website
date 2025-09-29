const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { Guild } = require('../models');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('🎭 Rol yönetim sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('give')
                .setDescription('➕ Kullanıcıya rol ver')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Rol verilecek kullanıcı')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Verilecek rol')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Rol verme sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('➖ Kullanıcıdan rol al')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Rolü alınacak kullanıcı')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Alınacak rol')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sebep')
                        .setDescription('Rol alma sebebi')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('auto-setup')
                .setDescription('🔄 Otomatik rol sistemini kur')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Yeni üyelere otomatik verilecek rol')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('durum')
                        .setDescription('Otomatik rol sistemi aktif olsun mu?')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reaction-setup')
                .setDescription('⚡ Reaction rol sistemi kur')
                .addStringOption(option =>
                    option.setName('başlık')
                        .setDescription('Reaction rol mesajının başlığı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('açıklama')
                        .setDescription('Reaction rol mesajının açıklaması')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reaction-add')
                .setDescription('➕ Reaction rol ekle')
                .addStringOption(option =>
                    option.setName('mesaj-id')
                        .setDescription('Reaction rol mesajının ID\'si')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('Kullanılacak emoji')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Verilecek rol')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('açıklama')
                        .setDescription('Bu rolün açıklaması')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('ℹ️ Kullanıcının rollerini görüntüle')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Rolleri görüntülenecek kullanıcı')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Sunucudaki rolleri listele')
                .addBooleanOption(option =>
                    option.setName('boş-roller')
                        .setDescription('Üyesi olmayan rolleri de göster')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('🎨 Yeni rol oluştur')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Rol adı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('renk')
                        .setDescription('Rol rengi (hex kodu, örn: #ff0000)')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('hoist')
                        .setDescription('Rol ayrı gösterilsin mi?')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('mentionable')
                        .setDescription('Rol mention edilebilir olsun mu?')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('🗑️ Rol sil')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Silinecek rol')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Yetki kontrolü
        const adminCommands = ['give', 'remove', 'auto-setup', 'reaction-setup', 'reaction-add', 'create', 'delete'];
        if (adminCommands.includes(subcommand) && !interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetkisiz Erişim')
                .setDescription('Bu komutu kullanabilmek için **Rolleri Yönet** yetkisine sahip olmanız gerekiyor!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'give':
                    await this.handleGive(interaction);
                    break;
                case 'remove':
                    await this.handleRemove(interaction);
                    break;
                case 'auto-setup':
                    await this.handleAutoSetup(interaction);
                    break;
                case 'reaction-setup':
                    await this.handleReactionSetup(interaction);
                    break;
                case 'reaction-add':
                    await this.handleReactionAdd(interaction);
                    break;
                case 'info':
                    await this.handleInfo(interaction);
                    break;
                case 'list':
                    await this.handleList(interaction);
                    break;
                case 'create':
                    await this.handleCreate(interaction);
                    break;
                case 'delete':
                    await this.handleDelete(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Role komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rol Hatası')
                .setDescription('Rol işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleGive(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const role = interaction.options.getRole('rol');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Kullanıcısı')
                .setDescription('Bot kullanıcılarına rol veremezsiniz!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Bu kullanıcı sunucuda bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Rol yetki kontrolü
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetki Hatası')
                .setDescription('Bu rol benim yetkim dışında!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Yetki Hatası')
                .setDescription('Bu rol sizin yetkinizin üstünde!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (targetMember.roles.cache.has(role.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('⚠️ Rol Zaten Mevcut')
                .setDescription(`${targetUser} kullanıcısında **${role.name}** rolü zaten var!`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            await targetMember.roles.add(role, reason);

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Rol Verildi')
                .setDescription(`${targetUser} kullanıcısına **${role.name}** rolü verildi!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: `${targetUser} (${targetUser.tag})`, inline: true },
                    { name: '🎭 Rol', value: `${role}`, inline: true },
                    { name: '👮 Moderatör', value: interaction.user.username, inline: true },
                    { name: '📝 Sebep', value: reason, inline: false },
                    { name: '📅 Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            logger.error('Rol verme hatası', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rol Verme Hatası')
                .setDescription('Rol verilirken bir hata oluştu!')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleAutoSetup(interaction) {
        const role = interaction.options.getRole('rol');
        const enabled = interaction.options.getBoolean('durum') ?? true;

        await interaction.deferReply();

        try {
            await Guild.update({
                autoRoleEnabled: enabled,
                memberRoleId: enabled ? role.id : null
            }, {
                where: { id: interaction.guild.id }
            });

            const setupEmbed = new EmbedBuilder()
                .setColor(enabled ? '#00ff00' : '#ff0000')
                .setTitle(`🔄 Otomatik Rol Sistemi ${enabled ? 'Aktif' : 'Pasif'}`)
                .setDescription(`Otomatik rol sistemi ${enabled ? 'aktif edildi' : 'pasif edildi'}!`)
                .addFields(
                    { name: '🎭 Rol', value: enabled ? `${role}` : 'Yok', inline: true },
                    { name: '📊 Durum', value: enabled ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '👥 Hedef', value: 'Yeni katılan üyeler', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [setupEmbed] });

        } catch (error) {
            logger.error('Auto role setup hatası', error);
        }
    },

    async handleReactionSetup(interaction) {
        const title = interaction.options.getString('başlık');
        const description = interaction.options.getString('açıklama');

        await interaction.deferReply();

        try {
            const reactionEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(title)
                .setDescription(description + '\n\n📝 *Rolleri almak için aşağıdaki emojilere tıklayın!*')
                .setFooter({
                    text: 'Reaction Rol Sistemi',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            const reactionMessage = await interaction.editReply({ embeds: [reactionEmbed] });

            const setupEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Reaction Rol Sistemi Kuruldu')
                .setDescription('Reaction rol mesajı oluşturuldu!')
                .addFields(
                    { name: '🆔 Mesaj ID', value: reactionMessage.id, inline: true },
                    { name: '📝 Başlık', value: title, inline: true },
                    { name: '💡 Sonraki Adım', value: '`/role reaction-add` komutu ile emoji ve rol ekleyin', inline: false }
                )
                .setTimestamp();

            await interaction.followUp({ embeds: [setupEmbed], ephemeral: true });

        } catch (error) {
            logger.error('Reaction setup hatası', error);
        }
    },

    async handleInfo(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kullanıcı Bulunamadı')
                .setDescription('Bu kullanıcı sunucuda bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const roles = targetMember.roles.cache
            .filter(role => role.id !== interaction.guild.id) // @everyone rolünü filtrele
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());

        const highestRole = targetMember.roles.highest;
        const joinedAt = targetMember.joinedAt;

        const infoEmbed = new EmbedBuilder()
            .setColor(highestRole.hexColor || '#0099ff')
            .setTitle(`🎭 ${targetUser.username} - Rol Bilgileri`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '👤 Kullanıcı', value: `${targetUser} (${targetUser.tag})`, inline: true },
                { name: '🎯 En Yüksek Rol', value: highestRole.toString(), inline: true },
                { name: '📊 Toplam Rol', value: roles.length.toString(), inline: true },
                { name: '📅 Katılma Tarihi', value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:F>`, inline: true },
                { name: '📍 Rol Pozisyonu', value: highestRole.position.toString(), inline: true },
                { name: '🔐 Yönetici', value: targetMember.permissions.has(PermissionFlagsBits.Administrator) ? 'Evet' : 'Hayır', inline: true }
            )
            .setTimestamp();

        if (roles.length > 0) {
            const roleList = roles.length > 10 
                ? roles.slice(0, 10).join(' ') + `\n*... ve ${roles.length - 10} rol daha*`
                : roles.join(' ');
            
            infoEmbed.addFields({
                name: '🎭 Roller',
                value: roleList,
                inline: false
            });
        } else {
            infoEmbed.addFields({
                name: '🎭 Roller',
                value: 'Hiç rol yok',
                inline: false
            });
        }

        await interaction.reply({ embeds: [infoEmbed] });
    },

    async handleList(interaction) {
        const showEmpty = interaction.options.getBoolean('boş-roller') || false;

        const roles = interaction.guild.roles.cache
            .filter(role => role.id !== interaction.guild.id) // @everyone rolünü filtrele
            .sort((a, b) => b.position - a.position);

        const filteredRoles = showEmpty ? roles : roles.filter(role => role.members.size > 0);

        if (filteredRoles.size === 0) {
            const noRolesEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📋 Rol Yok')
                .setDescription('Gösterilecek rol bulunamadı!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [noRolesEmbed] });
        }

        let description = '';
        let count = 0;
        
        for (const role of filteredRoles.values()) {
            if (count >= 20) break; // Maksimum 20 rol göster
            
            const memberCount = role.members.size;
            const permissions = role.permissions.has(PermissionFlagsBits.Administrator) ? '👑' : 
                             role.permissions.has(PermissionFlagsBits.ManageGuild) ? '⚡' : '';
            
            description += `${permissions} **${role.name}** (${memberCount} üye)\n`;
            description += `└ Pozisyon: ${role.position} • Renk: ${role.hexColor || 'Varsayılan'}\n\n`;
            count++;
        }

        const listEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Sunucu Rolleri')
            .setDescription(description)
            .addFields({
                name: '📊 İstatistikler',
                value: `Toplam rol: ${roles.size}\nGösterilen: ${count}`,
                inline: false
            })
            .setFooter({
                text: '👑 Admin • ⚡ Yönetici yetkili',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [listEmbed] });
    }
};



