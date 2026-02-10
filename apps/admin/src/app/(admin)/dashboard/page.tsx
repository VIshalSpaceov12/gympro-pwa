'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  Users,
  Play,
  FolderOpen,
  Eye,
  Loader2,
  Clock,
  Tag,
  BarChart3,
  UserPlus,
  MessageSquare,
  Activity,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@gympro/shared';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  videoCount: number;
}

interface Video {
  id: string;
  title: string;
  duration: number;
  difficulty: Difficulty;
  isPublished: boolean;
  isPremium: boolean;
  viewCount?: number;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface PaginatedVideos {
  data: Video[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalPosts: number;
  totalWorkoutSessions: number;
  totalProducts: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const difficultyColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
  ADVANCED: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catResult, vidResult, statsResult] = await Promise.all([
          apiClient<Category[]>('/api/workouts/categories'),
          apiClient<PaginatedVideos>('/api/workouts/videos?page=1&limit=5'),
          apiClient<AdminStats>('/api/auth/admin/stats').catch(() => ({ success: false, data: undefined })),
        ]);

        if (catResult.success && catResult.data) {
          setCategories(catResult.data);
        }
        if (vidResult.success && vidResult.data) {
          setVideos(vidResult.data.data);
          setTotalVideos(vidResult.data.total);
        }
        if (statsResult.success && statsResult.data) {
          setAdminStats(statsResult.data);
        }
      } catch {
        // silently handle - data just won't load
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalCategoryVideos = categories.reduce((sum, c) => sum + c.videoCount, 0);
  const maxVideoCount = Math.max(...categories.map((c) => c.videoCount), 1);

  const stats = [
    {
      label: 'Total Users',
      value: adminStats?.totalUsers ?? '\u2014',
      icon: Users,
      color: 'border-l-blue-500',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Total Videos',
      value: totalVideos || totalCategoryVideos,
      icon: Play,
      color: 'border-l-green-500',
      iconBg: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Categories',
      value: categories.length,
      icon: FolderOpen,
      color: 'border-l-purple-500',
      iconBg: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Workout Sessions',
      value: adminStats?.totalWorkoutSessions ?? '\u2014',
      icon: Activity,
      color: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 p-5',
              stat.color
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', stat.iconBg)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Growth & Content Stats */}
      {adminStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">New This Week</p>
                <p className="text-xl font-bold text-gray-900">{adminStats.newUsersThisWeek}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {adminStats.activeUsers} of {adminStats.totalUsers} users active
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-pink-100 text-pink-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Community Posts</p>
                <p className="text-xl font-bold text-gray-900">{adminStats.totalPosts}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">Total posts created</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Products</p>
                <p className="text-xl font-bold text-gray-900">{adminStats.totalProducts}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">Total products in shop</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Videos */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              Recent Videos
            </h2>
          </div>
          <div className="overflow-x-auto">
            {videos.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-500">
                No videos yet. Add your first video to get started.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Difficulty</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Duration</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        {video.title}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {video.category?.name || '\u2014'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                            difficultyColors[video.difficulty] || 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {video.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(video.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                            video.isPublished
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {video.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Categories Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Categories Overview
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No categories yet.
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    <span className="text-xs text-gray-500">
                      {category.videoCount} video{category.videoCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{
                        width: `${(category.videoCount / maxVideoCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
