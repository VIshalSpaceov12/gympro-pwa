import { z } from 'zod';

// Activity type enum matching Prisma
const activityTypeEnum = z.enum(['STEPS', 'WORKOUT', 'CALORIES_BURNED', 'WATER']);

// Create activity log
export const createActivityLogSchema = z.object({
  type: activityTypeEnum,
  value: z.number().positive('Value must be a positive number'),
  unit: z.string().max(50).optional(),
  date: z.string().datetime().optional(), // ISO date string, defaults to today on server
});

// Type exports
export type CreateActivityLogInput = z.infer<typeof createActivityLogSchema>;
export type ActivityTypeEnum = z.infer<typeof activityTypeEnum>;
