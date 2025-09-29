const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { CustomCommand } = require('../models');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom')
        .setDescription('🎨 Özel komut yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('➕ Yeni özel komut oluştur')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Komut adı (sadece harf, sayı ve tire)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('içerik')
                        .setDescription('Komut içeriği (variables: {user}, {guild}, {channel}, {args})')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('açıklama')
                        .setDescription('Komut açıklaması')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('takma-adlar')
                        .setDescription('Komut takma adları (virgülle ayırın)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('✏️ Özel komutu düzenle')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Düzenlenecek komut adı')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('içerik')
                        .setDescription('Yeni komut içeriği')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('açıklama')
                        .setDescription('Yeni açıklama')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('durum')
                        .setDescription('Komut aktif olsun mu?')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('🗑️ Özel komutu sil')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Silinecek komut adı')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Özel komutları listele')
                .addStringOption(option =>
                    option.setName('kategori')
                        .setDescription('Listelenecek kategori')
                        .addChoices(
                            { name: '📝 Genel', value: 'general' },
                            { name: '🎭 Eğlence', value: 'fun' },
                            { name: '📢 Duyuru', value: 'announcement' },
                            { name: '📚 Bilgi', value: 'info' },
                            { name: '🎨 Diğer', value: 'other' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('ℹ️ Özel komut bilgilerini görüntüle')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Bilgileri görüntülenecek komut adı')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed')
                .setDescription('📄 Embed ile özel komut oluştur')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('Komut adı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('başlık')
                        .setDescription('Embed başlığı')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('açıklama')
                        .setDescription('Embed açıklaması')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('renk')
                        .setDescription('Embed rengi (hex kodu, örn: #ff0000)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('thumbnail')
                        .setDescription('Embed thumbnail URL\'i')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('permissions')
                .setDescription('🔐 Komut izinlerini ayarla')
                .addStringOption(option =>
                    option.setName('isim')
                        .setDescription('İzinleri ayarlanacak komut adı')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addRoleOption(option =>
                    option.setName('rol-ekle')
                        .setDescription('Komutu kullanabilecek rol ekle')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('rol-çıkar')
                        .setDescription('Komut izni çıkarılacak rol')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('herkes')
                        .setDescription('Herkes bu komutu kullanabilsin mi?')
                        .setRequired(false)
                )
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const commands = await CustomCommand.findAll({
            where: { 
                guildId: interaction.guild.id,
                name: {
                    [require('sequelize').Op.like]: `%${focusedValue}%`
                }
            },
            limit: 25
        });

        const choices = commands.map(cmd => ({
            name: `${cmd.name} - ${cmd.description?.substring(0, 50) || 'Açıklama yok'}`,
            value: cmd.name
        }));

        await interaction.respond(choices);
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Yetki kontrolü (create, edit, delete, permissions için)
        const adminCommands = ['create', 'edit', 'delete', 'permissions', 'embed'];
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
                case 'create':
                    await this.handleCreate(interaction);
                    break;
                case 'edit':
                    await this.handleEdit(interaction);
                    break;
                case 'delete':
                    await this.handleDelete(interaction);
                    break;
                case 'list':
                    await this.handleList(interaction);
                    break;
                case 'info':
                    await this.handleInfo(interaction);
                    break;
                case 'embed':
                    await this.handleEmbedCreate(interaction);
                    break;
                case 'permissions':
                    await this.handlePermissions(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Custom komutunda hata', error, { subcommand, user: interaction.user.id });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Custom Komut Hatası')
                .setDescription('Custom komut işlemi sırasında bir hata oluştu!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleCreate(interaction) {
        const name = interaction.options.getString('isim').toLowerCase();
        const content = interaction.options.getString('içerik');
        const description = interaction.options.getString('açıklama') || '';
        const aliasesStr = interaction.options.getString('takma-adlar');

        // Komut adı validasyonu
        if (!/^[a-z0-9-_]+$/.test(name)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Geçersiz Komut Adı')
                .setDescription('Komut adı sadece küçük harf, sayı, tire ve alt çizgi içerebilir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Reserved komut adları
        const reservedNames = ['help', 'ping', 'play', 'custom', 'mod', 'economy', 'level', 'ticket', 'giveaway', 'welcome', 'guard'];
        if (reservedNames.includes(name)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Rezerve Komut Adı')
                .setDescription('Bu komut adı sistem komutları için rezerve edilmiştir!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Mevcut komut kontrolü
            const existingCommand = await CustomCommand.findOne({
                where: {
                    guildId: interaction.guild.id,
                    name: name
                }
            });

            if (existingCommand) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Komut Zaten Mevcut')
                    .setDescription(`**${name}** adında bir komut zaten mevcut!`)
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Aliases parse et
            const aliases = aliasesStr ? aliasesStr.split(',').map(a => a.trim().toLowerCase()) : [];

            // Yeni komut oluştur
            const customCommand = await CustomCommand.create({
                guildId: interaction.guild.id,
                createdBy: interaction.user.id,
                name: name,
                content: content,
                description: description,
                aliases: aliases,
                contentType: 'text'
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Özel Komut Oluşturuldu')
                .setDescription(`**${name}** komutu başarıyla oluşturuldu!`)
                .addFields(
                    { name: '📝 Komut Adı', value: name, inline: true },
                    { name: '📄 Açıklama', value: description || 'Açıklama yok', inline: true },
                    { name: '🔤 Takma Adlar', value: aliases.length > 0 ? aliases.join(', ') : 'Yok', inline: true },
                    { name: '📊 Kullanım', value: `\`${name}\` veya \`!${name}\``, inline: false },
                    { name: '🎯 İçerik Önizleme', value: content.length > 100 ? content.substring(0, 100) + '...' : content, inline: false }
                )
                .setFooter({
                    text: `Oluşturan: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            logger.error('Custom command create hatası', error);
        }
    },

    async handleList(interaction) {
        const category = interaction.options.getString('kategori');

        const whereClause = {
            guildId: interaction.guild.id,
            enabled: true
        };

        if (category) {
            whereClause.category = category;
        }

        const customCommands = await CustomCommand.findAll({
            where: whereClause,
            order: [['usageCount', 'DESC'], ['name', 'ASC']],
            limit: 20
        });

        if (customCommands.length === 0) {
            const noCommandsEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('📋 Özel Komut Yok')
                .setDescription(category ? `**${category}** kategorisinde özel komut bulunmuyor!` : 'Henüz hiç özel komut oluşturulmamış!')
                .addFields({
                    name: '💡 İpucu',
                    value: '`/custom create` komutu ile yeni özel komutlar oluşturabilirsiniz!',
                    inline: false
                })
                .setTimestamp();
            
            return interaction.reply({ embeds: [noCommandsEmbed] });
        }

        let description = '';
        customCommands.forEach((cmd, index) => {
            const usage = cmd.usageCount || 0;
            const statusEmoji = cmd.enabled ? '✅' : '❌';
            description += `${index + 1}. ${statusEmoji} **${cmd.name}**\n`;
            description += `   └ ${cmd.description || 'Açıklama yok'} • ${usage} kullanım\n\n`;
        });

        const listEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Özel Komutlar')
            .setDescription(description)
            .addFields({
                name: '📊 İstatistikler',
                value: `Toplam **${customCommands.length}** komut${category ? ` (${category} kategorisi)` : ''}`,
                inline: false
            })
            .setFooter({
                text: `Detaylı bilgi için: /custom info <komut_adı>`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [listEmbed] });
    },

    // Variables işleme fonksiyonu
    processVariables(content, interaction, args = []) {
        return content
            .replace(/{user}/g, interaction.user.toString())
            .replace(/{user\.mention}/g, interaction.user.toString())
            .replace(/{user\.username}/g, interaction.user.username)
            .replace(/{user\.tag}/g, interaction.user.tag)
            .replace(/{user\.id}/g, interaction.user.id)
            .replace(/{guild}/g, interaction.guild.name)
            .replace(/{guild\.name}/g, interaction.guild.name)
            .replace(/{guild\.id}/g, interaction.guild.id)
            .replace(/{guild\.memberCount}/g, interaction.guild.memberCount.toString())
            .replace(/{channel}/g, interaction.channel.toString())
            .replace(/{channel\.name}/g, interaction.channel.name)
            .replace(/{channel\.id}/g, interaction.channel.id)
            .replace(/{args}/g, args.join(' '))
            .replace(/{args\.(\d+)}/g, (match, index) => args[parseInt(index)] || '')
            .replace(/{date}/g, new Date().toLocaleDateString('tr-TR'))
            .replace(/{time}/g, new Date().toLocaleTimeString('tr-TR'))
            .replace(/{timestamp}/g, `<t:${Math.floor(Date.now() / 1000)}:F>`)
            .replace(/{random\.(\d+)-(\d+)}/g, (match, min, max) => {
                return Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1)) + parseInt(min);
            });
    }
};



