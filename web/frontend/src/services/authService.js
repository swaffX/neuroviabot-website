import axios from 'axios';

class AuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    this.token = null;
    
    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });

    // Request interceptor to add token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    this.token = token;
  }

  getDiscordAuthURL() {
    const clientId = process.env.REACT_APP_DISCORD_CLIENT_ID || '1234567890123456789';
    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = encodeURIComponent('identify guilds');
    
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  }

  async loginWithDiscord(code) {
    try {
      const response = await this.api.post('/auth/discord', {
        code,
        redirectUri: window.location.origin,
      });

      return response.data;
    } catch (error) {
      console.error('Discord login error:', error);
      throw new Error(error.response?.data?.message || 'Discord girişi başarısız');
    }
  }

  async getUser() {
    try {
      const response = await this.api.get('/user');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw new Error(error.response?.data?.message || 'Kullanıcı bilgileri alınamadı');
    }
  }

  async getUserGuilds() {
    try {
      const response = await this.api.get('/guilds');
      return response.data;
    } catch (error) {
      console.error('Get guilds error:', error);
      throw new Error(error.response?.data?.message || 'Sunucu listesi alınamadı');
    }
  }

  async getGuildData(guildId) {
    try {
      const response = await this.api.get(`/guild/${guildId}`);
      return response.data;
    } catch (error) {
      console.error('Get guild data error:', error);
      throw new Error(error.response?.data?.message || 'Sunucu verileri alınamadı');
    }
  }

  async updateGuildSettings(guildId, settings) {
    try {
      const response = await this.api.put(`/guild/${guildId}/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Update guild settings error:', error);
      throw new Error(error.response?.data?.message || 'Sunucu ayarları güncellenemedi');
    }
  }

  async getGuildStats(guildId) {
    try {
      const response = await this.api.get(`/guild/${guildId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Get guild stats error:', error);
      throw new Error(error.response?.data?.message || 'Sunucu istatistikleri alınamadı');
    }
  }

  async getBotStats() {
    try {
      const response = await this.api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Get bot stats error:', error);
      throw new Error(error.response?.data?.message || 'Bot istatistikleri alınamadı');
    }
  }

  async getTickets(guildId) {
    try {
      const response = await this.api.get(`/guild/${guildId}/tickets`);
      return response.data;
    } catch (error) {
      console.error('Get tickets error:', error);
      throw new Error(error.response?.data?.message || 'Ticket listesi alınamadı');
    }
  }

  async getGiveaways(guildId) {
    try {
      const response = await this.api.get(`/guild/${guildId}/giveaways`);
      return response.data;
    } catch (error) {
      console.error('Get giveaways error:', error);
      throw new Error(error.response?.data?.message || 'Çekiliş listesi alınamadı');
    }
  }

  async getModerationCases(guildId) {
    try {
      const response = await this.api.get(`/guild/${guildId}/moderation`);
      return response.data;
    } catch (error) {
      console.error('Get moderation cases error:', error);
      throw new Error(error.response?.data?.message || 'Moderasyon kayıtları alınamadı');
    }
  }

  async getEconomyData(guildId) {
    try {
      const response = await this.api.get(`/guild/${guildId}/economy`);
      return response.data;
    } catch (error) {
      console.error('Get economy data error:', error);
      throw new Error(error.response?.data?.message || 'Ekonomi verileri alınamadı');
    }
  }

  async getLevelingData(guildId) {
    try {
      const response = await this.api.get(`/guild/${guildId}/leveling`);
      return response.data;
    } catch (error) {
      console.error('Get leveling data error:', error);
      throw new Error(error.response?.data?.message || 'Seviye verileri alınamadı');
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('discord_token');
    window.location.reload();
  }
}

export const authService = new AuthService();



