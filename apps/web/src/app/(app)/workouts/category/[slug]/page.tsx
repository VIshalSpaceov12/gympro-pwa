'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { VideoCard, VideoCardSkeleton, type VideoCardData } from '@/components/video-card';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  videos: VideoCardData[];
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCategory() {
      setLoading(true);
      setError('');
      try {
        const result = await apiClient<CategoryDetail>(`/api/workouts/categories/${slug}`);
        if (result.success && result.data) {
          setCategory(result.data);
        } else {
          setError('Category not found');
        }
      } catch {
        setError('Failed to load category');
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchCategory();
  }, [slug]);

  return (
    <div>
      {/* Back button */}
      <Link
        href="/workouts"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workouts
      </Link>

      {/* Header */}
      {loading ? (
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ) : category ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-sm text-muted">{category.description}</p>
          )}
          <p className="mt-1 text-xs text-muted">{category.videos.length} workouts</p>
        </motion.div>
      ) : null}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm dark:bg-gray-900">
          <Dumbbell className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{error}</h3>
          <Link href="/workouts" className="mt-3 text-sm font-medium text-primary hover:underline">
            Browse all workouts
          </Link>
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : category && category.videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : category && category.videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm dark:bg-gray-900">
          <Dumbbell className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No workouts yet</h3>
          <p className="mt-1 text-sm text-muted">
            This category doesn&apos;t have any workouts yet. Check back soon!
          </p>
        </div>
      ) : null}
    </div>
  );
}
