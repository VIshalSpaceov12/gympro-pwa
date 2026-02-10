// User roles
export type UserRole = 'USER' | 'TRAINER' | 'ADMIN';

// Subscription status
export type SubscriptionStatus = 'FREE' | 'PREMIUM';

// Difficulty levels
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Experience levels
export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Meal types
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

// Leaderboard periods
export type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

// Leaderboard categories
export type LeaderboardCategory = 'WORKOUTS' | 'CALORIES' | 'STREAK';

// Activity types
export type ActivityType = 'STEPS' | 'WORKOUT' | 'CALORIES_BURNED' | 'WATER';

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
