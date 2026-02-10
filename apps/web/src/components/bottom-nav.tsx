'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Dumbbell, Activity, Apple, MessageSquare, Trophy, Award, User, LogOut, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/nutrition', label: 'Nutrition', icon: Apple },
  { href: '/community', label: 'Community', icon: MessageSquare },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
];

const userMenuItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/achievements', label: 'Achievements', icon: Award },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isUserPage = pathname === '/profile' || pathname.startsWith('/profile/') ||
    pathname === '/achievements' || pathname.startsWith('/achievements/');

  // Close on outside click
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

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white sm:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href !== '#' &&
            (pathname === item.href || pathname.startsWith(item.href + '/'));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className={cn('font-medium', isActive && 'text-primary')}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* User menu tab */}
        <div className="relative flex-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'flex w-full flex-col items-center gap-1 py-2 text-xs transition-colors',
              isUserPage || menuOpen ? 'text-primary' : 'text-muted'
            )}
          >
            <div className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
              isUserPage || menuOpen ? 'bg-primary' : 'bg-muted'
            )}>
              {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </div>
            <span className={cn('font-medium', (isUserPage || menuOpen) && 'text-primary')}>
              Me
            </span>
          </button>

          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-border bg-white py-1 shadow-lg">
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
    </nav>
  );
}
