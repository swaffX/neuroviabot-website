let io;

/**
 * Initialize Socket.IO instance
 * @param {Server} socketIO - Socket.IO server instance
 */
function initIO(socketIO) {
    io = socketIO;
    console.log('[Socket] Socket.IO instance initialized');
}

/**
 * Get Socket.IO instance
 * @returns {Server} Socket.IO server instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized! Call initIO first.');
    }
    return io;
}

module.exports = {
    initIO,
    getIO
};

