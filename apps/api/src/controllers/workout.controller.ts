import { Request, Response } from 'express';
import { prisma, Difficulty } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';
import type { PaginatedResponse } from '@gympro/shared';

// ==========================================
// HELPERS
// ==========================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

// ==========================================
// CATEGORIES
// ==========================================

// GET /api/workouts/categories
export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.workoutCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { videos: { where: { isPublished: true } } },
        },
      },
    });

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      sortOrder: cat.sortOrder,
      videoCount: cat._count.videos,
    }));

    sendSuccess(res, result);
  } catch (error) {
    console.error('Get categories error:', error);
    sendError(res, 'Failed to fetch categories', 500);
  }
}

// GET /api/workouts/categories/:slug
export async function getCategoryBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const category = await prisma.workoutCategory.findUnique({
      where: { slug },
      include: {
        videos: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            duration: true,
            difficulty: true,
            caloriesBurned: true,
            isPremium: true,
            viewCount: true,
          },
        },
      },
    });

    if (!category) {
      sendError(res, 'Category not found', 404);
      return;
    }

    sendSuccess(res, category);
  } catch (error) {
    console.error('Get category by slug error:', error);
    sendError(res, 'Failed to fetch category', 500);
  }
}

// POST /api/workouts/categories (Admin)
export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, imageUrl } = req.body;
    const slug = slugify(name);

    // Check for duplicate slug
    const existing = await prisma.workoutCategory.findUnique({ where: { slug } });
    if (existing) {
      sendError(res, 'A category with this name already exists', 409);
      return;
    }

    // Get the next sort order
    const maxSortOrder = await prisma.workoutCategory.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const category = await prisma.workoutCategory.create({
      data: { name, slug, description, imageUrl, sortOrder },
    });

    sendSuccess(res, category, 201);
  } catch (error) {
    console.error('Create category error:', error);
    sendError(res, 'Failed to create category', 500);
  }
}

// PUT /api/workouts/categories/:id (Admin)
export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updateData: Record<string, unknown> = { ...req.body };

    // If name is being updated, regenerate the slug
    if (updateData.name) {
      updateData.slug = slugify(updateData.name as string);

      // Check for duplicate slug (excluding current category)
      const existing = await prisma.workoutCategory.findFirst({
        where: { slug: updateData.slug as string, id: { not: id } },
      });
      if (existing) {
        sendError(res, 'A category with this name already exists', 409);
        return;
      }
    }

    const category = await prisma.workoutCategory.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, category);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      sendError(res, 'Category not found', 404);
      return;
    }
    console.error('Update category error:', error);
    sendError(res, 'Failed to update category', 500);
  }
}

// DELETE /api/workouts/categories/:id (Admin)
export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check for existing videos
    const videoCount = await prisma.workoutVideo.count({ where: { categoryId: id } });
    if (videoCount > 0) {
      sendError(res, `Cannot delete category with ${videoCount} associated video(s). Remove videos first.`, 400);
      return;
    }

    await prisma.workoutCategory.delete({ where: { id } });

    sendSuccess(res, { message: 'Category deleted successfully' });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      sendError(res, 'Category not found', 404);
      return;
    }
    console.error('Delete category error:', error);
    sendError(res, 'Failed to delete category', 500);
  }
}

// ==========================================
// VIDEOS
// ==========================================

// GET /api/workouts/videos
export async function getVideos(req: Request, res: Response): Promise<void> {
  try {
    const {
      categoryId,
      difficulty,
      isPremium,
      search,
      page = 1,
      limit = 20,
    } = req.query as {
      categoryId?: string;
      difficulty?: string;
      isPremium?: string;
      search?: string;
      page?: number;
      limit?: number;
    };

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Record<string, unknown> = { isPublished: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (difficulty) {
      where.difficulty = difficulty as Difficulty;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [videos, total] = await Promise.all([
      prisma.workoutVideo.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          videoUrl: true,
          duration: true,
          difficulty: true,
          caloriesBurned: true,
          isPremium: true,
          viewCount: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.workoutVideo.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof videos)[0]> = {
      data: videos,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get videos error:', error);
    sendError(res, 'Failed to fetch videos', 500);
  }
}

// GET /api/workouts/videos/:id
export async function getVideoById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const video = await prisma.workoutVideo.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!video) {
      sendError(res, 'Video not found', 404);
      return;
    }

    if (!video.isPublished) {
      sendError(res, 'Video not found', 404);
      return;
    }

    // Increment view count (fire and forget)
    prisma.workoutVideo.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch((err) => console.error('Failed to increment view count:', err));

    sendSuccess(res, video);
  } catch (error) {
    console.error('Get video by ID error:', error);
    sendError(res, 'Failed to fetch video', 500);
  }
}

// GET /api/workouts/videos/:id/related
export async function getRelatedVideos(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // First get the source video's category
    const video = await prisma.workoutVideo.findUnique({
      where: { id },
      select: { categoryId: true },
    });

    if (!video) {
      sendError(res, 'Video not found', 404);
      return;
    }

    // Get related videos from the same category
    const related = await prisma.workoutVideo.findMany({
      where: {
        categoryId: video.categoryId,
        id: { not: id },
        isPublished: true,
      },
      take: 6,
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        duration: true,
        difficulty: true,
        caloriesBurned: true,
        isPremium: true,
        viewCount: true,
      },
    });

    sendSuccess(res, related);
  } catch (error) {
    console.error('Get related videos error:', error);
    sendError(res, 'Failed to fetch related videos', 500);
  }
}

