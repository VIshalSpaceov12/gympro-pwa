import { z } from 'zod';

// Meal type enum matching Prisma
export const mealTypeEnum = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

// Meal item schema
const mealItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200),
  calories: z.number().int().nonnegative('Calories must be non-negative').optional(),
  protein: z.number().nonnegative('Protein must be non-negative').optional(),
  carbs: z.number().nonnegative('Carbs must be non-negative').optional(),
  fat: z.number().nonnegative('Fat must be non-negative').optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  unit: z.string().max(50).optional(),
});

// Meal schema (within a meal plan)
const mealSchema = z.object({
  type: mealTypeEnum,
  name: z.string().min(1, 'Meal name is required').max(200),
  items: z.array(mealItemSchema).default([]),
});

// Create meal plan
export const createMealPlanSchema = z.object({
  name: z.string().min(1, 'Meal plan name is required').max(200),
  date: z.string().min(1, 'Date is required'), // ISO date string YYYY-MM-DD
  targetCalories: z.number().int().positive('Target calories must be positive').optional(),
  meals: z.array(mealSchema).default([]),
});

// Update meal plan (all optional)
export const updateMealPlanSchema = z.object({
  name: z.string().min(1, 'Meal plan name is required').max(200).optional(),
  date: z.string().optional(),
  targetCalories: z.number().int().positive('Target calories must be positive').optional().nullable(),
  meals: z.array(mealSchema).optional(),
});

// Add a single meal to an existing plan
export const addMealSchema = z.object({
  mealPlanId: z.string().uuid('Invalid meal plan ID'),
  type: mealTypeEnum,
  name: z.string().min(1, 'Meal name is required').max(200),
  items: z.array(mealItemSchema).default([]),
});

// Food search query
export const foodSearchSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
});

// Type exports
export type MealTypeEnum = z.infer<typeof mealTypeEnum>;
export type MealItemInput = z.infer<typeof mealItemSchema>;
export type MealInput = z.infer<typeof mealSchema>;
export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;
export type UpdateMealPlanInput = z.infer<typeof updateMealPlanSchema>;
export type AddMealInput = z.infer<typeof addMealSchema>;
export type FoodSearchInput = z.infer<typeof foodSearchSchema>;
