import { z } from 'zod';

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
});

// Video schemas
export const createVideoSchema = z.object({
  title: z.string().min(1, 'Video title is required').max(200),
  description: z.string().max(2000).optional(),
  videoUrl: z.string().url('Invalid video URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
  duration: z.number().int().positive('Duration must be a positive integer (seconds)'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  categoryId: z.string().uuid('Invalid category ID'),
  trainerId: z.string().uuid('Invalid trainer ID').optional(),
  equipmentNeeded: z.array(z.string()).optional(),
  caloriesBurned: z.number().int().positive().optional(),
  isPremium: z.boolean().optional().default(false),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  videoUrl: z.string().url('Invalid video URL').optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional().nullable(),
  duration: z.number().int().positive().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  trainerId: z.string().uuid('Invalid trainer ID').optional().nullable(),
  equipmentNeeded: z.array(z.string()).optional().nullable(),
  caloriesBurned: z.number().int().positive().optional().nullable(),
  isPremium: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

// Session schemas
export const createSessionSchema = z.object({
  videoId: z.string().uuid('Invalid video ID').optional(),
  customWorkoutId: z.string().uuid('Invalid custom workout ID').optional(),
  duration: z.number().int().positive().optional(),
  caloriesBurned: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

// Video query schema (for filtering/pagination from query params)
export const videoQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  isPremium: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type VideoQueryInput = z.infer<typeof videoQuerySchema>;
