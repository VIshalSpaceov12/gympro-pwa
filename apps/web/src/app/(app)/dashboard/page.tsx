'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api';
import { VideoCard, VideoCardSkeleton, type VideoCardData } from '@/components/video-card';
import { Dumbbell, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { motion } from 'framer-motion';

interface WorkoutHistory {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  sortOrder: number;
  videoCount: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<WorkoutHistory>({ totalWorkouts: 0, totalDuration: 0, totalCalories: 0 });
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [historyRes, videosRes, categoriesRes] = await Promise.allSettled([
          apiClient<WorkoutHistory>('/api/workouts/history'),
          apiClient<{ data: VideoCardData[]; total: number }>('/api/workouts/videos?limit=4'),
          apiClient<Category[]>('/api/workouts/categories'),
        ]);

        if (historyRes.status === 'fulfilled' && historyRes.value.success && historyRes.value.data) {
          setHistory(historyRes.value.data);
        }
        if (videosRes.status === 'fulfilled' && videosRes.value.success && videosRes.value.data) {
          setVideos(videosRes.value.data.data);
        }
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success && categoriesRes.value.data) {
          setCategories(categoriesRes.value.data);
        }
      } catch {
        // Silently handle errors; stats show 0, sections show empty
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const stats = [
    {
      label: 'Total Workouts',
      value: history.totalWorkouts.toString(),
      icon: Dumbbell,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-primary',
    },
    {
      label: 'Total Duration',
      value: formatDuration(history.totalDuration),
      icon: Clock,
      iconBg: 'bg-pink-100',
      iconColor: 'text-secondary',
    },
    {
      label: 'Calories Burned',
      value: history.totalCalories.toLocaleString(),
      icon: TrendingUp,
      iconBg: 'bg-amber-100',
      iconColor: 'text-accent',
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ready to crush your fitness goals today?
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="mt-2 h-6 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))
          : stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Continue Training */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Continue Training</h2>
          <Link
            href="/workouts"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
            <Dumbbell className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-muted">No workouts available yet. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Browse Categories */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Browse Categories</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/workouts/category/${category.slug}`}
                className="group relative overflow-hidden rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              >
                <div className="relative aspect-[4/3] w-full">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                  )}
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-bold text-white">{category.name}</h3>
                    <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                      {category.videoCount} videos
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
            <p className="text-sm text-muted">No categories available yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