// POST /api/workouts/videos (Admin)
export async function createVideo(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;

    // Verify category exists
    const category = await prisma.workoutCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      sendError(res, 'Category not found', 404);
      return;
    }

    const video = await prisma.workoutVideo.create({
      data: {
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        difficulty: data.difficulty,
        categoryId: data.categoryId,
        trainerId: data.trainerId,
        equipmentNeeded: data.equipmentNeeded,
        caloriesBurned: data.caloriesBurned,
        isPremium: data.isPremium ?? false,
        isPublished: true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    sendSuccess(res, video, 201);
  } catch (error) {
    console.error('Create video error:', error);
    sendError(res, 'Failed to create video', 500);
  }
}

// PUT /api/workouts/videos/:id (Admin)
export async function updateVideo(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body;

    // If categoryId is being updated, verify it exists
    if (data.categoryId) {
      const category = await prisma.workoutCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        sendError(res, 'Category not found', 404);
        return;
      }
    }

    const video = await prisma.workoutVideo.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    sendSuccess(res, video);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      sendError(res, 'Video not found', 404);
      return;
    }
    console.error('Update video error:', error);
    sendError(res, 'Failed to update video', 500);
  }
}

// DELETE /api/workouts/videos/:id (Admin)
export async function deleteVideo(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.workoutVideo.delete({ where: { id } });

    sendSuccess(res, { message: 'Video deleted successfully' });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      sendError(res, 'Video not found', 404);
      return;
    }
    console.error('Delete video error:', error);
    sendError(res, 'Failed to delete video', 500);
  }
}

// ==========================================
// SESSIONS
// ==========================================

// POST /api/workouts/sessions (Authenticated)
export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { videoId, customWorkoutId, duration, caloriesBurned, notes } = req.body;

    // If videoId provided, verify it exists
    if (videoId) {
      const video = await prisma.workoutVideo.findUnique({ where: { id: videoId } });
      if (!video) {
        sendError(res, 'Video not found', 404);
        return;
      }
    }

    // If customWorkoutId provided, verify it exists and belongs to user
    if (customWorkoutId) {
      const customWorkout = await prisma.customWorkout.findUnique({
        where: { id: customWorkoutId },
      });
      if (!customWorkout) {
        sendError(res, 'Custom workout not found', 404);
        return;
      }
    }

    const session = await prisma.workoutSession.create({
      data: {
        userId: req.user.userId,
        videoId,
        customWorkoutId,
        duration,
        caloriesBurned,
        notes,
      },
      include: {
        video: {
          select: { id: true, title: true, thumbnailUrl: true, duration: true },
        },
      },
    });

    sendSuccess(res, session, 201);
  } catch (error) {
    console.error('Create session error:', error);
    sendError(res, 'Failed to create workout session', 500);
  }
}

// PATCH /api/workouts/sessions/:id/complete (Authenticated)
export async function completeSession(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const { duration, caloriesBurned } = req.body;

    const session = await prisma.workoutSession.findUnique({ where: { id } });
    if (!session || session.userId !== req.user.userId) {
      sendError(res, 'Session not found', 404);
      return;
    }

    if (session.completedAt) {
      sendError(res, 'Session already completed', 400);
      return;
    }

    const updated = await prisma.workoutSession.update({
      where: { id },
      data: {
        completedAt: new Date(),
        duration: duration ?? session.duration,
        caloriesBurned: caloriesBurned ?? session.caloriesBurned,
      },
      include: {
        video: {
          select: { id: true, title: true, thumbnailUrl: true, duration: true },
        },
      },
    });

    sendSuccess(res, updated);
  } catch (error) {
    console.error('Complete session error:', error);
    sendError(res, 'Failed to complete workout session', 500);
  }
}

// GET /api/workouts/sessions (Authenticated)
export async function getUserSessions(req: Request, res: Response): Promise<void> {
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

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { startedAt: 'desc' },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              duration: true,
              difficulty: true,
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
      prisma.workoutSession.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof sessions)[0]> = {
      data: sessions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get user sessions error:', error);
    sendError(res, 'Failed to fetch workout sessions', 500);
  }
}

// GET /api/workouts/history (Authenticated)
export async function getWorkoutHistory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const userId = req.user.userId;

    const [totalWorkouts, stats] = await Promise.all([
      prisma.workoutSession.count({ where: { userId } }),
      prisma.workoutSession.aggregate({
        where: { userId },
        _sum: {
          duration: true,
          caloriesBurned: true,
        },
      }),
    ]);

    sendSuccess(res, {
      totalWorkouts,
      totalDuration: stats._sum.duration ?? 0,
      totalCalories: stats._sum.caloriesBurned ?? 0,
    });
  } catch (error) {
    console.error('Get workout history error:', error);
    sendError(res, 'Failed to fetch workout history', 500);
  }
}
