// ============================================================
// NEXTAUTH CONFIGURATION
// Configuração completa do NextAuth.js com Credentials provider
// ============================================================

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserRole, UserStatus, getUserDisplayName, getUserAvatar } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('RefreshTokenError');
    }

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + data.expiresIn * 1000,
    };
  } catch {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        twoFactorCode: { label: 'Codigo 2FA', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha sao obrigatorios');
        }

        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              twoFactorCode: credentials.twoFactorCode || undefined,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Credenciais invalidas');
          }

          // Se precisa de 2FA, retorna flag
          if (data.requires2FA) {
            throw new Error('REQUIRES_2FA');
          }

          const { user, accessToken, refreshToken, expiresIn } = data;

          return {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            status: user.status as UserStatus,
            twoFactorEnabled: user.twoFactorEnabled,
            emailVerified: user.emailVerified,
            name: getUserDisplayName(user),
            image: getUserAvatar(user),
            patientId: user.patient?.id,
            doctorId: user.doctor?.id,
            employeeId: user.employee?.id,
            accessToken,
            refreshToken,
            accessTokenExpires: Date.now() + expiresIn * 1000,
          };
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error('Erro ao realizar login');
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/registro',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Login inicial - adiciona dados do usuário ao token
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          twoFactorEnabled: user.twoFactorEnabled,
          emailVerified: user.emailVerified,
          name: user.name,
          image: user.image,
          patientId: user.patientId,
          doctorId: user.doctorId,
          employeeId: user.employeeId,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: (user as any).accessTokenExpires,
        };
      }

      // Atualização manual da sessão
      if (trigger === 'update' && session) {
        return {
          ...token,
          ...session,
        };
      }

      // Token ainda válido
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expirado - tenta refresh
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id,
          email: token.email,
          role: token.role,
          status: token.status,
          twoFactorEnabled: token.twoFactorEnabled,
          emailVerified: token.emailVerified,
          name: token.name,
          image: token.image,
          patientId: token.patientId,
          doctorId: token.doctorId,
          employeeId: token.employeeId,
        },
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        error: token.error,
      };
    },
  },

  events: {
    async signOut() {
      // Limpa sessão no backend (opcional)
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
