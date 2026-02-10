'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { VideoCard, VideoCardSkeleton, type VideoCardData } from '@/components/video-card';
import { formatDuration, cn } from '@/lib/utils';
import {
  ArrowLeft,
  Play,
  Clock,
  Flame,
  Eye,
  CheckCircle,
  Loader2,
  Square,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoDetail {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  duration: number;
  difficulty: string;
  categoryId: string;
  equipmentNeeded?: string[] | null;
  caloriesBurned?: number | null;
  isPremium?: boolean;
  viewCount?: number;
  category: { name: string; slug: string };
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  BEGINNER: { label: 'Beginner', className: 'bg-green-100 text-green-700' },
  INTERMEDIATE: { label: 'Intermediate', className: 'bg-yellow-100 text-yellow-700' },
  ADVANCED: { label: 'Advanced', className: 'bg-red-100 text-red-700' },
};

type WorkoutState = 'idle' | 'starting' | 'active' | 'completing' | 'completed';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function VideoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [related, setRelated] = useState<VideoCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Workout session state
  const [workoutState, setWorkoutState] = useState<WorkoutState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [videoRes, relatedRes] = await Promise.allSettled([
          apiClient<VideoDetail>(`/api/workouts/videos/${id}`),
          apiClient<VideoCardData[]>(`/api/workouts/videos/${id}/related`),
        ]);

        if (videoRes.status === 'fulfilled' && videoRes.value.success && videoRes.value.data) {
          setVideo(videoRes.value.data);
        } else {
          setError('Video not found');
        }

        if (relatedRes.status === 'fulfilled' && relatedRes.value.success && relatedRes.value.data) {
          setRelated(relatedRes.value.data);
        }
      } catch {
        setError('Failed to load workout');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  // Timer
  useEffect(() => {
    if (workoutState === 'active') {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [workoutState]);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleStartWorkout = async () => {
    if (!video || workoutState !== 'idle') return;
    setWorkoutState('starting');
    try {
      const result = await apiClient<{ id: string }>('/api/workouts/sessions', {
        method: 'POST',
        body: JSON.stringify({
          videoId: video.id,
        }),
      });
      if (result.success && result.data) {
        setSessionId(result.data.id);
        setElapsed(0);
        setWorkoutState('active');
      } else {
        setWorkoutState('idle');
        setToastMessage('Failed to start session. Try again.');
      }
    } catch {
      setWorkoutState('idle');
      setToastMessage('Failed to start session. Try again.');
    }
  };

  const handleCompleteWorkout = useCallback(async () => {
    if (!sessionId || workoutState !== 'active') return;
    setWorkoutState('completing');

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const caloriesPerSecond = video?.caloriesBurned && video.duration
        ? video.caloriesBurned / video.duration
        : 0;
      const actualCalories = Math.round(caloriesPerSecond * elapsed);

      const result = await apiClient(`/api/workouts/sessions/${sessionId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          duration: elapsed,
          caloriesBurned: actualCalories || video?.caloriesBurned || 0,
        }),
      });
      if (result.success) {
        setWorkoutState('completed');
        setToastMessage('Workout completed! Great job!');
      } else {
        setWorkoutState('active');
        setToastMessage('Failed to complete session. Try again.');
      }
    } catch {
      setWorkoutState('active');
      setToastMessage('Failed to complete session. Try again.');
    }
  }, [sessionId, workoutState, elapsed, video]);

  const difficulty = video ? (difficultyConfig[video.difficulty] || difficultyConfig.BEGINNER) : null;

  if (loading) {
    return (
      <div>
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="aspect-video w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{error || 'Video not found'}</h2>
        <Link href="/workouts" className="mt-3 text-sm font-medium text-primary hover:underline">
          Back to Workouts
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-4 right-4 top-20 z-50 mx-auto max-w-md rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg sm:left-auto sm:right-6"
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <Link
        href="/workouts"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workouts
      </Link>

      {/* Video Player Placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl shadow-lg"
      >
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600" />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Play button */}
        <button className="absolute inset-0 flex items-center justify-center transition-transform hover:scale-110">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg sm:h-20 sm:w-20">
            <Play className="h-7 w-7 text-primary sm:h-8 sm:w-8" fill="currentColor" />
          </div>
        </button>
      </motion.div>

      {/* Title & Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{video.title}</h1>

        {/* Category link */}
        <Link
          href={`/workouts/category/${video.category.slug}`}
          className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
        >
          {video.category.name}
        </Link>

        {/* Info Row */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm">
            <Clock className="h-4 w-4 text-muted" />
            <span className="text-gray-700 dark:text-gray-300">{formatDuration(video.duration)}</span>
          </div>

          {difficulty && (
            <div className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm', difficulty.className)}>
              {difficulty.label}
            </div>
          )}

          {video.caloriesBurned && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-gray-700 dark:text-gray-300">{video.caloriesBurned} cal</span>
            </div>
          )}

          {video.viewCount !== undefined && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm">
              <Eye className="h-4 w-4 text-muted" />
              <span className="text-gray-700 dark:text-gray-300">{video.viewCount.toLocaleString()} views</span>
            </div>
          )}
        </div>

        {/* Description */}
        {video.description && (
          <div className="mt-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">About this workout</h3>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{video.description}</p>
          </div>
        )}

        {/* Equipment Needed */}
        {video.equipmentNeeded && video.equipmentNeeded.length > 0 && (
          <div className="mt-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Equipment Needed</h3>
            <div className="flex flex-wrap gap-2">
              {video.equipmentNeeded.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Workout Session Controls */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {/* IDLE — Start Workout */}
            {workoutState === 'idle' && (
              <motion.button
                key="start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleStartWorkout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/25 sm:w-auto"
              >
                <Play className="h-5 w-5" fill="currentColor" />
                Start Workout
              </motion.button>
            )}

            {/* STARTING — Loading */}
            {workoutState === 'starting' && (
              <motion.button
                key="starting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/80 px-6 py-4 text-base font-semibold text-white cursor-wait sm:w-auto"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting...
              </motion.button>
            )}

            {/* ACTIVE — Workout In Progress */}
            {workoutState === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 p-5"
              >
                {/* Status */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                  </span>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Workout In Progress</span>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Timer className="h-6 w-6 text-primary" />
                  <span className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white tracking-tight">
                    {formatElapsed(elapsed)}
                  </span>
                </div>

                {/* Motivational Text */}
                <p className="text-center text-sm text-muted mb-5">
                  {elapsed < 60
                    ? 'You got this! Keep pushing!'
                    : elapsed < 300
                      ? 'Great pace! Stay focused!'
                      : elapsed < 600
                        ? 'Halfway there! Stay strong!'
                        : elapsed < 1200
                          ? 'Amazing endurance! Keep it up!'
                          : 'You\'re unstoppable! Incredible work!'}
                </p>

                {/* Complete Button */}
                <button
                  onClick={handleCompleteWorkout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-base font-semibold text-white transition-all hover:bg-green-700 active:scale-[0.98] shadow-lg"
                >
                  <Square className="h-5 w-5" fill="currentColor" />
                  Complete Workout
                </button>
              </motion.div>
            )}

            {/* COMPLETING — Loading */}
            {workoutState === 'completing' && (
              <motion.div
                key="completing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 p-5"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Timer className="h-6 w-6 text-primary" />
                  <span className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white tracking-tight">
                    {formatElapsed(elapsed)}
                  </span>
                </div>
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600/70 px-6 py-4 text-base font-semibold text-white cursor-wait"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Finishing Up...
                </button>
              </motion.div>
            )}

            {/* COMPLETED — Done */}
            {workoutState === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-5 text-center"
              >
                <div className="mb-3 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Workout Complete!</h3>
                <p className="mt-1 text-sm text-muted">
                  Duration: {formatElapsed(elapsed)} &middot; Great work!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Related Videos */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Related Workouts</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
