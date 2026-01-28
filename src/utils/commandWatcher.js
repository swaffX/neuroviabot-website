// ==========================================
// 👁️ Command Watcher - Real-time Command Sync
// ==========================================
// Monitors command changes and broadcasts to frontend

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class CommandWatcher {
    constructor(client, socket) {
        this.client = client;
        this.socket = socket;
        this.commandsPath = path.join(__dirname, '..', 'commands');
        this.lastCommandList = new Map();
        this.isWatching = false;
        this.watchInterval = null;
        this.WATCH_INTERVAL = 5000; // 5 saniye
    }

    // Komut listesini al
    getCurrentCommands() {
        const commands = new Map();
        
        if (fs.existsSync(this.commandsPath)) {
            const commandFiles = fs.readdirSync(this.commandsPath)
                .filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(this.commandsPath, file);
                    const stats = fs.statSync(filePath);
                    
                    commands.set(file, {
                        file,
                        path: filePath,
                        lastModified: stats.mtimeMs,
                        size: stats.size
                    });
                } catch (error) {
                    logger.error(`[CommandWatcher] Error reading file ${file}:`, error);
                }
            }
        }
        
        return commands;
    }

    // Değişiklikleri tespit et
    detectChanges() {
        const current = this.getCurrentCommands();
        const changes = {
            added: [],
            removed: [],
            modified: [],
            hasChanges: false
        };

        // Yeni veya değiştirilen komutları bul
        for (const [fileName, fileInfo] of current) {
            const previous = this.lastCommandList.get(fileName);
            
            if (!previous) {
                // Yeni komut
                changes.added.push(fileName);
                changes.hasChanges = true;
            } else if (fileInfo.lastModified !== previous.lastModified) {
                // Değiştirilen komut
                changes.modified.push(fileName);
                changes.hasChanges = true;
            }
        }

        // Silinen komutları bul
        for (const [fileName] of this.lastCommandList) {
            if (!current.has(fileName)) {
                changes.removed.push(fileName);
                changes.hasChanges = true;
            }
        }

        this.lastCommandList = current;
        return changes;
    }

    // Komut bilgilerini al
    async getCommandInfo(fileName) {
        try {
            const filePath = path.join(this.commandsPath, fileName);
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                return {
                    name: command.data.name,
                    description: command.data.description,
                    category: command.category || 'general',
                    options: command.data.options || [],
                    file: fileName
                };
            }
        } catch (error) {
            logger.error(`[CommandWatcher] Error getting command info for ${fileName}:`, error);
        }
        
        return null;
    }

    // Tüm komut listesini al
    async getAllCommandsInfo() {
        const commandsInfo = [];
        
        if (this.client && this.client.commands) {
            for (const [name, command] of this.client.commands) {
                try {
                    commandsInfo.push({
                        name: command.data.name,
                        description: command.data.description,
                        category: command.category || 'general',
                        options: command.data.options?.length || 0,
                        usageCount: command.usageCount || 0
                    });
                } catch (error) {
                    logger.error(`[CommandWatcher] Error processing command ${name}:`, error);
                }
            }
        }
        
        return commandsInfo;
    }

    // Değişiklikleri broadcast et
    async broadcastChanges(changes) {
        if (!this.socket || !changes.hasChanges) {
            return;
        }

        try {
            // Eklenen komutlar için detayları al
            const addedDetails = [];
            for (const fileName of changes.added) {
                const info = await this.getCommandInfo(fileName);
                if (info) {
                    addedDetails.push(info);
                }
            }

            // Değiştirilen komutlar için detayları al
            const modifiedDetails = [];
            for (const fileName of changes.modified) {
                const info = await this.getCommandInfo(fileName);
                if (info) {
                    modifiedDetails.push(info);
                }
            }

            // Broadcast event
            const updateData = {
                added: addedDetails,
                removed: changes.removed.map(f => f.replace('.js', '')),
                modified: modifiedDetails,
                timestamp: new Date().toISOString(),
                totalCommands: this.client.commands.size
            };

            this.socket.emit('commands_updated', updateData);
            
            logger.info('[CommandWatcher] Broadcasted command changes:', {
                added: addedDetails.length,
                removed: changes.removed.length,
                modified: modifiedDetails.length
            });

            // Backend'e de bildir (global broadcast için)
            if (global.realtimeUpdates) {
                global.realtimeUpdates.broadcastGlobal('commands_updated', updateData);
            }

        } catch (error) {
            logger.error('[CommandWatcher] Error broadcasting changes:', error);
        }
    }

    // Watch başlat
    start() {
        if (this.isWatching) {
            logger.warn('[CommandWatcher] Already watching');
            return;
        }

        // İlk scan
        this.lastCommandList = this.getCurrentCommands();
        logger.info(`[CommandWatcher] Initial scan: ${this.lastCommandList.size} commands found`);

        // Periyodik check
        this.watchInterval = setInterval(async () => {
            try {
                const changes = this.detectChanges();
                
                if (changes.hasChanges) {
                    logger.info('[CommandWatcher] Changes detected:', {
                        added: changes.added,
                        removed: changes.removed,
                        modified: changes.modified
                    });

                    // Komutları yeniden yükle
                    if (changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0) {
                        await this.reloadCommands();
                    }

                    // Broadcast yap
                    await this.broadcastChanges(changes);
                }
            } catch (error) {
                logger.error('[CommandWatcher] Error in watch interval:', error);
            }
        }, this.WATCH_INTERVAL);

        this.isWatching = true;
        logger.info(`[CommandWatcher] Started watching (interval: ${this.WATCH_INTERVAL}ms)`);
    }

    // Watch durdur
    stop() {
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
        
        this.isWatching = false;
        logger.info('[CommandWatcher] Stopped watching');
    }

    // Komutları yeniden yükle
    async reloadCommands() {
        try {
            const { categorizeCommand } = require('./commandCategorizer');
            const commandFiles = fs.readdirSync(this.commandsPath).filter(file => file.endsWith('.js'));
            
            // Mevcut komutları temizle (dikkatli!)
            const previousCommands = new Set(this.client.commands.keys());
            
            // Yeni komutları yükle
            let loadedCount = 0;
            for (const file of commandFiles) {
                const filePath = path.join(this.commandsPath, file);
                
                try {
                    // Cache'i temizle
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    
                    if ('data' in command && 'execute' in command) {
                        command.category = categorizeCommand(command.data.name);
                        command.usageCount = this.client.commands.get(command.data.name)?.usageCount || 0;
                        
                        this.client.commands.set(command.data.name, command);
                        previousCommands.delete(command.data.name);
                        loadedCount++;
                    }
                } catch (error) {
                    logger.error(`[CommandWatcher] Error reloading ${file}:`, error);
                }
            }
            
            // Silinen komutları kaldır
            for (const cmdName of previousCommands) {
                this.client.commands.delete(cmdName);
                logger.info(`[CommandWatcher] Removed deleted command: ${cmdName}`);
            }
            
            logger.info(`[CommandWatcher] Reloaded ${loadedCount} commands`);
            
            // Discord'a komutları sync et (optional, dikkatli kullan)
            // await this.syncToDiscord();
            
        } catch (error) {
            logger.error('[CommandWatcher] Error reloading commands:', error);
        }
    }

    // Discord'a sync et
    async syncToDiscord() {
        try {
            const { REST } = require('@discordjs/rest');
            const { Routes } = require('discord-api-types/v10');
            
            const commands = [];
            for (const command of this.client.commands.values()) {
                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }
            
            const rest = new REST().setToken(process.env.DISCORD_TOKEN);
            
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands }
            );
            
            logger.info(`[CommandWatcher] Synced ${commands.length} commands to Discord`);
        } catch (error) {
            logger.error('[CommandWatcher] Error syncing to Discord:', error);
        }
    }

    // Manuel refresh (API endpoint'ten çağrılacak)
    async forceRefresh() {
        logger.info('[CommandWatcher] Force refresh triggered');
        
        const changes = this.detectChanges();
        
        if (changes.hasChanges) {
            await this.reloadCommands();
            await this.broadcastChanges(changes);
        }
        
        // Güncel listeyi döndür
        const commandsList = await this.getAllCommandsInfo();
        
        return {
            success: true,
            commands: commandsList,
            changes,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = CommandWatcher;

