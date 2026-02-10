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
  const { isAuthenticated, accessToken, fetchUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Wait one tick for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    async function checkAuth() {
      // After hydration, read fresh state from the store
      const state = useAuthStore.getState();

      if (!state.accessToken) {
        router.replace('/login');
        return;
      }

      if (state.isAuthenticated) {
        setIsChecking(false);
        return;
      }

      try {
        await fetchUser();
        const updated = useAuthStore.getState();
        if (updated.isAuthenticated) {
          setIsChecking(false);
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    }

    checkAuth();
  }, [hydrated, isAuthenticated, accessToken, fetchUser, router]);

  if (!hydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
