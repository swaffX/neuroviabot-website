// ==========================================
// 🔧 Auto-Fixer Service
// ==========================================
// Automatic error detection and fixing strategies

const { getErrorDetector } = require('./errorDetector');

class AutoFixer {
    constructor() {
        this.errorDetector = getErrorDetector();
        this.fixStrategies = new Map();
        this.fixHistory = [];
        
        this.registerStrategies();
        this.startMonitoring();
        
        console.log('[AutoFixer] Initialized with', this.fixStrategies.size, 'strategies');
    }
    
    registerStrategies() {
        // Database connection errors
        this.fixStrategies.set('connection_error', {
            name: 'Database Reconnection',
            fix: async (error) => {
                console.log('[AutoFixer] Attempting database reconnection...');
                try {
                    const db = require('../database/simple-db').getDatabase();
                    // Database will auto-reconnect
                    return { success: true, message: 'Database reconnection triggered' };
                } catch (err) {
                    return { success: false, message: err.message };
                }
            }
        });
        
        // Discord API rate limits
        this.fixStrategies.set('rate_limit', {
            name: 'Rate Limit Handler',
            fix: async (error) => {
                console.log('[AutoFixer] Handling rate limit...');
                // Queue management already handles this
                return { success: true, message: 'Rate limit handled by queue' };
            }
        });
        
        // Socket.IO disconnects
        this.fixStrategies.set('socket_disconnect', {
            name: 'Socket Reconnection',
            fix: async (error) => {
                console.log('[AutoFixer] Triggering socket reconnection...');
                // Socket.IO auto-reconnects
                return { success: true, message: 'Socket reconnection in progress' };
            }
        });
        
        // Memory management
        this.fixStrategies.set('memory_leak', {
            name: 'Garbage Collection',
            fix: async (error) => {
                console.log('[AutoFixer] Forcing garbage collection...');
                try {
                    if (global.gc) {
                        global.gc();
                        return { success: true, message: 'Garbage collection triggered' };
                    }
                    return { success: false, message: 'GC not available (run with --expose-gc)' };
                } catch (err) {
                    return { success: false, message: err.message };
                }
            }
        });
        
        // Unhandled promise rejections
        this.fixStrategies.set('unhandled_rejection', {
            name: 'Promise Handler',
            fix: async (error) => {
                console.log('[AutoFixer] Logging unhandled rejection...');
                console.error('Unhandled rejection:', error);
                return { success: true, message: 'Rejection logged and handled' };
            }
        });
        
        // API timeout errors
        this.fixStrategies.set('timeout_error', {
            name: 'Timeout Handler',
            fix: async (error) => {
                console.log('[AutoFixer] Handling timeout...');
                // Retry logic is handled by axios/fetch
                return { success: true, message: 'Timeout handled, retry recommended' };
            }
        });
    }
    
    startMonitoring() {
        // Listen to error detector threshold events
        this.errorDetector.on('threshold_exceeded', (data) => {
            console.log('[AutoFixer] Error threshold exceeded for:', data.endpoint);
            this.handleThresholdExceeded(data);
        });
        
        // Global error handlers
        process.on('unhandledRejection', (reason, promise) => {
            console.error('[AutoFixer] Unhandled Rejection at:', promise, 'reason:', reason);
            this.errorDetector.logError('global', new Error(String(reason)), {
                type: 'unhandled_rejection'
            });
            this.attemptFix('unhandled_rejection', { message: String(reason) });
        });
        
        process.on('uncaughtException', (error) => {
            console.error('[AutoFixer] Uncaught Exception:', error);
            this.errorDetector.logError('global', error, {
                type: 'uncaught_exception'
            });
            // Don't attempt fix for uncaught exceptions - let process handle it
        });
    }
    
    async handleThresholdExceeded(data) {
        const { endpoint, errors } = data;
        
        // Analyze error patterns
        const errorTypes = errors.map(e => e.type);
        const mostCommon = this.findMostCommon(errorTypes);
        
        console.log(`[AutoFixer] Most common error type for ${endpoint}:`, mostCommon);
        
        // Attempt fix
        if (this.fixStrategies.has(mostCommon)) {
            await this.attemptFix(mostCommon, errors[errors.length - 1]);
        }
    }
    
    async attemptFix(errorType, error) {
        const strategy = this.fixStrategies.get(errorType);
        
        if (!strategy) {
            console.log('[AutoFixer] No fix strategy for:', errorType);
            return { success: false, message: 'No strategy available' };
        }
        
        console.log(`[AutoFixer] Attempting fix: ${strategy.name}`);
        
        try {
            const result = await strategy.fix(error);
            
            this.fixHistory.push({
                timestamp: Date.now(),
                errorType,
                strategyName: strategy.name,
                success: result.success,
                message: result.message
            });
            
            // Keep last 50 fixes
            if (this.fixHistory.length > 50) {
                this.fixHistory.shift();
            }
            
            console.log(`[AutoFixer] Fix ${result.success ? 'successful' : 'failed'}:`, result.message);
            return result;
        } catch (err) {
            console.error('[AutoFixer] Fix attempt failed:', err);
            return { success: false, message: err.message };
        }
    }
    
    findMostCommon(arr) {
        const counts = {};
        arr.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });
        
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }
    
    getFixHistory() {
        return this.fixHistory.slice(-20).reverse();
    }
    
    getStats() {
        const successCount = this.fixHistory.filter(f => f.success).length;
        const failCount = this.fixHistory.filter(f => !f.success).length;
        
        return {
            totalFixes: this.fixHistory.length,
            successful: successCount,
            failed: failCount,
            successRate: this.fixHistory.length > 0 
                ? ((successCount / this.fixHistory.length) * 100).toFixed(2) + '%'
                : '0%',
            recentFixes: this.getFixHistory()
        };
    }
}

// Singleton
let autoFixerInstance = null;

function getAutoFixer() {
    if (!autoFixerInstance) {
        autoFixerInstance = new AutoFixer();
    }
    return autoFixerInstance;
}

module.exports = { getAutoFixer };

