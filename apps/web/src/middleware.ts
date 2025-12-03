// ============================================================
// MIDDLEWARE
// Middleware de proteção de rotas com NextAuth.js
// ============================================================

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole, UserStatus, ROLE_GROUPS } from '@/types/auth';

// Rotas públicas que não requerem autenticação
const publicRoutes = [
  '/',
  '/login',
  '/registro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/verificar-email',
  '/termos',
  '/privacidade',
];

// Rotas que requerem roles específicas
const roleRoutes: Record<string, UserRole[]> = {
  '/admin': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  '/clinicas': ROLE_GROUPS.ADMINS,
  '/medicos': [...ROLE_GROUPS.ADMINS, ...ROLE_GROUPS.MANAGERS],
  '/funcionarios': [...ROLE_GROUPS.ADMINS, ...ROLE_GROUPS.MANAGERS],
  '/faturamento': [...ROLE_GROUPS.ADMINS, UserRole.BILLING_CLERK, UserRole.CLINIC_MANAGER],
  '/relatorios': [...ROLE_GROUPS.ADMINS, ...ROLE_GROUPS.MANAGERS],
  '/configuracoes/clinica': ROLE_GROUPS.ADMINS,
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Verifica se é rota pública
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPublicRoute) {
      // Se usuário está logado e tenta acessar login/registro, redireciona para dashboard
      if (token && (pathname === '/login' || pathname === '/registro')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Verifica se usuário está ativo
    if (token?.status !== UserStatus.ACTIVE) {
      if (token?.status === UserStatus.PENDING) {
        return NextResponse.redirect(new URL('/verificar-email', req.url));
      }
      return NextResponse.redirect(new URL('/login?error=AccountInactive', req.url));
    }

    // Verifica permissões de role para rotas específicas
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route)) {
        const userRole = token?.role as UserRole;
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL('/dashboard?error=Unauthorized', req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Permite rotas públicas
        const isPublicRoute = publicRoutes.some(
          (route) => pathname === route || pathname.startsWith(`${route}/`)
        );

        if (isPublicRoute) {
          return true;
        }

        // Permite rotas de API públicas
        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        // Requer autenticação para outras rotas
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
