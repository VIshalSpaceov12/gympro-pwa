'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Dumbbell, Plus, Loader2, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomWorkoutItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  exerciseCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedCustomWorkouts {
  data: CustomWorkoutItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MyWorkoutsPage() {
  const [workouts, setWorkouts] = useState<CustomWorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient<PaginatedCustomWorkouts>('/api/custom-workouts?limit=50');
      if (result.success && result.data) {
        setWorkouts(result.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">My Workouts</h1>
          <p className="mt-1 text-sm text-muted">
            {workouts.length > 0
              ? `${workouts.length} custom workout${workouts.length !== 1 ? 's' : ''}`
              : 'Create your own workout routines'}
          </p>
        </div>
        <Link
          href="/my-workouts/create"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Workout</span>
          <span className="sm:hidden">New</span>
        </Link>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted">Loading your workouts...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-white dark:bg-gray-900 p-8 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchWorkouts}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      ) : workouts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout, index) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                href={`/my-workouts/${workout.id}`}
                className="group block rounded-xl bg-white dark:bg-gray-900 p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                      {workout.name}
                    </h3>
                    {workout.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {workout.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="ml-2 h-5 w-5 flex-shrink-0 text-gray-300 transition-colors group-hover:text-primary" />
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(workout.createdAt).toLocaleDateString()}
                  </span>
                  {workout.isPublic && (
                    <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      Public
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 py-16 shadow-sm">
          <Dumbbell className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No custom workouts yet</h3>
          <p className="mt-1 text-sm text-muted">
            Create your first custom workout routine
          </p>
          <Link
            href="/my-workouts/create"
            className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Create Workout
          </Link>
        </div>
      )}
    </div>
  );
}
