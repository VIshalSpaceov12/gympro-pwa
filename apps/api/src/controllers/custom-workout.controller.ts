import { Request, Response } from 'express';
import { prisma } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';
import type { PaginatedResponse } from '@gympro/shared';

// ==========================================
// LIST CUSTOM WORKOUTS
// ==========================================

// GET /api/custom-workouts
export async function getCustomWorkouts(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where = { userId: req.user.userId };

    const [workouts, total] = await Promise.all([
      prisma.customWorkout.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { exercises: true },
          },
        },
      }),
      prisma.customWorkout.count({ where }),
    ]);

    const result = workouts.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      isPublic: w.isPublic,
      exerciseCount: w._count.exercises,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));

    const response: PaginatedResponse<(typeof result)[0]> = {
      data: result,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get custom workouts error:', error);
    sendError(res, 'Failed to fetch custom workouts', 500);
  }
}

// ==========================================
// CREATE CUSTOM WORKOUT
// ==========================================

// POST /api/custom-workouts
export async function createCustomWorkout(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { name, description, isPublic, exercises } = req.body;

    const workout = await prisma.customWorkout.create({
      data: {
        userId: req.user.userId,
        name,
        description,
        isPublic: isPublic ?? false,
        exercises: {
          create: exercises.map((ex: { exerciseName: string; sets: number; reps?: number; weight?: number; restSeconds?: number; notes?: string }, index: number) => ({
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
            sortOrder: index,
          })),
        },
      },
      include: {
        exercises: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    sendSuccess(res, workout, 201);
  } catch (error) {
    console.error('Create custom workout error:', error);
    sendError(res, 'Failed to create custom workout', 500);
  }
}

// ==========================================
// GET CUSTOM WORKOUT BY ID
// ==========================================

// GET /api/custom-workouts/:id
export async function getCustomWorkoutById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;

    const workout = await prisma.customWorkout.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!workout) {
      sendError(res, 'Custom workout not found', 404);
      return;
    }

    // Only allow owner or public workouts
    if (workout.userId !== req.user.userId && !workout.isPublic) {
      sendError(res, 'Custom workout not found', 404);
      return;
    }

    sendSuccess(res, workout);
  } catch (error) {
    console.error('Get custom workout by ID error:', error);
    sendError(res, 'Failed to fetch custom workout', 500);
  }
}

// ==========================================
// UPDATE CUSTOM WORKOUT
// ==========================================

// PUT /api/custom-workouts/:id
export async function updateCustomWorkout(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;
    const { name, description, isPublic, exercises } = req.body;

    // Verify ownership
    const existing = await prisma.customWorkout.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      sendError(res, 'Custom workout not found', 404);
      return;
    }

    if (existing.userId !== req.user.userId) {
      sendError(res, 'You can only update your own workouts', 403);
      return;
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    // If exercises provided, replace all exercises
    if (exercises) {
      await prisma.$transaction(async (tx) => {
        // Delete existing exercises
        await tx.customWorkoutExercise.deleteMany({
          where: { customWorkoutId: id },
        });

        // Update workout and create new exercises
        await tx.customWorkout.update({
          where: { id },
          data: {
            ...updateData,
            exercises: {
              create: exercises.map((ex: { exerciseName: string; sets: number; reps?: number; weight?: number; restSeconds?: number; notes?: string }, index: number) => ({
                exerciseName: ex.exerciseName,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                restSeconds: ex.restSeconds,
                notes: ex.notes,
                sortOrder: index,
              })),
            },
          },
        });
      });
    } else {
      await prisma.customWorkout.update({
        where: { id },
        data: updateData,
      });
    }

    // Fetch the updated workout
    const workout = await prisma.customWorkout.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    sendSuccess(res, workout);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      sendError(res, 'Custom workout not found', 404);
      return;
    }
    console.error('Update custom workout error:', error);
    sendError(res, 'Failed to update custom workout', 500);
  }
}

// ==========================================
// DELETE CUSTOM WORKOUT
// ==========================================

// DELETE /api/custom-workouts/:id
export async function deleteCustomWorkout(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;

    // Verify ownership
    const existing = await prisma.customWorkout.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      sendError(res, 'Custom workout not found', 404);
      return;
    }

    if (existing.userId !== req.user.userId) {
      sendError(res, 'You can only delete your own workouts', 403);
      return;
    }

    await prisma.customWorkout.delete({ where: { id } });

    sendSuccess(res, { message: 'Custom workout deleted successfully' });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      sendError(res, 'Custom workout not found', 404);
      return;
    }
    console.error('Delete custom workout error:', error);
    sendError(res, 'Failed to delete custom workout', 500);
  }
}
