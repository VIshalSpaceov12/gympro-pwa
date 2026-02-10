import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse premium fitness gear, supplements, and accessories at GymProLuxe.',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
