'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Flame } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

export interface VideoCardData {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  duration: number;
  difficulty: string;
  isPremium?: boolean;
  caloriesBurned?: number | null;
  category?: { name: string; slug?: string } | null;
}

interface VideoCardProps {
  video: VideoCardData;
  className?: string;
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  BEGINNER: { label: 'Beginner', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INTERMEDIATE: { label: 'Intermediate', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  ADVANCED: { label: 'Advanced', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function VideoCard({ video, className }: VideoCardProps) {
  const difficulty = difficultyConfig[video.difficulty] || difficultyConfig.BEGINNER;

  return (
    <Link
      href={`/workouts/${video.id}`}
      className={cn(
        'group block overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-400 to-purple-500" />
        )}

        {/* Duration badge - top right */}
        <div className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.duration)}
        </div>

        {/* Premium badge - top left */}
        {video.isPremium && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
            <Star className="h-3 w-3" />
            PRO
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Difficulty badge */}
        <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', difficulty.className)}>
          {difficulty.label}
        </span>

        {/* Title */}
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
          {video.title}
        </h3>

        {/* Category + Calories */}
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          {video.category && <span>{video.category.name}</span>}
          {video.caloriesBurned && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {video.caloriesBurned} cal
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm">
      <div className="aspect-video w-full animate-pulse bg-gray-200 dark:bg-gray-700" />
      <div className="p-3">
        <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-1 h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 flex justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}
