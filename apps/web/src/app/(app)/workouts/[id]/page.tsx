'use client';

import { useEffect, useState } from 'react';
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
  Star,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function VideoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [related, setRelated] = useState<VideoCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleStartWorkout = async () => {
    if (!video || sessionLoading || sessionStarted) return;
    setSessionLoading(true);
    try {
      const result = await apiClient('/api/workouts/sessions', {
        method: 'POST',
        body: JSON.stringify({
          videoId: video.id,
          duration: video.duration,
          caloriesBurned: video.caloriesBurned || 0,
        }),
      });
      if (result.success) {
        setSessionStarted(true);
        setToastMessage('Workout session started! Great job!');
      } else {
        setToastMessage('Failed to start session. Try again.');
      }
    } catch {
      setToastMessage('Failed to start session. Try again.');
    } finally {
      setSessionLoading(false);
    }
  };

  const difficulty = video ? (difficultyConfig[video.difficulty] || difficultyConfig.BEGINNER) : null;

  if (loading) {
    return (
      <div>
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="aspect-video w-full animate-pulse rounded-xl bg-gray-200" />
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-lg font-semibold text-gray-900">{error || 'Video not found'}</h2>
        <Link href="/workouts" className="mt-3 text-sm font-medium text-primary hover:underline">
          Back to Workouts
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
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
        {/* Premium badge */}
        {video.isPremium && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-sm font-medium text-white">
            <Star className="h-4 w-4" />
            Premium
          </div>
        )}
      </motion.div>

      {/* Title & Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{video.title}</h1>

        {/* Category link */}
        <Link
          href={`/workouts/category/${video.category.slug}`}
          className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
        >
          {video.category.name}
        </Link>

        {/* Info Row */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
            <Clock className="h-4 w-4 text-muted" />
            <span className="text-gray-700">{formatDuration(video.duration)}</span>
          </div>

          {difficulty && (
            <div className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm', difficulty.className)}>
              {difficulty.label}
            </div>
          )}

          {video.caloriesBurned && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-gray-700">{video.caloriesBurned} cal</span>
            </div>
          )}

          {video.viewCount !== undefined && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <Eye className="h-4 w-4 text-muted" />
              <span className="text-gray-700">{video.viewCount.toLocaleString()} views</span>
            </div>
          )}
        </div>

        {/* Description */}
        {video.description && (
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">About this workout</h3>
            <p className="text-sm leading-relaxed text-gray-600">{video.description}</p>
          </div>
        )}

        {/* Equipment Needed */}
        {video.equipmentNeeded && video.equipmentNeeded.length > 0 && (
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Equipment Needed</h3>
            <div className="flex flex-wrap gap-2">
              {video.equipmentNeeded.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Start Workout Button */}
        <button
          onClick={handleStartWorkout}
          disabled={sessionLoading || sessionStarted}
          className={cn(
            'mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all sm:w-auto',
            sessionStarted
              ? 'cursor-not-allowed bg-green-500 text-white'
              : sessionLoading
                ? 'cursor-wait bg-primary/80 text-white'
                : 'bg-primary text-white hover:bg-primary-dark active:scale-[0.98] shadow-lg shadow-primary/25'
          )}
        >
          {sessionLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Starting...
            </>
          ) : sessionStarted ? (
            <>
              <CheckCircle className="h-5 w-5" />
              Workout Started
            </>
          ) : (
            <>
              <Play className="h-5 w-5" fill="currentColor" />
              Start Workout
            </>
          )}
        </button>
      </motion.div>

      {/* Related Videos */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Related Workouts</h2>
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
