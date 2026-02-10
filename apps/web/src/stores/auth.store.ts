import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api';
import type { UserRole } from '@gympro/shared';

export interface UserProfile {
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  fitnessGoal?: string | null;
  experienceLevel?: string | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string | null;
  phone?: string | null;
  subscriptionStatus?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  profile?: UserProfile | null;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

const STORAGE_KEY = 'auth-storage';
const REMEMBER_KEY = 'auth-remember';

// Helper to get the active storage based on rememberMe preference
function getActiveStorage(): Storage {
  if (typeof window === 'undefined') return localStorage;
  return localStorage.getItem(REMEMBER_KEY) === 'false' ? sessionStorage : localStorage;
}

// Custom storage adapter that delegates to localStorage or sessionStorage
const authStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    // Check localStorage first, then sessionStorage
    return localStorage.getItem(name) ?? sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    const storage = getActiveStorage();
    storage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      login: async (email: string, password: string, rememberMe = true) => {
        set({ isLoading: true });
        try {
          const result = await apiClient<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });

          if (result.success && result.data) {
            // Set remember preference BEFORE updating state (so persist writes to correct storage)
            if (typeof window !== 'undefined') {
              // Clear both storages first
              localStorage.removeItem(STORAGE_KEY);
              sessionStorage.removeItem(STORAGE_KEY);
              // Set the preference flag (always in localStorage so we can find it)
              localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false');
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

      register: async (email: string, password: string, firstName: string, lastName: string) => {
        set({ isLoading: true });
        try {
          const result = await apiClient<AuthResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, firstName, lastName }),
          });

          if (result.success && result.data) {
            // New registrations default to remember=true
            if (typeof window !== 'undefined') {
              localStorage.removeItem(STORAGE_KEY);
              sessionStorage.removeItem(STORAGE_KEY);
              localStorage.setItem(REMEMBER_KEY, 'true');
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
            throw new Error(result.error || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(REMEMBER_KEY);
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const result = await apiClient<RefreshResponse>('/api/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });

          if (result.success && result.data) {
            set({
              accessToken: result.data.accessToken,
              refreshToken: result.data.refreshToken,
            });
          } else {
            get().logout();
          }
        } catch {
          get().logout();
        }
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
      name: STORAGE_KEY,
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
