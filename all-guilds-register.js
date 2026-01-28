// ==========================================
// 🤖 NeuroViaBot - All Guilds Command Registration
// ==========================================

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Komutları yükle
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Komut yüklendi: ${command.data.name}`);
    } else {
        console.log(`⚠️ Komut geçersiz: ${file}`);
    }
}

// REST instance oluştur
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Komutları kaydet
(async () => {
    try {
        console.log(`🔄 ${commands.length} slash komutu kaydediliyor...`);

        // Rate limit için bekleme ekle
        console.log('⏳ Rate limit için 2 saniye bekleniyor...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Global komutları kaydet
        console.log('[1/2] Registering global commands...');
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} global slash komutu başarıyla kaydedildi!`);
        
        // Her komut için detay
        data.forEach(cmd => {
            console.log(`  - ${cmd.name}: ${cmd.description}`);
        });

        console.log('🎉 Komut kaydı tamamlandı! Bot yeniden başlatılabilir.');

    } catch (error) {
        console.error('❌ Komut kaydetme hatası:', error);
        
        if (error.code === 50035) {
            console.log('💡 CLIENT_ID environment variable kontrol edin!');
        } else if (error.code === 401) {
            console.log('💡 DISCORD_TOKEN kontrol edin!');
        } else if (error.code === 429) {
            console.log('💡 Rate limit - 1 dakika bekleyip tekrar deneyin!');
        }
        
        console.log('🔧 Manuel çözüm: Bot\'u restart edin ve Discord\'u yenileyin');
    }
})();
