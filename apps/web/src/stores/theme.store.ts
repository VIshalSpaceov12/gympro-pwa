import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

function applyTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode: ThemeMode) => {
        applyTheme(mode);
        set({ mode });
      },
    }),
    {
      name: 'theme-preference',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.mode);
        }
      },
    }
  )
);

// Listen for system theme changes when mode is 'system'
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { mode } = useThemeStore.getState();
    if (mode === 'system') {
      applyTheme('system');
    }
  });
}
