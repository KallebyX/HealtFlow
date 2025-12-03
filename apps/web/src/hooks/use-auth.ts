// ============================================================
// USE AUTH HOOK
// Hook customizado para autenticação
// ============================================================

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { UserRole, hasRole, hasAnyRole, isInRoleGroup, ROLE_GROUPS, getUserDisplayName } from '@/types/auth';

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user;

  const login = useCallback(
    async (email: string, password: string, twoFactorCode?: string) => {
      const result = await signIn('credentials', {
        email,
        password,
        twoFactorCode,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'REQUIRES_2FA') {
          return { success: false, requires2FA: true, error: null };
        }
        return { success: false, requires2FA: false, error: result.error };
      }

      return { success: true, requires2FA: false, error: null };
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/login');
  }, [router]);

  const checkRole = useCallback(
    (requiredRole: UserRole): boolean => {
      if (!user?.role) return false;
      return hasRole(user.role as UserRole, requiredRole);
    },
    [user?.role]
  );

  const checkAnyRole = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      if (!user?.role) return false;
      return hasAnyRole(user.role as UserRole, requiredRoles);
    },
    [user?.role]
  );

  const checkRoleGroup = useCallback(
    (groupName: keyof typeof ROLE_GROUPS): boolean => {
      if (!user?.role) return false;
      return isInRoleGroup(user.role as UserRole, groupName);
    },
    [user?.role]
  );

  const displayName = useMemo(() => {
    if (!user) return '';
    return user.name || user.email?.split('@')[0] || '';
  }, [user]);

  const isAdmin = useMemo(() => {
    return checkRoleGroup('ADMINS');
  }, [checkRoleGroup]);

  const isHealthcareProvider = useMemo(() => {
    return checkRoleGroup('HEALTHCARE_PROVIDERS');
  }, [checkRoleGroup]);

  const isPatient = useMemo(() => {
    return user?.role === UserRole.PATIENT;
  }, [user?.role]);

  const isStaff = useMemo(() => {
    return checkRoleGroup('ALL_STAFF');
  }, [checkRoleGroup]);

  return {
    user,
    session,
    status,
    isAuthenticated,
    isLoading,
    login,
    logout,
    update,
    checkRole,
    checkAnyRole,
    checkRoleGroup,
    displayName,
    isAdmin,
    isHealthcareProvider,
    isPatient,
    isStaff,
  };
}

export default useAuth;
