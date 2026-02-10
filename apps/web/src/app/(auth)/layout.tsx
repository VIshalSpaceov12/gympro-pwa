export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">GymProLuxe</h1>
          <p className="text-white/80 mt-2 text-sm">Your Fitness Journey Starts Here</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
