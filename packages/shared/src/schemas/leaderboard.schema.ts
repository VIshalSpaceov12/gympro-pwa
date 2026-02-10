import { z } from 'zod';

// Leaderboard period enum
const leaderboardPeriodEnum = z.enum(['WEEKLY', 'MONTHLY', 'ALL_TIME']);

// Leaderboard category enum
const leaderboardCategoryEnum = z.enum(['WORKOUTS', 'CALORIES', 'STREAK']);

// Query params for leaderboard GET
export const leaderboardQuerySchema = z.object({
  period: leaderboardPeriodEnum.default('WEEKLY'),
  category: leaderboardCategoryEnum.default('WORKOUTS'),
});

// Type exports
export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;
export type LeaderboardPeriodEnum = z.infer<typeof leaderboardPeriodEnum>;
export type LeaderboardCategoryEnum = z.infer<typeof leaderboardCategoryEnum>;
