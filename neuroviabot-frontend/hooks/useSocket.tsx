'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';

interface UseSocketOptions {
  guildId?: string;
  onSettingsChanged?: (data: any) => void;
  onLevelUpdate?: (data: any) => void;
  onMilestoneLevelUp?: (data: any) => void;
  onSettingsUpdated?: (data: any) => void;
  onMemberAction?: (data: any) => void;
  onChannelUpdate?: (data: any) => void;
  onRoleUpdate?: (data: any) => void;
  onReactionRoleUpdate?: (data: any) => void;
  onAnalyticsUpdate?: (data: any) => void;
  onAuditLogEntry?: (data: any) => void;
}

export function useSocket({ 
  guildId, 
  onSettingsChanged, 
  onLevelUpdate, 
  onMilestoneLevelUp,
  onSettingsUpdated,
  onMemberAction,
  onChannelUpdate,
  onRoleUpdate,
  onReactionRoleUpdate,
  onAnalyticsUpdate,
  onAuditLogEntry,
}: UseSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected:', newSocket.id);
      console.log('[Socket.IO] Frontend connected to backend');
      console.log('[Socket.IO] Connection URL:', SOCKET_URL);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
      console.error('[Socket.IO] Connection URL:', SOCKET_URL);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join guild room when guildId changes
  useEffect(() => {
    if (socket && connected && guildId) {
      console.log(`[Socket.IO] Joining guild room: ${guildId}`);
      console.log(`[Socket.IO] Socket connected: ${connected}, Socket ID: ${socket.id}`);
      socket.emit('join_guild', guildId);

      return () => {
        console.log(`[Socket.IO] Leaving guild room: ${guildId}`);
        socket.emit('leave_guild', guildId);
      };
    } else {
      console.log(`[Socket.IO] Cannot join guild room - Socket: ${!!socket}, Connected: ${connected}, GuildId: ${guildId}`);
    }
  }, [socket, connected, guildId]);

  // Listen for settings changes
  useEffect(() => {
    if (socket && onSettingsChanged) {
      socket.on('settings_changed', onSettingsChanged);

      return () => {
        socket.off('settings_changed', onSettingsChanged);
      };
    }
  }, [socket, onSettingsChanged]);

  // Listen for level updates
  useEffect(() => {
    if (socket && onLevelUpdate) {
      socket.on('level_update', (data) => {
        console.log('[Socket.IO] Received level_update event:', data);
        onLevelUpdate(data);
      });

      return () => {
        socket.off('level_update', onLevelUpdate);
      };
    }
  }, [socket, onLevelUpdate]);

  // Listen for milestone level ups
  useEffect(() => {
    if (socket && onMilestoneLevelUp) {
      socket.on('milestone_level_up', onMilestoneLevelUp);

      return () => {
        socket.off('milestone_level_up', onMilestoneLevelUp);
      };
    }
  }, [socket, onMilestoneLevelUp]);

  // Listen for settings updates
  useEffect(() => {
    if (socket && onSettingsUpdated) {
      socket.on('settings_updated', (data) => {
        console.log('[Socket.IO] Received settings_updated event:', data);
        onSettingsUpdated(data);
      });

      return () => {
        socket.off('settings_updated', onSettingsUpdated);
      };
    }
  }, [socket, onSettingsUpdated]);

  // Listen for member actions
  useEffect(() => {
    if (socket && onMemberAction) {
      socket.on('member_action', (data) => {
        console.log('[Socket.IO] Received member_action event:', data);
        onMemberAction(data);
      });

      return () => {
        socket.off('member_action', onMemberAction);
      };
    }
  }, [socket, onMemberAction]);

  // Listen for channel updates
  useEffect(() => {
    if (socket && onChannelUpdate) {
      socket.on('channel_update', (data) => {
        console.log('[Socket.IO] Received channel_update event:', data);
        onChannelUpdate(data);
      });

      return () => {
        socket.off('channel_update', onChannelUpdate);
      };
    }
  }, [socket, onChannelUpdate]);

  // Listen for role updates
  useEffect(() => {
    if (socket && onRoleUpdate) {
      socket.on('role_update', (data) => {
        console.log('[Socket.IO] Received role_update event:', data);
        onRoleUpdate(data);
      });

      return () => {
        socket.off('role_update', onRoleUpdate);
      };
    }
  }, [socket, onRoleUpdate]);

  // Listen for reaction role updates
  useEffect(() => {
    if (socket && onReactionRoleUpdate) {
      socket.on('reaction_role_update', (data) => {
        console.log('[Socket.IO] Received reaction_role_update event:', data);
        onReactionRoleUpdate(data);
      });

      return () => {
        socket.off('reaction_role_update', onReactionRoleUpdate);
      };
    }
  }, [socket, onReactionRoleUpdate]);

  // Listen for analytics updates
  useEffect(() => {
    if (socket && onAnalyticsUpdate) {
      socket.on('analytics_updated', (data) => {
        console.log('[Socket.IO] Received analytics_updated event:', data);
        onAnalyticsUpdate(data);
      });

      return () => {
        socket.off('analytics_updated', onAnalyticsUpdate);
      };
    }
  }, [socket, onAnalyticsUpdate]);

  // Listen for audit log entries
  useEffect(() => {
    if (socket && onAuditLogEntry) {
      socket.on('audit_log_entry', (data) => {
        console.log('[Socket.IO] Received audit_log_entry event:', data);
        onAuditLogEntry(data);
      });

      return () => {
        socket.off('audit_log_entry', onAuditLogEntry);
      };
    }
  }, [socket, onAuditLogEntry]);

  // Emit settings update
  const emitSettingsUpdate = useCallback((guildId: string, settings: any) => {
    if (socket && connected) {
      console.log(`[Socket.IO] Emitting settings update for guild ${guildId}`);
      socket.emit('settings_update', { guildId, settings });
    }
  }, [socket, connected]);

  // Join specific room
  const joinRoom = useCallback((room: string) => {
    if (socket && connected) {
      socket.emit('join_room', room);
    }
  }, [socket, connected]);

  // Leave specific room
  const leaveRoom = useCallback((room: string) => {
    if (socket && connected) {
      socket.emit('leave_room', room);
    }
  }, [socket, connected]);

  // Emit custom event
  const emit = useCallback((event: string, data: any) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  }, [socket, connected]);

  // Listen for custom event
  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (socket) {
      socket.on(event, handler);
    }
  }, [socket]);

  // Remove event listener
  const off = useCallback((event: string, handler?: (data: any) => void) => {
    if (socket) {
      if (handler) {
        socket.off(event, handler);
      } else {
        socket.off(event);
      }
    }
  }, [socket]);

  return {
    socket,
    connected,
    emitSettingsUpdate,
    joinRoom,
    leaveRoom,
    emit,
    on,
    off,
  };
}
