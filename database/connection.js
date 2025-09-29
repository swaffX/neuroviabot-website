const { Sequelize } = require('sequelize');
const path = require('path');
const { logger } = require('../utils/logger');

// SQLite database dosyası
const dbPath = path.join(__dirname, 'bot_database.sqlite');

// Sequelize instance oluştur
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: (msg) => logger.debug('Database Query', { query: msg }),
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        match: [
            /SQLITE_BUSY/
        ],
        name: 'query',
        max: 5
    }
});

// Database bağlantısını test et
async function testConnection() {
    try {
        await sequelize.authenticate();
        logger.success('Database bağlantısı başarıyla kuruldu!');
        return true;
    } catch (error) {
        logger.error('Database bağlantı hatası', error);
        return false;
    }
}

// Database'i sync et
async function syncDatabase(force = false) {
    try {
        // İlk başta force sync dene, hata olursa normal sync
        if (!force) {
            try {
                await sequelize.sync({ force: true });
                logger.success('Database yeniden oluşturuldu (forced)!');
                return true;
            } catch (forceError) {
                logger.warn('Force sync başarısız, normal sync deneniyor...');
            }
        }
        
        await sequelize.sync({ force, alter: !force });
        logger.success(`Database ${force ? 'yeniden oluşturuldu' : 'senkronize edildi'}!`);
        return true;
    } catch (error) {
        logger.error('Database sync hatası', error);
        return false;
    }
}

// Database'i başlat
async function initializeDatabase() {
    try {
        const connected = await testConnection();
        if (!connected) return false;

        const synced = await syncDatabase();
        if (!synced) return false;

        logger.success('Database başarıyla başlatıldı!');
        return true;
    } catch (error) {
        logger.error('Database başlatma hatası', error);
        return false;
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Database bağlantısı kapatılıyor...');
    await sequelize.close();
    logger.info('Database bağlantısı kapatıldı.');
});

process.on('SIGTERM', async () => {
    logger.info('Database bağlantısı kapatılıyor...');
    await sequelize.close();
    logger.info('Database bağlantısı kapatıldı.');
});

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    initializeDatabase
};

