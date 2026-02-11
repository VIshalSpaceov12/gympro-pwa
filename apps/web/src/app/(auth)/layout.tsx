import { ConfettiBackground } from '@/components/confetti-background';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-4 relative overflow-hidden">
      <ConfettiBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">GymProLuxe</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Your Fitness Journey Starts Here</p>
        </div>
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
}
