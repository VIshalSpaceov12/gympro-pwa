import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api';
import type { UserRole } from '@gympro/shared';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string | null;
  subscriptionStatus?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const result = await apiClient<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });

          if (result.success && result.data) {
            // Verify user has ADMIN role
            if (result.data.user.role !== 'ADMIN') {
              set({ isLoading: false });
              throw new Error('Access denied. Admin privileges required.');
            }

            set({
              user: result.data.user,
              accessToken: result.data.accessToken,
              refreshToken: result.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
            throw new Error(result.error || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      fetchUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const result = await apiClient<User>('/api/auth/me', {
            method: 'GET',
            token: accessToken,
          });

          if (result.success && result.data) {
            if (result.data.role !== 'ADMIN') {
              get().logout();
              return;
            }
            set({ user: result.data, isAuthenticated: true });
          } else {
            get().logout();
          }
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
