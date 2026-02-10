'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_CONTENT_LENGTH = 2000;

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.length;
  const isValid = content.trim().length > 0 && charCount <= MAX_CONTENT_LENGTH;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string> = { content: content.trim() };
      if (imageUrl.trim()) {
        body.imageUrl = imageUrl.trim();
      }

      const result = await apiClient('/api/posts', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (result.success) {
        router.push('/community');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Create Post</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="rounded-xl bg-white shadow-sm">
        {/* Content textarea */}
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your fitness journey..."
            rows={6}
            maxLength={MAX_CONTENT_LENGTH}
            className="w-full resize-none text-sm text-gray-900 placeholder:text-muted focus:outline-none leading-relaxed"
            autoFocus
          />
        </div>

        {/* Character counter */}
        <div className="flex items-center justify-between px-4 pb-2">
          <span
            className={cn(
              'text-xs',
              charCount > MAX_CONTENT_LENGTH * 0.9
                ? charCount > MAX_CONTENT_LENGTH
                  ? 'text-red-500 font-medium'
                  : 'text-yellow-600'
                : 'text-muted'
            )}
          >
            {charCount}/{MAX_CONTENT_LENGTH}
          </span>
        </div>

        {/* Image URL input */}
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted" />
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="flex-1 text-sm text-gray-900 placeholder:text-muted focus:outline-none"
            />
          </div>
        </div>

        {/* Image preview */}
        {imageUrl.trim() && (
          <div className="px-4 pb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              className="max-h-48 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end border-t border-gray-100 px-4 py-3">
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors',
              isValid && !submitting
                ? 'bg-primary hover:bg-primary-dark'
                : 'bg-gray-300 cursor-not-allowed'
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
