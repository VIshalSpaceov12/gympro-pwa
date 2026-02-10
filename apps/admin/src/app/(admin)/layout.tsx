'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Play,
  MessageSquare,
  ShoppingBag,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/stores/auth.store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Categories', href: '/categories', icon: FolderOpen },
  { name: 'Videos', href: '/videos', icon: Play },
  { name: 'Community', href: '/community', icon: MessageSquare },
  { name: 'Products', href: '/products', icon: ShoppingBag },
  { name: 'Product Categories', href: '/product-categories', icon: Tag },
  { name: 'Settings', href: '#', icon: Settings },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'User Management',
  '/categories': 'Categories',
  '/videos': 'Videos',
  '/community': 'Community Moderation',
  '/products': 'Product Management',
  '/product-categories': 'Product Categories',
  '/settings': 'Settings',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const pageTitle = pageTitles[pathname] || 'Admin';

  const sidebarContent = (
    <>
      {/* Logo / brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="flex-shrink-0 w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-base leading-tight">GymProLuxe</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/20 rounded px-1.5 py-0.5 self-start mt-0.5">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Admin navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info and logout */}
      <div className="border-t border-gray-700 px-3 py-4 space-y-3">
        {user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar flex flex-col transition-transform duration-200 lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Mobile close button */}
          <button
            className="absolute top-4 right-3 lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>

          {sidebarContent}
        </aside>

        {/* Main content */}
        <div className="lg:ml-64">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="flex items-center h-16 px-4 lg:px-8">
              <button
                className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
