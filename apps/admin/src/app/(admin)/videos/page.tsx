'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@gympro/shared';

interface Category {
  id: string;
  name: string;
  videoCount: number;
}

interface Video {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration: number;
  difficulty: Difficulty;
  isPublished: boolean;
  isPremium: boolean;
  equipmentNeeded?: string[];
  caloriesBurned?: number | null;
  viewCount?: number;
  categoryId: string;
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

interface VideoFormData {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  categoryId: string;
  difficulty: Difficulty;
  duration: string;
  caloriesBurned: string;
  equipmentNeeded: string;
  isPremium: boolean;
  isPublished: boolean;
}

const emptyForm: VideoFormData = {
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  categoryId: '',
  difficulty: 'BEGINNER',
  duration: '',
  caloriesBurned: '',
  equipmentNeeded: '',
  isPremium: false,
  isPublished: true,
};

const difficulties: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const difficultyColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
  ADVANCED: 'bg-red-100 text-red-700',
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VideosPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VideoFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const result = await apiClient<Category[]>('/api/workouts/categories');
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      // Filters would be appended here when API supports them
      const result = await apiClient<PaginatedVideos>(`/api/workouts/videos?${params}`);
      if (result.success && result.data) {
        let filtered = result.data.data;
        // Client-side filter if API doesn't support query params for filter
        if (filterCategory) {
          filtered = filtered.filter((v) => v.categoryId === filterCategory);
        }
        if (filterDifficulty) {
          filtered = filtered.filter((v) => v.difficulty === filterDifficulty);
        }
        setVideos(filtered);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterDifficulty]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (video: Video) => {
    setEditingId(video.id);
    setFormData({
      title: video.title,
      description: video.description || '',
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || '',
      categoryId: video.categoryId,
      difficulty: video.difficulty,
      duration: video.duration.toString(),
      caloriesBurned: video.caloriesBurned?.toString() || '',
      equipmentNeeded: video.equipmentNeeded?.join(', ') || '',
      isPremium: video.isPremium,
      isPublished: video.isPublished,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!formData.videoUrl.trim()) {
      setFormError('Video URL is required.');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Please select a category.');
      return;
    }
    if (!formData.duration || isNaN(Number(formData.duration))) {
      setFormError('Please enter a valid duration in seconds.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = {
        title: formData.title.trim(),
        videoUrl: formData.videoUrl.trim(),
        categoryId: formData.categoryId,
        difficulty: formData.difficulty,
        duration: parseInt(formData.duration, 10),
        isPremium: formData.isPremium,
        isPublished: formData.isPublished,
      };

      if (formData.description.trim()) body.description = formData.description.trim();
      if (formData.thumbnailUrl.trim()) body.thumbnailUrl = formData.thumbnailUrl.trim();
      if (formData.caloriesBurned && !isNaN(Number(formData.caloriesBurned))) {
        body.caloriesBurned = parseInt(formData.caloriesBurned, 10);
      }
      if (formData.equipmentNeeded.trim()) {
        body.equipmentNeeded = formData.equipmentNeeded
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (editingId) {
        await apiClient(`/api/workouts/videos/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setSuccessMsg('Video updated successfully.');
      } else {
        await apiClient('/api/workouts/videos', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setSuccessMsg('Video created successfully.');
      }

      closeForm();
      await fetchVideos();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save video.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient(`/api/workouts/videos/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setDeleteTarget(null);
      setSuccessMsg('Video deleted successfully.');
      await fetchVideos();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete video.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error message */}
      {formError && !formOpen && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {formError}
          <button onClick={() => setFormError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{total} videos total</p>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm min-h-[40px] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Video
        </button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filter:</span>
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => {
            setFilterDifficulty(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
        >
          <option value="">All Difficulties</option>
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Video Form Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Video' : 'Add Video'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Full Body HIIT Workout"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this workout video..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                {/* Video URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Video URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Thumbnail URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value as Difficulty })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  >
                    {difficulties.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (seconds) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 1800"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Calories Burned */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    value={formData.caloriesBurned}
                    onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })}
                    placeholder="e.g., 350"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Equipment Needed */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Equipment Needed
                  </label>
                  <input
                    type="text"
                    value={formData.equipmentNeeded}
                    onChange={(e) => setFormData({ ...formData, equipmentNeeded: e.target.value })}
                    placeholder="Dumbbells, Resistance band, Mat (comma-separated)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate items with commas</p>
                </div>

                {/* Toggles */}
                <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                    />
                    <span className="text-sm text-gray-700">Premium content</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) =>
                        setFormData({ ...formData, isPublished: e.target.checked })
                      }
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                    />
                    <span className="text-sm text-gray-700">Published</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 min-h-[40px]"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Videos table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Play className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No videos found.</p>
            <button
              onClick={openAddForm}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              Add your first video
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Video</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Difficulty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Duration</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Premium</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Published</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {video.thumbnailUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-12 h-8 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Play className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 truncate max-w-[180px]">
                          {video.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {video.category?.name || '\u2014'}
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
                    <td className="px-4 py-3 text-gray-600">{formatDuration(video.duration)}</td>
                    <td className="px-4 py-3 text-center">
                      {video.isPremium ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Premium
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex w-2.5 h-2.5 rounded-full',
                          video.isPublished ? 'bg-green-500' : 'bg-gray-300'
                        )}
                        title={video.isPublished ? 'Published' : 'Draft'}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(video)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(video)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Video"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
