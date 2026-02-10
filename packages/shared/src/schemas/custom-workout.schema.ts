import { z } from 'zod';

// Exercise schema for custom workouts
const customWorkoutExerciseSchema = z.object({
  exerciseName: z.string().min(1, 'Exercise name is required').max(200),
  sets: z.number().int().positive('Sets must be a positive number'),
  reps: z.number().int().positive('Reps must be a positive number').optional(),
  weight: z.number().positive('Weight must be a positive number').optional(),
  restSeconds: z.number().int().positive('Rest time must be a positive number').optional(),
  notes: z.string().max(500).optional(),
});

// Create custom workout
export const createCustomWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(200),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  exercises: z
    .array(customWorkoutExerciseSchema)
    .min(1, 'At least one exercise is required'),
});

// Update custom workout (all fields optional)
export const updateCustomWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  isPublic: z.boolean().optional(),
  exercises: z
    .array(customWorkoutExerciseSchema)
    .min(1, 'At least one exercise is required')
    .optional(),
});

// Type exports
export type CreateCustomWorkoutInput = z.infer<typeof createCustomWorkoutSchema>;
export type UpdateCustomWorkoutInput = z.infer<typeof updateCustomWorkoutSchema>;
export type CustomWorkoutExerciseInput = z.infer<typeof customWorkoutExerciseSchema>;
