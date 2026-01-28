import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId?: string;
      username?: string;
      discriminator?: string;
      avatar?: string;
    };
  }

  interface User {
    id: string;
    discordId?: string;
    username?: string;
    discriminator?: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    discordId?: string;
    username?: string;
    discriminator?: string;
    avatar?: string;
  }
}

