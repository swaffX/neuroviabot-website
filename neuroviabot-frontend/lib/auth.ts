// ==========================================
// NextAuth DISABLED - Backend OAuth kullanıyoruz
// ==========================================
// Backend Passport.js ile OAuth yapıyoruz
// Frontend sadece backend'e redirect yapıyor
// ==========================================

import type { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

// NextAuth config (şu anda kullanılmıyor - backend OAuth aktif)
export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_BOT_CLIENT_ID || '773539215098249246',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'identify email guilds',
        },
      },
    }),
  ],
  
  debug: false, // Disabled - using backend OAuth
  
  secret: process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET,
  
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.discordId = (profile as any).id;
        token.accessToken = account.access_token;
        token.username = (profile as any).username;
        token.discriminator = (profile as any).discriminator;
        token.avatar = (profile as any).avatar;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).discordId = token.discordId;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).username = token.username;
        (session.user as any).discriminator = token.discriminator;
        (session.user as any).avatar = token.avatar;
        (session.user as any).email = token.email;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export default authOptions;
