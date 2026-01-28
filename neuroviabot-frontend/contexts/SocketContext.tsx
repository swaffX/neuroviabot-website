'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler?: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;
    joinGuild: (guildId: string) => Promise<boolean>;
    leaveGuild: (guildId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
        
        console.log('[Socket] Initializing connection to:', API_URL);
        
        // Initialize socket connection with better config
        const newSocket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
        });
        
        // Set socket immediately so components can access it
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Socket] ✅ Connected:', newSocket.id);
            setConnected(true);
            
            // Rejoin all previously joined rooms after reconnect
            if (joinedRooms.size > 0) {
                console.log('[Socket] Rejoining rooms after reconnect:', Array.from(joinedRooms));
                joinedRooms.forEach(guildId => {
                    newSocket.emit('join_guild', guildId, (response: any) => {
                        if (response?.success) {
                            console.log('[Socket] Rejoined guild room:', guildId);
                        }
                    });
                });
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[Socket] ⚠️ Disconnected:', reason);
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('[Socket] ❌ Connection error:', error.message);
            setConnected(false);
        });
        
        newSocket.on('reconnect', (attemptNumber) => {
            console.log('[Socket] 🔄 Reconnected after', attemptNumber, 'attempts');
        });
        
        newSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log('[Socket] 🔄 Reconnection attempt:', attemptNumber);
        });
        
        newSocket.on('error', (error) => {
            console.error('[Socket] ❌ Socket error:', error);
        });

        return () => {
            console.log('[Socket] Cleaning up connection');
            newSocket.close();
            setJoinedRooms(new Set());
        };
    }, []);

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        if (socket) {
            socket.on(event, handler);
        }
    }, [socket]);

    const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
        if (socket) {
            if (handler) {
                socket.off(event, handler);
            } else {
                socket.off(event);
            }
        }
    }, [socket]);

    const emit = useCallback((event: string, ...args: any[]) => {
        if (socket && connected) {
            socket.emit(event, ...args);
        } else {
            console.warn('[Socket] Cannot emit - socket not connected:', event);
        }
    }, [socket, connected]);
    
    const joinGuild = useCallback(async (guildId: string): Promise<boolean> => {
        if (!guildId || guildId === 'unknown') {
            console.warn('[Socket] Invalid guildId, skipping join_guild:', guildId);
            return false;
        }
        
        if (!socket) {
            console.warn('[Socket] Socket not initialized yet');
            return false;
        }
        
        if (!connected) {
            console.warn('[Socket] Not connected, will join once connected:', guildId);
            setJoinedRooms(prev => new Set(prev).add(guildId));
            return false;
        }
        
        return new Promise((resolve) => {
            console.log('[Socket] Joining guild room:', guildId);
            
            socket.emit('join_guild', guildId, (response: any) => {
                if (response?.success) {
                    console.log('[Socket] ✅ Successfully joined guild:', guildId);
                    setJoinedRooms(prev => new Set(prev).add(guildId));
                    resolve(true);
                } else {
                    console.error('[Socket] ❌ Failed to join guild:', guildId, response);
                    resolve(false);
                }
            });
            
            // Timeout fallback
            setTimeout(() => {
                console.warn('[Socket] ⚠️ Join guild timeout:', guildId);
                setJoinedRooms(prev => new Set(prev).add(guildId));
                resolve(false);
            }, 5000);
        });
    }, [socket, connected]);
    
    const leaveGuild = useCallback((guildId: string) => {
        if (!guildId || guildId === 'unknown') {
            return;
        }
        
        console.log('[Socket] Leaving guild room:', guildId);
        
        if (socket && connected) {
            socket.emit('leave_guild', guildId);
        }
        
        setJoinedRooms(prev => {
            const next = new Set(prev);
            next.delete(guildId);
            return next;
        });
    }, [socket, connected]);

    return (
        <SocketContext.Provider value={{ socket, connected, on, off, emit, joinGuild, leaveGuild }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

