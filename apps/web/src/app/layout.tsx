import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'GymProLuxe - Your Fitness Journey',
    template: '%s | GymProLuxe',
  },
  description: 'Professional workout videos, custom training plans, nutrition tracking, and community support.',
  keywords: ['fitness', 'workout', 'gym', 'training', 'nutrition', 'health', 'exercise', 'PWA'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'GymProLuxe - Your Fitness Journey',
    description: 'Professional workout videos, custom training plans, nutrition tracking, and community support.',
    type: 'website',
    siteName: 'GymProLuxe',
    locale: 'en_US',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GymProLuxe',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}
