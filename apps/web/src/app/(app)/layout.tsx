'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { AuthGuard } from '@/components/auth-guard';
import { BottomNav } from '@/components/bottom-nav';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Dumbbell, Home, Activity, Apple, MessageSquare, Trophy, Award, User, ChevronDown, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/nutrition', label: 'Nutrition', icon: Apple },
  { href: '/community', label: 'Community', icon: MessageSquare },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

const userMenuItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/achievements', label: 'Achievements', icon: Award },
];

function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-gray-900">GymProLuxe</span>
        </div>

        {/* Desktop navigation — hidden on mobile where BottomNav is used */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User menu dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              menuOpen || pathname === '/profile' || pathname === '/achievements'
                ? 'bg-primary/10 text-primary'
                : 'text-muted hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </div>
            <span className="hidden font-medium sm:inline">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </span>
            <ChevronDown className={cn('hidden h-3.5 w-3.5 transition-transform sm:block', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-border bg-white py-1 shadow-lg">
              {userMenuItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
