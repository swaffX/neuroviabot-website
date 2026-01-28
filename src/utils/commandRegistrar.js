// ==========================================
// 🤖 NeuroViaBot - Automatic Command Registrar
// ==========================================

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class CommandRegistrar {
    constructor(client) {
        this.client = client;
        this.rest = new REST({ version: '10', timeout: 30000 }).setToken(process.env.DISCORD_TOKEN);
        this.clientId = process.env.DISCORD_CLIENT_ID;
        this.commands = [];
    }

    // Tüm komutları yükle
    loadCommands() {
        this.commands = [];
        const commandsPath = path.join(__dirname, '..', 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                // Cache'i temizle
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    this.commands.push(command.data.toJSON());
                    logger.info(`Komut yüklendi: ${command.data.name}`);
                }
            } catch (error) {
                logger.error(`Komut yükleme hatası: ${file}`, error);
            }
        }

        logger.success(`Toplam ${this.commands.length} komut yüklendi`);
        return this.commands;
    }

    // Global komutları kaydet
    async registerGlobalCommands() {
        try {
            logger.info('Global komutlar kaydediliyor...');
            
            const data = await this.rest.put(
                Routes.applicationCommands(this.clientId),
                { body: this.commands }
            );

            logger.success(`${data.length} global komut başarıyla kaydedildi`);
            return true;
        } catch (error) {
            logger.error('Global komut kayıt hatası', error);
            return false;
        }
    }

    // Tek bir guild için komutları kaydet
    async registerGuildCommands(guildId) {
        try {
            const data = await this.rest.put(
                Routes.applicationGuildCommands(this.clientId, guildId),
                { body: this.commands }
            );

            return { success: true, count: data.length };
        } catch (error) {
            logger.error(`Guild komut kayıt hatası: ${guildId}`, error);
            return { success: false, error: error.message };
        }
    }

    // Tüm guilds için komutları kaydet (rate limit aware)
    async registerAllGuildCommands() {
        const guilds = this.client.guilds.cache;
        logger.info(`${guilds.size} guild için komutlar kaydediliyor...`);

        let successCount = 0;
        let failCount = 0;
        const batchSize = 5;
        const guildArray = Array.from(guilds.values());

        for (let i = 0; i < guildArray.length; i += batchSize) {
            const batch = guildArray.slice(i, i + batchSize);
            const promises = batch.map(guild => this.registerGuildCommands(guild.id));
            const results = await Promise.all(promises);

            results.forEach((result, index) => {
                if (result.success) {
                    successCount++;
                    logger.info(`✅ ${batch[index].name}: ${result.count} komut`);
                } else {
                    failCount++;
                    logger.warn(`❌ ${batch[index].name}: ${result.error}`);
                }
            });

            // Rate limit için bekle
            if (i + batchSize < guildArray.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        logger.success(`Komut kaydı tamamlandı: ${successCount} başarılı, ${failCount} başarısız`);
        return { successCount, failCount };
    }

    // Otomatik kayıt - bot hazır olduğunda çalışır
    async autoRegister() {
        try {
            logger.info('🔄 Otomatik komut kaydı başlatılıyor...');
            
            // Komutları yükle
            this.loadCommands();

            // Global komutları kaydet
            await this.registerGlobalCommands();

            // Tüm guilds için komutları kaydet
            await this.registerAllGuildCommands();

            logger.success('✅ Otomatik komut kaydı tamamlandı!');
            return true;
        } catch (error) {
            logger.error('Otomatik komut kaydı hatası', error);
            return false;
        }
    }
}

module.exports = CommandRegistrar;
