import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.serverURL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
  }

  connect(token) {
    if (this.socket && this.connected) {
      return;
    }

    this.socket = io(this.serverURL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      
      // Auto-reconnect after 3 seconds if not intentional disconnect
      if (reason !== 'io client disconnect') {
        setTimeout(() => {
          if (!this.connected) {
            this.socket.connect();
          }
        }, 3000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
    });

    // Bot status updates
    this.socket.on('bot_status_update', (data) => {
      console.log('Bot status update:', data);
      this.emit('bot_status_update', data);
    });

    // Guild member updates
    this.socket.on('guild_member_add', (data) => {
      console.log('New member joined:', data);
      this.emit('guild_member_add', data);
    });

    this.socket.on('guild_member_remove', (data) => {
      console.log('Member left:', data);
      this.emit('guild_member_remove', data);
    });

    // Message events
    this.socket.on('message_create', (data) => {
      this.emit('message_create', data);
    });

    this.socket.on('message_delete', (data) => {
      this.emit('message_delete', data);
    });

    // Moderation events
    this.socket.on('moderation_action', (data) => {
      console.log('Moderation action:', data);
      this.emit('moderation_action', data);
    });

    // Economy events
    this.socket.on('economy_update', (data) => {
      this.emit('economy_update', data);
    });

    // Giveaway events
    this.socket.on('giveaway_ended', (data) => {
      console.log('Giveaway ended:', data);
      this.emit('giveaway_ended', data);
    });

    // Ticket events
    this.socket.on('ticket_created', (data) => {
      console.log('Ticket created:', data);
      this.emit('ticket_created', data);
    });

    this.socket.on('ticket_closed', (data) => {
      console.log('Ticket closed:', data);
      this.emit('ticket_closed', data);
    });

    // Level events
    this.socket.on('level_up', (data) => {
      console.log('User leveled up:', data);
      this.emit('level_up', data);
    });

    // Voice state updates
    this.socket.on('voice_state_update', (data) => {
      this.emit('voice_state_update', data);
    });

    // Command usage tracking
    this.socket.on('command_used', (data) => {
      this.emit('command_used', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Event listener methods
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  // Join specific rooms for targeted updates
  joinGuildRoom(guildId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_guild_room', { guildId });
    }
  }

  leaveGuildRoom(guildId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_guild_room', { guildId });
    }
  }

  // Request real-time data
  requestGuildStats(guildId) {
    if (this.socket && this.connected) {
      this.socket.emit('request_guild_stats', { guildId });
    }
  }

  requestBotStats() {
    if (this.socket && this.connected) {
      this.socket.emit('request_bot_stats');
    }
  }

  // Send commands to bot
  sendBotCommand(guildId, command, params = {}) {
    if (this.socket && this.connected) {
      this.socket.emit('bot_command', {
        guildId,
        command,
        params,
        timestamp: Date.now()
      });
    }
  }

  // Test connection
  ping() {
    return new Promise((resolve) => {
      if (!this.socket || !this.connected) {
        resolve(false);
        return;
      }

      const startTime = Date.now();
      this.socket.emit('ping', startTime);
      
      this.socket.once('pong', (timestamp) => {
        const latency = Date.now() - timestamp;
        resolve(latency);
      });

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  // Get connection status
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }
}

export const socketService = new SocketService();



