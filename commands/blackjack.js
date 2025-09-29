const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Guild, GuildMember, User } = require('../models');
const { logger } = require('../utils/logger');
const config = require('../config.json');

// Aktif oyunları takip et
const activeGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('🃏 Blackjack oyna ve bahis yap')
        .addIntegerOption(option =>
            option.setName('bahis')
                .setDescription('Bahis miktarı (minimum 50)')
                .setMinValue(50)
                .setMaxValue(10000)
                .setRequired(true)
        ),

    async execute(interaction) {
        const bet = interaction.options.getInteger('bahis');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const gameId = `${guildId}_${userId}`;

        // Zaten oyun oynuyor mu kontrol et
        if (activeGames.has(gameId)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4500')
                .setTitle('⏰ Zaten Oynuyorsun!')
                .setDescription('Mevcut blackjack oyununuzu tamamlayın!')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }

        try {
            await interaction.deferReply();

            // Kullanıcı ve guild bilgilerini al
            const guild = await Guild.findOne({ where: { id: guildId } });
            if (!guild) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Sunucu ekonomi sistemi bulunamadı!')
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const guildMember = await GuildMember.findOne({
                where: {
                    userId: userId,
                    guildId: guildId
                },
                include: [
                    {
                        model: User,
                        as: 'user'
                    }
                ]
            });

            if (!guildMember) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Hata')
                    .setDescription('Ekonomi sistemine kayıtlı değilsin!')
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const currentBalance = parseInt(guildMember.balance) || 0;

            // Bakiye kontrolü
            if (currentBalance < bet) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetersiz Bakiye')
                    .setDescription(`Bu kadar para yok! Mevcut bakiye: **${currentBalance.toLocaleString()}** coin`)
                    .setTimestamp();
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Yeni oyun başlat
            const game = createNewGame(userId, bet);
            activeGames.set(gameId, game);

            // Oyun durumunu göster
            const gameEmbed = createGameEmbed(game, interaction.user);
            const buttons = createGameButtons(game);

            await interaction.editReply({ embeds: [gameEmbed], components: [buttons] });

            // 3 dakika sonra oyunu otomatik sonlandır
            setTimeout(() => {
                if (activeGames.has(gameId)) {
                    activeGames.delete(gameId);
                }
            }, 3 * 60 * 1000);

        } catch (error) {
            logger.error('Blackjack komut hatası', error, {
                user: userId,
                guild: guildId,
                bet: bet
            });

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Hata')
                .setDescription('Blackjack oyunu başlatılırken bir hata oluştu!')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};

// Oyun logic fonksiyonları
function createNewGame(userId, bet) {
    const deck = createDeck();
    const game = {
        userId,
        bet,
        deck: shuffleDeck(deck),
        playerCards: [],
        dealerCards: [],
        gameOver: false,
        playerStand: false,
        result: null
    };

    // İlk kartları dağıt
    game.playerCards.push(drawCard(game.deck));
    game.dealerCards.push(drawCard(game.deck));
    game.playerCards.push(drawCard(game.deck));
    game.dealerCards.push(drawCard(game.deck));

    return game;
}

function createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = [
        { name: 'A', value: [1, 11] },
        { name: '2', value: [2] },
        { name: '3', value: [3] },
        { name: '4', value: [4] },
        { name: '5', value: [5] },
        { name: '6', value: [6] },
        { name: '7', value: [7] },
        { name: '8', value: [8] },
        { name: '9', value: [9] },
        { name: '10', value: [10] },
        { name: 'J', value: [10] },
        { name: 'Q', value: [10] },
        { name: 'K', value: [10] }
    ];

    const deck = [];
    suits.forEach(suit => {
        values.forEach(val => {
            deck.push({
                suit,
                name: val.name,
                value: val.value
            });
        });
    });

    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function drawCard(deck) {
    return deck.pop();
}

function calculateHandValue(cards) {
    let value = 0;
    let aces = 0;

    cards.forEach(card => {
        if (card.value.length === 1) {
            value += card.value[0];
        } else { // As kartı
            aces++;
            value += 11;
        }
    });

    // As'ları optimize et
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

function createGameEmbed(game, user) {
    const playerValue = calculateHandValue(game.playerCards);
    const dealerValue = calculateHandValue(game.dealerCards);

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🃏 Blackjack')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            {
                name: '🎯 Hedef',
                value: '21\'e en yakın olmaya çalışın, ama geçmeyin!',
                inline: false
            }
        );

    // Krupiye kartları (oyun bitmemişse ikinci kartı gizli)
    let dealerCards = '';
    if (game.gameOver) {
        dealerCards = game.dealerCards.map(card => `${card.name}${card.suit}`).join(' ');
        dealerCards += ` **(${dealerValue})**`;
    } else {
        dealerCards = `${game.dealerCards[0].name}${game.dealerCards[0].suit} 🂠`;
        dealerCards += ` **(${game.dealerCards[0].value[0]} + ?)**`;
    }

    // Oyuncu kartları
    const playerCards = game.playerCards.map(card => `${card.name}${card.suit}`).join(' ');

    embed.addFields(
        {
            name: '🏠 Krupiye',
            value: dealerCards,
            inline: true
        },
        {
            name: '👤 Sizin Kartlarınız',
            value: `${playerCards} **(${playerValue})**`,
            inline: true
        },
        {
            name: '💰 Bahis',
            value: `${game.bet.toLocaleString()} coin`,
            inline: true
        }
    );

    // Oyun durumu
    if (game.gameOver) {
        let resultColor = '#ff0000';
        let resultText = '';

        if (game.result === 'win') {
            resultColor = '#00ff00';
            if (playerValue === 21 && game.playerCards.length === 2) {
                resultText = '🎉 BLACKJACK! (2.5x kazanç)';
            } else {
                resultText = '🎉 Kazandınız! (2x kazanç)';
            }
        } else if (game.result === 'lose') {
            resultColor = '#ff0000';
            if (playerValue > 21) {
                resultText = '💥 Bust! (Kaybettiniz)';
            } else {
                resultText = '😢 Kaybettiniz!';
            }
        } else if (game.result === 'tie') {
            resultColor = '#ffff00';
            resultText = '🤝 Berabere! (Bahis iade)';
        }

        embed.setColor(resultColor);
        embed.addFields({
            name: '🏁 Sonuç',
            value: resultText,
            inline: false
        });
    } else {
        // Oyun devam ediyor
        let status = '';
        if (playerValue === 21) {
            status = '🎯 21! Mükemmel!';
        } else if (playerValue > 21) {
            status = '💥 Bust! Oyun bitti!';
        } else {
            status = '🎲 Kart çek veya dur?';
        }

        embed.addFields({
            name: '⏳ Durum',
            value: status,
            inline: false
        });
    }

    embed.setTimestamp()
        .setFooter({ 
            text: 'Blackjack • Hit = Kart çek, Stand = Dur',
            iconURL: user.displayAvatarURL()
        });

    return embed;
}

function createGameButtons(game) {
    const playerValue = calculateHandValue(game.playerCards);
    const row = new ActionRowBuilder();

    if (!game.gameOver && playerValue <= 21) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('blackjack_hit')
                .setLabel('🃏 Hit (Kart Çek)')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(false),
            new ButtonBuilder()
                .setCustomId('blackjack_stand')
                .setLabel('✋ Stand (Dur)')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false)
        );
    } else {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('blackjack_new')
                .setLabel('🔄 Yeni Oyun')
                .setStyle(ButtonStyle.Success)
                .setDisabled(false)
        );
    }

    return row;
}

// Export functions for button interactions
module.exports.activeGames = activeGames;
module.exports.createGameEmbed = createGameEmbed;
module.exports.createGameButtons = createGameButtons;
module.exports.calculateHandValue = calculateHandValue;
module.exports.drawCard = drawCard;
