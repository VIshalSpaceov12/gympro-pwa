'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  Loader2,
  X,
  Eye,
  EyeOff,
  Trash2,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  isPublished: boolean;
  createdAt: string;
  user: PostUser;
  _count: {
    comments: number;
    likes: number;
  };
}

interface PaginatedPosts {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedComments {
  data: PostComment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Hidden', value: 'hidden' },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function CommunityModerationPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');

  // Success/error messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Comments modal
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        filter,
      });
      const result = await apiClient<PaginatedPosts>(`/api/posts/admin/all?${params}`);
      if (result.success && result.data) {
        setPosts(result.data.data);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleToggleVisibility = async (post: Post) => {
    try {
      await apiClient(`/api/posts/${post.id}/visibility`, { method: 'PATCH' });
      setSuccessMsg(post.isPublished ? 'Post hidden successfully.' : 'Post published successfully.');
      await fetchPosts();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update post.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient(`/api/posts/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setSuccessMsg('Post deleted successfully.');
      await fetchPosts();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete post.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewComments = async (post: Post) => {
    setCommentsPost(post);
    setLoadingComments(true);
    try {
      const result = await apiClient<PaginatedComments>(
        `/api/posts/${post.id}/comments?limit=50`
      );
      if (result.success && result.data) {
        setComments(result.data.data);
      }
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiClient(`/api/posts/comments/${commentId}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setSuccessMsg('Comment deleted.');
      // Refresh posts to update comment counts
      await fetchPosts();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete comment.');
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
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{total} posts total</p>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors border',
              filter === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No posts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Content</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    <Heart className="h-4 w-4 inline" />
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    <MessageCircle className="h-4 w-4 inline" />
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-[140px]">
                          {post.user.firstName} {post.user.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">
                          {post.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 truncate max-w-[300px]">{post.content}</p>
                      {post.imageUrl && (
                        <span className="text-xs text-blue-500 mt-0.5 block">Has image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{post.likesCount}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewComments(post)}
                        className="text-primary hover:text-primary-dark font-medium"
                        title="View comments"
                      >
                        {post.commentsCount}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                          post.isPublished
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {post.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {timeAgo(post.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleVisibility(post)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            post.isPublished
                              ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          )}
                          title={post.isPublished ? 'Hide post' : 'Show post'}
                        >
                          {post.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(post)}
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

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Are you sure you want to delete the post by ${deleteTarget?.user.firstName} ${deleteTarget?.user.lastName}? This will also delete all comments and likes. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />

      {/* Comments modal */}
      {commentsPost && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCommentsPost(null);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Comments on post by {commentsPost.user.firstName} {commentsPost.user.lastName}
              </h3>
              <button
                onClick={() => setCommentsPost(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Original post content preview */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 line-clamp-3">{commentsPost.content}</p>
              </div>

              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No comments on this post.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.user.firstName} {comment.user.lastName}
                          </p>
                          <span className="text-xs text-gray-400">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setCommentsPost(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
