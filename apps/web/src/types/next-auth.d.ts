// ============================================================
// NEXT-AUTH TYPE EXTENSIONS
// Extensão dos tipos do NextAuth para incluir campos customizados
// ============================================================

import 'next-auth';
import 'next-auth/jwt';
import { UserRole, UserStatus } from './auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      twoFactorEnabled: boolean;
      emailVerified: boolean;
      name?: string;
      image?: string;
      patientId?: string;
      doctorId?: string;
      employeeId?: string;
    };
    accessToken: string;
    refreshToken: string;
    error?: string;
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    twoFactorEnabled: boolean;
    emailVerified: boolean;
    name?: string;
    image?: string;
    patientId?: string;
    doctorId?: string;
    employeeId?: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    twoFactorEnabled: boolean;
    emailVerified: boolean;
    name?: string;
    image?: string;
    patientId?: string;
    doctorId?: string;
    employeeId?: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }
}
