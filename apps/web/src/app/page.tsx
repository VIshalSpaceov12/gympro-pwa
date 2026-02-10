export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-center text-white p-8">
        <h1 className="text-6xl font-bold mb-4">GymProLuxe</h1>
        <p className="text-xl opacity-90 mb-8">Your Fitness Journey Starts Here</p>
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          PWA is running
        </div>
      </div>
    </main>
  );
}
