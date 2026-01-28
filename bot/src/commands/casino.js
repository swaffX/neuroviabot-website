const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('casino')
        .setDescription('🎡 NeuroVia Casino - Şansını dene ve NRC kazan!'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('🎡 NeuroVia Casino Ana Menü')
            .setDescription('Aşağıdaki menüden oynamak istediğin oyunu seç!\n\n**Oyunlar:**\n🚀 **Crash** - Katlayıcı yükselirken patlamadan çekil!\n💣 **Mines** - Mayınlara basmadan elmasları topla!\n🃏 **Blackjack** - 21\'e en yakın ol, kasayı yen!\n🎰 **Slots** - Üçlüyü yakala, büyük ödülü kazan!\n🔴 **Roulette** - Sayını seç, çark dönsün!\n🃏 **High-Low** - Sıradaki kart büyük mü küçük mü?\n🐎 **Racing** - En hızlı ata bahis yap!\n✂️ **RPS** - Taş, kağıt, makas!\n🎲 **Dice** - Zar tahminini tuttur, x6 kazan!')
            .setImage('https://media.discordapp.net/attachments/1110000000000000000/1120000000000000000/casino_banner.png') // Banner yoksa silinebilir
            .setFooter({ text: 'The Neural Currency of Discord • Bol Şans!' });

        const select = new StringSelectMenuBuilder()
            .setCustomId('casino_game_select')
            .setPlaceholder('Oynamak istediğin oyunu seç...')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Crash').setValue('crash').setEmoji('🚀').setDescription('Katlayıcı yükselirken doğru zamanda çekil!'),
                new StringSelectMenuOptionBuilder().setLabel('Mines').setValue('mines').setEmoji('💣').setDescription('Mayınlardan kaç, elmasları topla!'),
                new StringSelectMenuOptionBuilder().setLabel('Blackjack').setValue('blackjack').setEmoji('🃏').setDescription('Krupiyeyi yenerek 21\'e ulaş!'),
                new StringSelectMenuOptionBuilder().setLabel('Slots').setValue('slots').setEmoji('🎰').setDescription('Şanslı sembolleri birleştir!'),
                new StringSelectMenuOptionBuilder().setLabel('Roulette').setValue('roulette').setEmoji('🔴').setDescription('Sayılara veya renklere bahis yap!'),
                new StringSelectMenuOptionBuilder().setLabel('High-Low').setValue('highlow').setEmoji('↕️').setDescription('Sonraki kartın değerini tahmin et!'),
                new StringSelectMenuOptionBuilder().setLabel('Horse Racing').setValue('racing').setEmoji('🏇').setDescription('Hızlı atlara bahis yap!'),
                new StringSelectMenuOptionBuilder().setLabel('RPS').setValue('rps').setEmoji('✂️').setDescription('Taş, kağıt, makas oyna!'),
                new StringSelectMenuOptionBuilder().setLabel('Dice').setValue('dice').setEmoji('🎲').setDescription('Zar tahminini yap, x6 kazan!')
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
