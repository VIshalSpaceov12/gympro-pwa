'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import {
  Heart,
  MessageCircle,
  Plus,
  Loader2,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: PostUser;
  hasLiked: boolean;
}

interface PaginatedPosts {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

function UserAvatar({ user, size = 'md' }: { user: PostUser; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  if (user.avatarUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={user.avatarUrl}
        alt={`${user.firstName} ${user.lastName}`}
        className={cn(sizeClass, 'rounded-full object-cover')}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        'rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold'
      )}
    >
      {initials}
    </div>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await apiClient<PaginatedPosts>(
        `/api/posts?page=${pageNum}&limit=10`
      );
      if (result.success && result.data) {
        if (append) {
          setPosts((prev) => [...prev, ...result.data!.data]);
        } else {
          setPosts(result.data.data);
        }
        setTotalPages(result.data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handleLike = async (postId: string) => {
    if (likingPosts.has(postId)) return;

    setLikingPosts((prev) => new Set(prev).add(postId));

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            hasLiked: !p.hasLiked,
            likesCount: p.hasLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        }
        return p;
      })
    );

    try {
      await apiClient(`/api/posts/${postId}/like`, { method: 'POST' });
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked: !p.hasLiked,
              likesCount: p.hasLiked ? p.likesCount - 1 : p.likesCount + 1,
            };
          }
          return p;
        })
      );
    } finally {
      setLikingPosts((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiClient(`/api/posts/${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Community</h1>
        <p className="mt-1 text-sm text-muted">
          Share your fitness journey with the community
        </p>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <MessageSquare className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No posts yet</h3>
          <p className="mt-1 text-sm text-muted">
            Be the first to share with the community!
          </p>
          <button
            onClick={() => router.push('/community/create')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl bg-white shadow-sm overflow-hidden"
            >
              {/* Post header */}
              <div className="flex items-center justify-between px-4 pt-4">
                <div className="flex items-center gap-3">
                  <UserAvatar user={post.user} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {post.user.firstName} {post.user.lastName}
                    </p>
                    <p className="text-xs text-muted">{timeAgo(post.createdAt)}</p>
                  </div>
                </div>

                {user && post.user.id === user.id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Post content */}
              <div
                className="px-4 py-3 cursor-pointer"
                onClick={() => router.push(`/community/${post.id}`)}
              >
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Post image */}
              {post.imageUrl && (
                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="w-full max-h-96 object-cover"
                  />
                </div>
              )}

              {/* Post actions */}
              <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => handleLike(post.id)}
                  className={cn(
                    'flex items-center gap-1.5 text-sm transition-colors',
                    post.hasLiked
                      ? 'text-red-500'
                      : 'text-muted hover:text-red-500'
                  )}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      post.hasLiked && 'fill-red-500'
                    )}
                  />
                  <span className="font-medium">{post.likesCount}</span>
                </button>

                <button
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">{post.commentsCount}</span>
                </button>
              </div>
            </div>
          ))}

          {/* Load More */}
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/community/create')}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-colors sm:bottom-8 sm:right-8"
        title="Create Post"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
