import { z } from 'zod';

// Create a new post
export const createPostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(2000, 'Post content must be at most 2000 characters'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

// Create a comment on a post
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(500, 'Comment must be at most 500 characters'),
});

// Report a post
export const reportPostSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be at most 500 characters'),
});

// Type exports
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ReportPostInput = z.infer<typeof reportPostSchema>;
