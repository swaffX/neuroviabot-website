// ==========================================
// 🤖 NeuroViaBot - MongoDB Connection
// ==========================================
// MongoDB Atlas connection for NRC Economy

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

let isConnected = false;

/**
 * Connect to MongoDB Atlas
 */
async function connectMongoDB() {
    if (isConnected) {
        logger.info('[MongoDB] Already connected');
        return true;
    }

    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        logger.warn('[MongoDB] MONGODB_URI not set in .env');
        logger.warn('[MongoDB] Falling back to simple-db (JSON database)');
        return false;
    }

    try {
        logger.info('[MongoDB] Connecting to MongoDB Atlas...');

        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        logger.success('[MongoDB] Connected successfully!');
        logger.info(`[MongoDB] Database: ${mongoose.connection.name}`);

        // Connection event handlers
        mongoose.connection.on('error', (err) => {
            logger.error('[MongoDB] Connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('[MongoDB] Disconnected from MongoDB');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            logger.success('[MongoDB] Reconnected to MongoDB');
            isConnected = true;
        });

        return true;
    } catch (error) {
        logger.error('[MongoDB] Connection failed:', error.message);
        isConnected = false;
        return false;
    }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectMongoDB() {
    if (!isConnected) return;

    try {
        await mongoose.disconnect();
        isConnected = false;
        logger.info('[MongoDB] Disconnected');
    } catch (error) {
        logger.error('[MongoDB] Disconnect error:', error);
    }
}

/**
 * Check if MongoDB is connected
 */
function isMongoConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get mongoose instance
 */
function getMongoose() {
    return mongoose;
}

module.exports = {
    connectMongoDB,
    disconnectMongoDB,
    isMongoConnected,
    getMongoose,
    mongoose
};
