'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { VideoCard, VideoCardSkeleton, type VideoCardData } from '@/components/video-card';
import { Search, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const difficulties = [
  { label: 'All', value: '' },
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

interface PaginatedVideos {
  data: VideoCardData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function WorkoutsPage() {
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVideos = useCallback(async (searchQuery: string, diff: string, pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (diff) params.set('difficulty', diff);
      params.set('page', String(pageNum));
      params.set('limit', '12');

      const result = await apiClient<PaginatedVideos>(`/api/workouts/videos?${params.toString()}`);
      if (result.success && result.data) {
        setVideos(result.data.data);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
      }
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(debouncedSearch, difficulty, page);
  }, [debouncedSearch, difficulty, page, fetchVideos]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const handleDifficultyChange = (diff: string) => {
    setDifficulty(diff);
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Workout Library</h1>
        <p className="mt-1 text-sm text-muted">
          {total > 0 ? `${total} workouts available` : 'Discover workouts for every level'}
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search workouts..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Difficulty Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {difficulties.map((diff) => (
          <button
            key={diff.value}
            onClick={() => handleDifficultyChange(diff.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              difficulty === diff.value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            )}
          >
            {diff.label}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Dumbbell className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No workouts found</h3>
          <p className="mt-1 text-sm text-muted">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              page <= 1
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              page >= totalPages
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
