import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workouts',
  description: 'Browse professional workout videos across strength, cardio, yoga, HIIT, and more.',
};

export default function WorkoutsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
