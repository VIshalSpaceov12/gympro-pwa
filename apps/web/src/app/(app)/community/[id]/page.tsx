'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
}

interface PostDetail {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: PostUser;
  comments: Comment[];
  hasLiked: boolean;
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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient<PostDetail>(`/api/posts/${postId}`);
      if (result.success && result.data) {
        setPost(result.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    if (!post || liking) return;
    setLiking(true);

    // Optimistic update
    setPost((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasLiked: !prev.hasLiked,
        likesCount: prev.hasLiked ? prev.likesCount - 1 : prev.likesCount + 1,
      };
    });

    try {
      await apiClient(`/api/posts/${postId}/like`, { method: 'POST' });
    } catch {
      // Revert
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasLiked: !prev.hasLiked,
          likesCount: prev.hasLiked ? prev.likesCount - 1 : prev.likesCount + 1,
        };
      });
    } finally {
      setLiking(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const result = await apiClient<Comment>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (result.success && result.data) {
        setPost((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [...prev.comments, result.data!],
            commentsCount: prev.commentsCount + 1,
          };
        });
        setCommentText('');
      }
    } catch {
      // ignore
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await apiClient(`/api/posts/comments/${commentId}`, { method: 'DELETE' });
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.filter((c) => c.id !== commentId),
          commentsCount: prev.commentsCount - 1,
        };
      });
    } catch {
      // ignore
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiClient(`/api/posts/${postId}`, { method: 'DELETE' });
      router.push('/community');
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Post not found</p>
        <button
          onClick={() => router.push('/community')}
          className="mt-4 text-sm text-primary hover:text-primary-dark font-medium"
        >
          Back to Community
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Header */}
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Post</h1>
      </div>

      {/* Post */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
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

          {user && post.userId === user.id && (
            <button
              onClick={handleDeletePost}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Post content */}
        <div className="px-4 py-3">
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Post image */}
        {post.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={post.imageUrl}
            alt="Post image"
            className="w-full max-h-96 object-cover"
          />
        )}

        {/* Post actions */}
        <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleLike}
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

          <div className="flex items-center gap-1.5 text-sm text-muted">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">{post.commentsCount}</span>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Comments ({post.commentsCount})
        </h2>

        {post.comments.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 rounded-lg bg-white p-3 shadow-sm"
              >
                <UserAvatar user={comment.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {comment.user.firstName} {comment.user.lastName}
                      </p>
                      <span className="text-xs text-muted">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>

                    {user && comment.user.id === user.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky comment input */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-gray-200 bg-white px-4 py-3 sm:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            className="flex-1 rounded-full border border-border bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || submittingComment}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
              commentText.trim() && !submittingComment
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-gray-100 text-gray-400'
            )}
          >
            {submittingComment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
