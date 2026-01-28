const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { Settings } = require('../models/index');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quicksetup')
        .setDescription('⚡ Hızlı ve kolay sunucu kurulumu - tek tıkla ayarlar')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Ana kurulum menüsü
            const setupEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('⚡ Hızlı Sunucu Kurulumu')
                .setDescription('**NeuroViaBot**\'u sunucunuzda kullanmaya başlamak için aşağıdaki adımları takip edin!\n\n🎯 **Bu kurulum ile neler olacak?**\n• 🎵 Müzik sistemi aktif hale gelir\n• 🛡️ Temel moderasyon ayarları yapılır\n• 👋 Karşılama sistemi kurulur\n• 💰 Ekonomi sistemi başlar\n• 📊 Seviye sistemi etkinleşir')
                .addFields(
                    {
                        name: '🚀 Hızlı Kurulum',
                        value: '**"Otomatik Kurulum"** seçeneği ile tüm ayarları otomatik yapar',
                        inline: true
                    },
                    {
                        name: '🎛️ Özelleştirilmiş Kurulum', 
                        value: '**"Adım Adım Kurulum"** ile her özelliği kendiniz ayarlarsınız',
                        inline: true
                    },
                    {
                        name: '📋 Mevcut Ayarlar',
                        value: '**"Ayarlarımı Görüntüle"** ile mevcut konfigürasyonu kontrol edin',
                        inline: true
                    }
                )
                .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
                .setFooter({ 
                    text: 'Kurulum yaklaşık 1 dakika sürer • NeuroViaBot',
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setTimestamp();

            // Setup seçenekleri
            const setupMenu = new StringSelectMenuBuilder()
                .setCustomId('quicksetup_main')
                .setPlaceholder('🎯 Kurulum türünü seçin...')
                .addOptions([
                    {
                        label: 'Otomatik Kurulum (Önerilen)',
                        description: '⚡ Tüm özellikler varsayılan ayarlarla hızlıca kurulur',
                        value: 'auto_setup',
                        emoji: '🚀'
                    },
                    {
                        label: 'Adım Adım Kurulum',
                        description: '🎛️ Her özelliği tek tek yapılandırın',
                        value: 'manual_setup', 
                        emoji: '⚙️'
                    },
                    {
                        label: 'Mevcut Ayarlarımı Görüntüle',
                        description: '👀 Şu anki bot konfigürasyonunu kontrol edin',
                        value: 'view_current',
                        emoji: '📋'
                    },
                    {
                        label: 'Sadece Müzik Sistemini Kur',
                        description: '🎵 Hızlı müzik botu kurulumu',
                        value: 'music_only',
                        emoji: '🎶'
                    },
                    {
                        label: 'Sadece Moderasyon Sistemini Kur', 
                        description: '🛡️ Temel moderasyon araçları kurulumu',
                        value: 'moderation_only',
                        emoji: '🔰'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(setupMenu);

            await interaction.reply({ embeds: [setupEmbed], components: [row] });

        } catch (error) {
            console.error('QuickSetup command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Kurulum Hatası')
                .setDescription('Kurulum menüsü açılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                .setTimestamp();

            if (interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};

// Kurulum işlemlerini handle etmek için event listener (interactionCreate.js'ye eklenecek)
module.exports.handleSetupInteraction = async function(interaction) {
    if (!interaction.isStringSelectMenu() || !interaction.customId.startsWith('quicksetup_')) return;

    try {
        const action = interaction.values[0];
        
        switch (action) {
            case 'auto_setup':
                await handleAutoSetup(interaction);
                break;
            case 'manual_setup':
                await handleManualSetup(interaction);
                break;
            case 'view_current':
                await handleViewCurrent(interaction);
                break;
            case 'music_only':
                await handleMusicOnlySetup(interaction);
                break;
            case 'moderation_only':
                await handleModerationOnlySetup(interaction);
                break;
        }
    } catch (error) {
        console.error('Setup interaction error:', error);
    }
};

// Otomatik kurulum
async function handleAutoSetup(interaction) {
    await interaction.deferUpdate();

    const progressEmbed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('⚡ Otomatik Kurulum Başlatılıyor...')
        .setDescription('Lütfen bekleyin, sunucunuz için optimal ayarlar yapılandırılıyor...')
        .addFields({
            name: '🔄 İlerleme',
            value: '```\n[██████████          ] 50%\n```'
        })
        .setTimestamp();

    await interaction.editReply({ embeds: [progressEmbed], components: [] });

    // Otomatik kanal bulma ve ayarlama
    const guild = interaction.guild;
    
    // Karşılama kanalı bul (genel, general, chat gibi)
    const welcomeChannel = guild.channels.cache.find(ch => 
        ch.isTextBased() && 
        (ch.name.toLowerCase().includes('genel') || 
         ch.name.toLowerCase().includes('general') ||
         ch.name.toLowerCase().includes('chat') ||
         ch.name.toLowerCase().includes('sohbet'))
    ) || guild.systemChannel || guild.channels.cache.find(ch => ch.isTextBased());

    // Moderasyon log kanalı oluştur veya bul
    let logChannel = guild.channels.cache.find(ch => 
        ch.name.toLowerCase().includes('log') || 
        ch.name.toLowerCase().includes('kayıt')
    );

    if (!logChannel) {
        try {
            logChannel = await guild.channels.create({
                name: 'bot-logs',
                type: ChannelType.GuildText,
                topic: 'NeuroViaBot moderasyon ve sistem logları'
            });
        } catch (error) {
            console.error('Log channel creation failed:', error);
        }
    }

    // Mute rolü oluştur
    let muteRole = guild.roles.cache.find(role => 
        role.name.toLowerCase().includes('muted') || 
        role.name.toLowerCase().includes('susturulmuş')
    );

    if (!muteRole) {
        try {
            muteRole = await guild.roles.create({
                name: 'Muted',
                color: 0x818181,
                permissions: [],
                reason: 'NeuroViaBot otomatik kurulum - mute rolü'
            });

            // Mute rolüne kanal izinlerini ayarla
            for (const channel of guild.channels.cache.values()) {
                if (channel.isTextBased()) {
                    await channel.permissionOverwrites.create(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false
                    }).catch(() => {}); // Hataları yok say
                }
            }
        } catch (error) {
            console.error('Mute role creation failed:', error);
        }
    }

    // Ayarları kaydet
    const autoSettings = {
        guildId: guild.id,
        welcomeEnabled: true,
        welcomeChannel: welcomeChannel?.id || null,
        leaveEnabled: true,
        leaveChannel: welcomeChannel?.id || null,
        muteRole: muteRole?.id || null,
        logChannel: logChannel?.id || null,
        features: {
            music: true,
            economy: true,
            moderation: true,
            leveling: true,
            tickets: true,
            giveaways: true
        },
        autoMod: {
            enabled: true,
            deleteInvites: false,
            deleteSpam: true,
            filterWords: []
        }
    };

    await Settings.updateGuildSettings(guild.id, autoSettings);

    // Başarı mesajı
    const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Otomatik Kurulum Tamamlandı!')
        .setDescription('**Sunucunuz başarıyla yapılandırıldı!** Artık tüm bot özelliklerini kullanabilirsiniz.')
        .addFields(
            {
                name: '👋 Karşılama Sistemi',
                value: welcomeChannel ? `**Aktif** - ${welcomeChannel}` : '**Pasif** - Manuel ayar gerekli',
                inline: true
            },
            {
                name: '📝 Log Kanalı',
                value: logChannel ? `**Kuruldu** - ${logChannel}` : '**Kurulamadı** - İzin sorunu',
                inline: true
            },
            {
                name: '🔇 Mute Rolü',
                value: muteRole ? `**Oluşturuldu** - @${muteRole.name}` : '**Oluşturulamadı** - İzin sorunu',
                inline: true
            },
            {
                name: '🎯 Aktif Özellikler',
                value: '🎵 Müzik • 🛡️ Moderasyon • 💰 Ekonomi • 📊 Leveling • 🎫 Tickets • 🎉 Giveaways',
                inline: false
            }
        )
        .setFooter({ text: 'Detaylı ayarlar için /setup komutunu kullanabilirsiniz' })
        .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
}

// Manuel kurulum
async function handleManualSetup(interaction) {
    const manualEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('⚙️ Adım Adım Kurulum')
        .setDescription('Hangi özelliği yapılandırmak istiyorsunuz?')
        .addFields(
            {
                name: '🔧 Mevcut Komutlar',
                value: '• `/setup welcome` - Karşılama sistemi\n• `/setup moderation` - Moderasyon\n• `/setup features` - Özellik ayarları\n• `/setup view` - Ayarları görüntüle',
                inline: false
            }
        )
        .setTimestamp();

    await interaction.update({ embeds: [manualEmbed], components: [] });
}

// Mevcut ayarları görüntüle
async function handleViewCurrent(interaction) {
    const settings = await Settings.getGuildSettings(interaction.guild.id);
    
    const currentEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📋 Mevcut Sunucu Ayarları')
        .setDescription(`**${interaction.guild.name}** için mevcut bot konfigürasyonu`)
        .addFields(
            {
                name: '👋 Karşılama Sistemi',
                value: `**Durum:** ${settings.welcomeEnabled ? '✅ Aktif' : '❌ Pasif'}\n**Kanal:** ${settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : 'Ayarlanmamış'}`,
                inline: true
            },
            {
                name: '🛡️ Moderasyon',
                value: `**Auto-Mod:** ${settings.autoMod?.enabled ? '✅' : '❌'}\n**Log:** ${settings.logChannel ? `<#${settings.logChannel}>` : 'Yok'}`,
                inline: true
            },
            {
                name: '🎯 Aktif Özellikler',
                value: `${settings.features?.music ? '🎵' : '❌'} Müzik\n${settings.features?.economy ? '💰' : '❌'} Ekonomi\n${settings.features?.leveling ? '📊' : '❌'} Leveling`,
                inline: true
            }
        )
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setTimestamp();

    await interaction.update({ embeds: [currentEmbed], components: [] });
}


// Sadece moderasyon kurulumu  
async function handleModerationOnlySetup(interaction) {
    await interaction.deferUpdate();
    
    const settings = {
        features: { moderation: true },
        autoMod: { enabled: true, deleteSpam: true }
    };
    
    await Settings.updateGuildSettings(interaction.guild.id, settings);
    
    const modEmbed = new EmbedBuilder()
        .setColor('#ff6b35')
        .setTitle('🛡️ Moderasyon Sistemi Kuruldu!')
        .setDescription('**Moderasyon araçlarınız hazır!** Artık şu komutları kullanabilirsiniz:')
        .addFields(
            {
                name: '🔰 Moderasyon Komutları',
                value: '• `/mod warn` - Uyarı ver\n• `/mod kick` - Sunucudan at\n• `/mod ban` - Yasakla\n• `/mod mute` - Sustur',
                inline: false
            }
        )
        .setTimestamp();
        
    await interaction.editReply({ embeds: [modEmbed] });
}
