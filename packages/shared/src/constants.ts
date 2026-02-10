// App constants shared across all packages

export const APP_NAME = 'GymProLuxe';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  BCRYPT_SALT_ROUNDS: 12,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
} as const;

export const WORKOUT = {
  CATEGORIES: [
    'Strength',
    'Cardio',
    'Yoga',
    'HIIT',
    'Pilates',
    'Stretching',
    'Boxing',
    'Dance',
    'Meditation',
  ] as const,
} as const;

export const UPLOAD = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'] as const,
} as const;
