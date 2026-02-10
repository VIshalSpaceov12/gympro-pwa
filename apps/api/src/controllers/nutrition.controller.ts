import { Request, Response } from 'express';
import { prisma, MealType } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';
import type { PaginatedResponse } from '@gympro/shared';

// ==========================================
// COMMON FOODS DATABASE (MVP hardcoded)
// ==========================================

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  quantity: number;
}

const COMMON_FOODS: FoodItem[] = [
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: 'g', quantity: 100 },
  { name: 'White Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: 'g', quantity: 100 },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, unit: 'medium', quantity: 1 },
  { name: 'Oatmeal', calories: 154, protein: 5, carbs: 27, fat: 2.6, unit: 'g', quantity: 100 },
  { name: 'Eggs', calories: 78, protein: 6, carbs: 0.6, fat: 5, unit: 'large', quantity: 1 },
  { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, unit: 'g', quantity: 100 },
  { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, unit: 'g', quantity: 100 },
  { name: 'Sweet Potato', calories: 103, protein: 2.3, carbs: 24, fat: 0.1, unit: 'g', quantity: 100 },
  { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, unit: 'g', quantity: 28 },
  { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, unit: 'g', quantity: 170 },
  { name: 'Avocado', calories: 240, protein: 3, carbs: 13, fat: 22, unit: 'whole', quantity: 1 },
  { name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, unit: 'g', quantity: 100 },
  { name: 'Quinoa', calories: 222, protein: 8, carbs: 39, fat: 3.6, unit: 'g', quantity: 100 },
  { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, unit: 'g', quantity: 100 },
  { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, unit: 'medium', quantity: 1 },
  { name: 'Blueberries', calories: 84, protein: 1.1, carbs: 21, fat: 0.5, unit: 'g', quantity: 148 },
  { name: 'Whey Protein', calories: 120, protein: 24, carbs: 3, fat: 1, unit: 'scoop', quantity: 1 },
  { name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fat: 1, unit: 'g', quantity: 100 },
  { name: 'Tuna', calories: 132, protein: 28, carbs: 0, fat: 1.3, unit: 'g', quantity: 100 },
  { name: 'Olive Oil', calories: 119, protein: 0, carbs: 0, fat: 14, unit: 'tbsp', quantity: 1 },
  { name: 'Peanut Butter', calories: 188, protein: 8, carbs: 6, fat: 16, unit: 'tbsp', quantity: 2 },
  { name: 'Milk (Whole)', calories: 149, protein: 8, carbs: 12, fat: 8, unit: 'cup', quantity: 1 },
  { name: 'Whole Wheat Bread', calories: 69, protein: 3.6, carbs: 12, fat: 1, unit: 'slice', quantity: 1 },
  { name: 'Pasta', calories: 220, protein: 8, carbs: 43, fat: 1.3, unit: 'g', quantity: 100 },
  { name: 'Steak (Sirloin)', calories: 271, protein: 26, carbs: 0, fat: 18, unit: 'g', quantity: 100 },
  { name: 'Tofu', calories: 144, protein: 17, carbs: 3, fat: 9, unit: 'g', quantity: 100 },
  { name: 'Lentils', calories: 230, protein: 18, carbs: 40, fat: 0.8, unit: 'g', quantity: 100 },
  { name: 'Cottage Cheese', calories: 206, protein: 28, carbs: 6, fat: 9, unit: 'cup', quantity: 1 },
  { name: 'Orange', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, unit: 'medium', quantity: 1 },
  { name: 'Honey', calories: 64, protein: 0.1, carbs: 17, fat: 0, unit: 'tbsp', quantity: 1 },
];

// ==========================================
// MEAL PLANS
// ==========================================

// GET /api/nutrition/meal-plans
export async function getMealPlans(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { date, page = 1, limit = 20 } = req.query as {
      date?: string;
      page?: number;
      limit?: number;
    };

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { userId: req.user.userId };

    if (date) {
      where.date = new Date(date);
    }

    const [mealPlans, total] = await Promise.all([
      prisma.mealPlan.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
        include: {
          meals: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      }),
      prisma.mealPlan.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof mealPlans)[0]> = {
      data: mealPlans,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get meal plans error:', error);
    sendError(res, 'Failed to fetch meal plans', 500);
  }
}

// POST /api/nutrition/meal-plans
export async function createMealPlan(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { name, date, targetCalories, meals } = req.body;

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: req.user.userId,
        name,
        date: new Date(date),
        targetCalories,
        meals: {
          create: (meals || []).map((meal: { type: MealType; name: string; items?: Array<{ name: string; calories?: number; protein?: number; carbs?: number; fat?: number; quantity?: number; unit?: string }> }, mealIndex: number) => ({
            type: meal.type,
            name: meal.name,
            sortOrder: mealIndex,
            items: {
              create: (meal.items || []).map((item: { name: string; calories?: number; protein?: number; carbs?: number; fat?: number; quantity?: number; unit?: string }, itemIndex: number) => ({
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                quantity: item.quantity,
                unit: item.unit,
                sortOrder: itemIndex,
              })),
            },
          })),
        },
      },
      include: {
        meals: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    sendSuccess(res, mealPlan, 201);
  } catch (error) {
    console.error('Create meal plan error:', error);
    sendError(res, 'Failed to create meal plan', 500);
  }
}

// GET /api/nutrition/meal-plans/:id
export async function getMealPlanById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;

    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        meals: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      sendError(res, 'Meal plan not found', 404);
      return;
    }

    if (mealPlan.userId !== req.user.userId) {
      sendError(res, 'Not authorized to view this meal plan', 403);
      return;
    }

    sendSuccess(res, mealPlan);
  } catch (error) {
    console.error('Get meal plan by ID error:', error);
    sendError(res, 'Failed to fetch meal plan', 500);
  }
}

