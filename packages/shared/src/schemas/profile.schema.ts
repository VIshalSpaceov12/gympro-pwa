import { z } from 'zod';
import { AUTH } from '../constants';

// Update profile
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')).or(z.literal(null)),
  phone: z.string().regex(/^\d{10}$/, 'Contact number must be exactly 10 digits').optional().or(z.literal('')).or(z.literal(null)),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional().or(z.literal('')).or(z.literal(null)),
  dateOfBirth: z.string().optional().or(z.literal('')).or(z.literal(null)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().or(z.literal('')).or(z.literal(null)),
  height: z.number().positive().optional().or(z.literal(null)),
  weight: z.number().positive().optional().or(z.literal(null)),
  fitnessGoal: z.enum(['LOSE_WEIGHT', 'BUILD_MUSCLE', 'STAY_FIT', 'IMPROVE_FLEXIBILITY', 'INCREASE_ENDURANCE']).optional().or(z.literal('')).or(z.literal(null)),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional().or(z.literal('')).or(z.literal(null)),
});

// Change password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(AUTH.MIN_PASSWORD_LENGTH, `New password must be at least ${AUTH.MIN_PASSWORD_LENGTH} characters`)
    .max(AUTH.MAX_PASSWORD_LENGTH, `New password must be at most ${AUTH.MAX_PASSWORD_LENGTH} characters`),
});

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
