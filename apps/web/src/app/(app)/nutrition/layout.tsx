import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nutrition',
  description: 'Track your meals, plan nutrition, and monitor your macros for optimal performance.',
};

export default function NutritionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
