'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, fetchUser, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Wait one tick for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const checkAuth = async () => {
      // After hydration, read fresh state from the store
      const state = useAuthStore.getState();

      if (state.isAuthenticated && state.user) {
        if (state.user.role !== 'ADMIN') {
          router.replace('/login');
          return;
        }
        setIsChecking(false);
        return;
      }

      // Not authenticated — try fetching user if we have a token
      if (state.accessToken) {
        try {
          await fetchUser();
          const updated = useAuthStore.getState();
          if (updated.isAuthenticated && updated.user?.role === 'ADMIN') {
            setIsChecking(false);
            return;
          }
        } catch {
          // fetch failed
        }
      }

      router.replace('/login');
    };

    checkAuth();
  }, [hydrated, isAuthenticated, user, fetchUser, router]);

  if (!hydrated || isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
