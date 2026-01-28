const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '..', 'logs');
        this.ensureLogDirectory();
        this.today = this.getToday();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getToday() {
        return new Date().toISOString().split('T')[0];
    }

    getLogFilePath(type = 'general') {
        return path.join(this.logDir, `${type}-${this.today}.log`);
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;
    }

    writeToFile(level, message, meta = {}, type = 'general') {
        try {
            // Gün değişmişse güncelle
            const currentDay = this.getToday();
            if (currentDay !== this.today) {
                this.today = currentDay;
            }

            const logFile = this.getLogFilePath(type);
            const formattedMessage = this.formatMessage(level, message, meta);
            
            fs.appendFileSync(logFile, formattedMessage);
        } catch (error) {
            console.error('Log yazma hatası:', error);
        }
    }

    // Genel log metodları
    info(message, meta = {}) {
        console.log(`ℹ️  ${message}`);
        this.writeToFile('info', message, meta);
    }

    warn(message, meta = {}) {
        console.warn(`⚠️  ${message}`);
        this.writeToFile('warn', message, meta);
    }

    error(message, error = null, meta = {}) {
        console.error(`❌ ${message}`);
        
        const errorMeta = { ...meta };
        if (error) {
            errorMeta.error = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        }
        
        this.writeToFile('error', message, errorMeta, 'errors');
    }

    debug(message, meta = {}) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🐛 ${message}`);
            this.writeToFile('debug', message, meta, 'debug');
        }
    }

    success(message, meta = {}) {
        console.log(`✅ ${message}`);
        this.writeToFile('success', message, meta);
    }

    // Müzik bot özel log metodları
    musicEvent(event, data = {}) {
        const message = `Müzik Eventi: ${event}`;
        console.log(`🎵 ${message}`);
        this.writeToFile('music', message, data, 'music');
    }

    commandUsage(command, user, guild, success = true) {
        const message = `Komut ${success ? 'başarılı' : 'başarısız'}: /${command}`;
        const meta = {
            command,
            user: {
                id: user.id,
                username: user.username,
                tag: user.tag
            },
            guild: guild ? {
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount
            } : null,
            success
        };
        
        console.log(`🎮 ${message} - ${user.tag}${guild ? ` (${guild.name})` : ' (DM)'}`);
        this.writeToFile('command', message, meta, 'commands');
    }

    playerError(error, context = {}) {
        const message = `Player Hatası: ${error.message}`;
        const meta = {
            ...context,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        };
        
        console.error(`🎵❌ ${message}`);
        this.writeToFile('error', message, meta, 'player-errors');
    }

    // Performance monitoring
    performance(operation, duration, meta = {}) {
        const message = `Performans: ${operation} - ${duration}ms`;
        const performanceMeta = {
            ...meta,
            operation,
            duration,
            timestamp: Date.now()
        };
        
        if (duration > 5000) { // 5 saniyeden uzun işlemler
            console.warn(`⏱️  ${message} (YAVAS)`);
            this.writeToFile('performance', message, performanceMeta, 'performance');
        } else {
            this.writeToFile('performance', message, performanceMeta, 'performance');
        }
    }

    // Sistem bilgileri
    systemInfo() {
        const info = {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            timestamp: Date.now()
        };
        
        this.writeToFile('system', 'Sistem Bilgileri', info, 'system');
        return info;
    }

    // Log dosyalarını temizle (30 günden eski)
    cleanOldLogs() {
        try {
            const files = fs.readdirSync(this.logDir);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  Eski log dosyası silindi: ${file}`);
                }
            });
        } catch (error) {
            this.error('Log temizleme hatası', error);
        }
    }

    // Bot başlangıç logu
    botStartup(client) {
        const startupInfo = {
            botTag: client.user.tag,
            botId: client.user.id,
            guildCount: client.guilds.cache.size,
            userCount: client.users.cache.size,
            nodeVersion: process.version,
            discordJsVersion: require('discord.js').version,
            timestamp: Date.now()
        };
        
        this.success(`Bot başlatıldı: ${client.user.tag}`, startupInfo);
        this.systemInfo();
    }

    // Bot kapatılışı logu
    botShutdown(reason = 'Bilinmeyen') {
        const shutdownInfo = {
            reason,
            uptime: process.uptime(),
            timestamp: Date.now()
        };
        
        this.info(`Bot kapatılıyor: ${reason}`, shutdownInfo);
    }
}

// Error handling wrapper fonksiyonları
function withErrorHandling(fn, context = '') {
    return async (...args) => {
        try {
            const startTime = Date.now();
            const result = await fn(...args);
            const duration = Date.now() - startTime;
            
            logger.performance(context || fn.name, duration);
            return result;
        } catch (error) {
            logger.error(`Hata (${context || fn.name})`, error);
            throw error;
        }
    };
}

function safeExecute(fn, fallback = null, context = '') {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            logger.error(`Güvenli yürütme hatası (${context || fn.name})`, error);
            return fallback;
        }
    };
}

// Singleton instance
const logger = new Logger();

// Process event listeners
process.on('uncaughtException', (error) => {
    console.error('❌ Yakalanmamış İstisna:', error);
    logger.error('Yakalanmamış İstisna', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('İşlenmemiş Promise Reddi', new Error(String(reason)), { promise: String(promise) });
});

process.on('SIGINT', () => {
    logger.botShutdown('SIGINT (Ctrl+C)');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.botShutdown('SIGTERM');
    process.exit(0);
});

// Her gün log dosyalarını temizle
setInterval(() => {
    logger.cleanOldLogs();
}, 24 * 60 * 60 * 1000); // 24 saat

module.exports = {
    Logger,
    logger,
    withErrorHandling,
    safeExecute
};