// PUT /api/nutrition/meal-plans/:id
export async function updateMealPlan(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;
    const { name, date, targetCalories, meals } = req.body;

    // Check ownership
    const existing = await prisma.mealPlan.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Meal plan not found', 404);
      return;
    }
    if (existing.userId !== req.user.userId) {
      sendError(res, 'Not authorized to update this meal plan', 403);
      return;
    }

    // Build update data for the meal plan itself
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (date !== undefined) updateData.date = new Date(date);
    if (targetCalories !== undefined) updateData.targetCalories = targetCalories;

    // If meals are provided, replace all meals (delete old, create new)
    if (meals !== undefined) {
      // Delete existing meals (cascades to items)
      await prisma.meal.deleteMany({ where: { mealPlanId: id } });

      // Create new meals
      for (let mealIndex = 0; mealIndex < meals.length; mealIndex++) {
        const meal = meals[mealIndex];
        await prisma.meal.create({
          data: {
            mealPlanId: id,
            type: meal.type,
            name: meal.name,
            sortOrder: mealIndex,
            items: {
              create: (meal.items || []).map((item: { name: string; calories?: number; protein?: number; carbs?: number; fat?: number; quantity?: number; unit?: string }, itemIndex: number) => ({
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                quantity: item.quantity,
                unit: item.unit,
                sortOrder: itemIndex,
              })),
            },
          },
        });
      }
    }

    // Update the meal plan fields
    const mealPlan = await prisma.mealPlan.update({
      where: { id },
      data: updateData,
      include: {
        meals: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    sendSuccess(res, mealPlan);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      sendError(res, 'Meal plan not found', 404);
      return;
    }
    console.error('Update meal plan error:', error);
    sendError(res, 'Failed to update meal plan', 500);
  }
}

// DELETE /api/nutrition/meal-plans/:id
export async function deleteMealPlan(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;

    // Check ownership
    const existing = await prisma.mealPlan.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Meal plan not found', 404);
      return;
    }
    if (existing.userId !== req.user.userId) {
      sendError(res, 'Not authorized to delete this meal plan', 403);
      return;
    }

    await prisma.mealPlan.delete({ where: { id } });

    sendSuccess(res, { message: 'Meal plan deleted successfully' });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      sendError(res, 'Meal plan not found', 404);
      return;
    }
    console.error('Delete meal plan error:', error);
    sendError(res, 'Failed to delete meal plan', 500);
  }
}

// ==========================================
// DAILY SUMMARY
// ==========================================

// GET /api/nutrition/daily-summary?date=YYYY-MM-DD
export async function getDailySummary(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { date } = req.query as { date?: string };
    const targetDate = date ? new Date(date) : new Date();

    // Find the meal plan for this date
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        userId: req.user.userId,
        date: targetDate,
      },
      include: {
        meals: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      sendSuccess(res, {
        date: targetDate.toISOString().split('T')[0],
        mealPlan: null,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        targetCalories: null,
        meals: [],
      });
      return;
    }

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const meal of mealPlan.meals) {
      for (const item of meal.items) {
        totalCalories += item.calories ?? 0;
        totalProtein += item.protein ?? 0;
        totalCarbs += item.carbs ?? 0;
        totalFat += item.fat ?? 0;
      }
    }

    sendSuccess(res, {
      date: targetDate.toISOString().split('T')[0],
      mealPlan: {
        id: mealPlan.id,
        name: mealPlan.name,
        targetCalories: mealPlan.targetCalories,
      },
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      targetCalories: mealPlan.targetCalories,
      meals: mealPlan.meals,
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    sendError(res, 'Failed to fetch daily summary', 500);
  }
}

// ==========================================
// MEALS
// ==========================================

// POST /api/nutrition/meals — Quick-add a meal to an existing plan
export async function addMeal(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { mealPlanId, type, name, items } = req.body;

    // Verify meal plan exists and belongs to user
    const mealPlan = await prisma.mealPlan.findUnique({ where: { id: mealPlanId } });
    if (!mealPlan) {
      sendError(res, 'Meal plan not found', 404);
      return;
    }
    if (mealPlan.userId !== req.user.userId) {
      sendError(res, 'Not authorized to add meals to this plan', 403);
      return;
    }

    // Get the next sort order
    const maxSortOrder = await prisma.meal.aggregate({
      where: { mealPlanId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const meal = await prisma.meal.create({
      data: {
        mealPlanId,
        type,
        name,
        sortOrder,
        items: {
          create: (items || []).map((item: { name: string; calories?: number; protein?: number; carbs?: number; fat?: number; quantity?: number; unit?: string }, index: number) => ({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            quantity: item.quantity,
            unit: item.unit,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    sendSuccess(res, meal, 201);
  } catch (error) {
    console.error('Add meal error:', error);
    sendError(res, 'Failed to add meal', 500);
  }
}

// ==========================================
// FOOD SEARCH
// ==========================================

// GET /api/nutrition/food-search?q=chicken
export async function searchFood(req: Request, res: Response): Promise<void> {
  try {
    const { q } = req.query as { q?: string };

    if (!q || q.length < 2) {
      sendError(res, 'Search query must be at least 2 characters', 422);
      return;
    }

    const query = q.toLowerCase();
    const results = COMMON_FOODS.filter((food) =>
      food.name.toLowerCase().includes(query)
    );

    sendSuccess(res, results);
  } catch (error) {
    console.error('Food search error:', error);
    sendError(res, 'Failed to search foods', 500);
  }
}
