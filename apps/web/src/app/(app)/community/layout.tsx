import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Connect with fellow fitness enthusiasts, share progress, and stay motivated.',
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
