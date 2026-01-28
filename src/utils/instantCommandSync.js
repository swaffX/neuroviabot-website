// ==========================================
// ⚡ Instant Command Sync - Chokidar Integration
// ==========================================
// Real-time Discord slash command registration on file changes

const chokidar = require('chokidar');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { logger } = require('./logger');

class InstantCommandSync {
    constructor(client, socket) {
        this.client = client;
        this.socket = socket;
        this.commandsPath = path.join(__dirname, '..', 'commands');
        this.watcher = null;
        this.syncQueue = [];
        this.isSyncing = false;
        this.debounceTimeout = null;
        this.DEBOUNCE_DELAY = 1000; // 1 second debounce
    }

    // Start watching for command file changes
    start() {
        if (this.watcher) {
            logger.warn('[InstantSync] Already watching');
            return;
        }

        this.watcher = chokidar.watch(`${this.commandsPath}/*.js`, {
            persistent: true,
            ignoreInitial: true, // Don't trigger on startup
            awaitWriteFinish: {
                stabilityThreshold: 500,
                pollInterval: 100
            }
        });

        // File change events
        this.watcher.on('change', (filePath) => this.handleFileChange(filePath, 'modified'));
        this.watcher.on('add', (filePath) => this.handleFileChange(filePath, 'added'));
        this.watcher.on('unlink', (filePath) => this.handleFileChange(filePath, 'removed'));

        // Error handling
        this.watcher.on('error', (error) => {
            logger.error('[InstantSync] Watcher error:', error);
        });

        logger.success('[InstantSync] File watcher started', {
            path: this.commandsPath,
            debounce: this.DEBOUNCE_DELAY
        });
    }

    // Stop watching
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            logger.info('[InstantSync] File watcher stopped');
        }
    }

    // Handle file change with debouncing
    handleFileChange(filePath, changeType) {
        const fileName = path.basename(filePath);
        
        logger.info(`[InstantSync] File ${changeType}:`, fileName);

        // Clear existing debounce timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        // Debounce to avoid multiple rapid changes
        this.debounceTimeout = setTimeout(async () => {
            try {
                await this.processFileChange(filePath, fileName, changeType);
            } catch (error) {
                logger.error('[InstantSync] Error processing file change:', error);
            }
        }, this.DEBOUNCE_DELAY);
    }

    // Process the file change
    async processFileChange(filePath, fileName, changeType) {
        const startTime = Date.now();

        try {
            // Step 1: Reload command in bot memory
            const commandName = await this.reloadCommand(filePath, fileName, changeType);
            
            if (!commandName && changeType !== 'removed') {
                logger.warn('[InstantSync] No valid command found in', fileName);
                return;
            }

            // Step 2: Sync to Discord API
            await this.syncToDiscord();

            // Step 3: Broadcast to frontend
            await this.broadcastToFrontend(commandName, changeType);

            const duration = Date.now() - startTime;
            logger.success(`[InstantSync] Complete in ${duration}ms`, {
                command: commandName,
                type: changeType
            });

        } catch (error) {
            logger.error('[InstantSync] Processing error:', error);
        }
    }

    // Reload command in bot memory
    async reloadCommand(filePath, fileName, changeType) {
        try {
            const { categorizeCommand } = require('./commandCategorizer');

            if (changeType === 'removed') {
                // Remove command from memory
                const commandName = fileName.replace('.js', '');
                if (this.client.commands.has(commandName)) {
                    this.client.commands.delete(commandName);
                    logger.info(`[InstantSync] Removed command: ${commandName}`);
                    return commandName;
                }
                return null;
            }

            // Clear require cache
            delete require.cache[require.resolve(filePath)];

            // Load command
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                command.category = categorizeCommand(command.data.name);
                command.usageCount = this.client.commands.get(command.data.name)?.usageCount || 0;
                
                this.client.commands.set(command.data.name, command);
                
                logger.info(`[InstantSync] Reloaded command: ${command.data.name}`, {
                    category: command.category
                });

                return command.data.name;
            }

            return null;

        } catch (error) {
            logger.error(`[InstantSync] Error reloading ${fileName}:`, error);
            return null;
        }
    }

    // Sync all commands to Discord
    async syncToDiscord() {
        if (this.isSyncing) {
            logger.warn('[InstantSync] Sync already in progress, queuing...');
            return new Promise((resolve) => {
                this.syncQueue.push(resolve);
            });
        }

        this.isSyncing = true;

        try {
            const commands = [];
            for (const command of this.client.commands.values()) {
                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }

            if (commands.length === 0) {
                logger.warn('[InstantSync] No commands to sync');
                return;
            }

            const rest = new REST().setToken(process.env.DISCORD_TOKEN);

            // Global commands (instant visibility)
            const globalData = await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands }
            );

            logger.success(`[InstantSync] Synced ${globalData.length} commands to Discord`);

            // Process queued syncs
            while (this.syncQueue.length > 0) {
                const resolve = this.syncQueue.shift();
                resolve();
            }

        } catch (error) {
            logger.error('[InstantSync] Discord sync error:', error);
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    // Broadcast changes to frontend
    async broadcastToFrontend(commandName, changeType) {
        if (!this.socket || !commandName) {
            return;
        }

        try {
            const command = this.client.commands.get(commandName);
            
            const eventData = {
                type: changeType,
                command: command ? {
                    name: command.data.name,
                    description: command.data.description,
                    category: command.category,
                    options: command.data.options?.length || 0
                } : { name: commandName },
                timestamp: new Date().toISOString(),
                totalCommands: this.client.commands.size
            };

            // Emit via Socket.IO
            this.socket.emit('command_sync', eventData);

            logger.info('[InstantSync] Broadcasted to frontend', eventData);

        } catch (error) {
            logger.error('[InstantSync] Broadcast error:', error);
        }
    }

    // Manual force sync (for API endpoint)
    async forceSync() {
        logger.info('[InstantSync] Force sync triggered');
        
        try {
            await this.syncToDiscord();
            
            // Broadcast full command list
            const commandsList = [];
            for (const [name, cmd] of this.client.commands) {
                commandsList.push({
                    name: cmd.data.name,
                    description: cmd.data.description,
                    category: cmd.category || 'general',
                    options: cmd.data.options?.length || 0
                });
            }

            if (this.socket) {
                this.socket.emit('commands_full_sync', {
                    commands: commandsList,
                    total: commandsList.length,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                success: true,
                syncedCommands: commandsList.length,
                commands: commandsList
            };

        } catch (error) {
            logger.error('[InstantSync] Force sync error:', error);
            throw error;
        }
    }

    // Get watcher status
    getStatus() {
        return {
            isWatching: !!this.watcher,
            isSyncing: this.isSyncing,
            queueLength: this.syncQueue.length,
            totalCommands: this.client.commands.size
        };
    }
}

module.exports = InstantCommandSync;

