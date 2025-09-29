'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('auth-token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(response.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      Cookies.remove('auth-token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithDiscord = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1234567890'; // Replace with actual client ID
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const scope = encodeURIComponent('identify email guilds');
    
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    window.location.href = discordAuthUrl;
  };

  const handleAuthCallback = async (code) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE_URL}/api/auth/discord/callback`, {
        code,
        redirect_uri: window.location.origin + '/auth/callback'
      });

      const { token, user } = response.data;
      
      // Store token in cookies
      Cookies.set('auth-token', token, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Auth callback failed:', error);
      setError(error.response?.data?.message || 'Giriş işlemi başarısız oldu');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('auth-token');
    setUser(null);
    window.location.href = '/';
  };

  const fetchUserGuilds = async () => {
    try {
      const token = Cookies.get('auth-token');
      if (!token) throw new Error('No auth token');

      const response = await axios.get(`${API_BASE_URL}/api/discord/guilds`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data.guilds;
    } catch (error) {
      console.error('Failed to fetch user guilds:', error);
      throw error;
    }
  };

  const checkBotInGuild = async (guildId) => {
    try {
      const token = Cookies.get('auth-token');
      if (!token) throw new Error('No auth token');

      const response = await axios.get(`${API_BASE_URL}/api/discord/guild/${guildId}/bot-status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data.isPresent;
    } catch (error) {
      console.error('Failed to check bot status:', error);
      return false;
    }
  };

  const generateInviteLink = (guildId, permissions = '8') => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1234567890';
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands&guild_id=${guildId}`;
  };

  const value = {
    user,
    loading,
    error,
    loginWithDiscord,
    handleAuthCallback,
    logout,
    fetchUserGuilds,
    checkBotInGuild,
    generateInviteLink,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
