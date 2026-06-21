import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile as UserInfo, PermissionName } from '@brainwave/shared';

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserInfo, accessToken: string, refreshToken: string) => void;
  setUser: (user: UserInfo) => void;
  logout: () => void;
  hasPermission: (permission: PermissionName) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
      
      setUser: (user) => set({ user }),
      
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      
      hasPermission: (permission: PermissionName) => {
        const { user } = get();
        if (!user) return false;
        if (user.role.name === 'MASTER') return true;
        return user.permissions?.includes(permission) || false;
      },
      
      hasRole: (role: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role.name === 'MASTER') return true;
        return user.role.name === role;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
