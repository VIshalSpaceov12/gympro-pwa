import { Request, Response } from 'express';
import { prisma } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';

// ==========================================
// ACHIEVEMENT CRITERIA TYPES
// ==========================================

interface AchievementCriteria {
  type: string;
  threshold: number;
}

// ==========================================
// GET ALL ACHIEVEMENTS (with user progress)
// ==========================================

// GET /api/achievements
export async function getAchievements(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const achievements = await prisma.achievement.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        userAchievements: {
          where: { userId: req.user.userId },
          select: {
            progress: true,
            unlockedAt: true,
          },
        },
      },
    });

    const result = achievements.map((a) => {
      const userAchievement = a.userAchievements[0] || null;
      const criteria = a.criteria as unknown as AchievementCriteria;
      const progress = userAchievement?.progress ?? 0;
      const isUnlocked = progress >= criteria.threshold;

      return {
        id: a.id,
        name: a.name,
        description: a.description,
        iconUrl: a.iconUrl,
        criteria: a.criteria,
        progress,
        progressPercent: Math.min(100, Math.round((progress / criteria.threshold) * 100)),
        isUnlocked,
        unlockedAt: isUnlocked ? userAchievement?.unlockedAt : null,
      };
    });

    // Sort: unlocked first, then by progress descending
    result.sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      return b.progressPercent - a.progressPercent;
    });

    const unlockedCount = result.filter((a) => a.isUnlocked).length;

    sendSuccess(res, {
      achievements: result,
      totalCount: result.length,
      unlockedCount,
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    sendError(res, 'Failed to fetch achievements', 500);
  }
}

// ==========================================
// GET USER'S UNLOCKED ACHIEVEMENTS
// ==========================================

// GET /api/achievements/mine
export async function getUserAchievements(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: req.user.userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    // Filter to only truly unlocked achievements (progress >= threshold)
    const unlocked = userAchievements.filter((ua) => {
      const criteria = ua.achievement.criteria as unknown as AchievementCriteria;
      return ua.progress >= criteria.threshold;
    });

    const result = unlocked.map((ua) => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      iconUrl: ua.achievement.iconUrl,
      criteria: ua.achievement.criteria,
      progress: ua.progress,
      unlockedAt: ua.unlockedAt,
    }));

    sendSuccess(res, result);
  } catch (error) {
    console.error('Get user achievements error:', error);
    sendError(res, 'Failed to fetch user achievements', 500);
  }
}

// ==========================================
// CHECK AND UPDATE ACHIEVEMENTS (utility)
// ==========================================

export async function checkAndUpdateAchievements(userId: string): Promise<void> {
  try {
    // Fetch all achievements
    const achievements = await prisma.achievement.findMany();

    for (const achievement of achievements) {
      const criteria = achievement.criteria as unknown as AchievementCriteria;
      let currentProgress = 0;

      switch (criteria.type) {
        case 'workouts_completed': {
          const count = await prisma.workoutSession.count({
            where: { userId, completedAt: { not: null } },
          });
          currentProgress = count;
          break;
        }

        case 'calories_burned': {
          const result = await prisma.workoutSession.aggregate({
            where: { userId, completedAt: { not: null } },
            _sum: { caloriesBurned: true },
          });
          currentProgress = result._sum.caloriesBurned ?? 0;
          break;
        }

        case 'streak': {
          // Compute current consecutive workout days
          const logs = await prisma.activityLog.findMany({
            where: { userId, type: 'WORKOUT' },
            select: { date: true },
            orderBy: { date: 'desc' },
          });

          if (logs.length === 0) break;

          // Get unique dates sorted descending
          const uniqueDates = [...new Set(logs.map((l) => l.date.toISOString().split('T')[0]))];
          uniqueDates.sort((a, b) => b.localeCompare(a)); // descending

          let streak = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const curr = new Date(uniqueDates[i - 1]);
            const prev = new Date(uniqueDates[i]);
            const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
          currentProgress = streak;
          break;
        }

        case 'posts_created': {
          const count = await prisma.post.count({
            where: { userId, isPublished: true },
          });
          currentProgress = count;
          break;
        }

        case 'likes_received': {
          // Sum likes across all user's posts
          const result = await prisma.post.aggregate({
            where: { userId },
            _sum: { likesCount: true },
          });
          currentProgress = result._sum.likesCount ?? 0;
          break;
        }

        case 'custom_workouts_created': {
          const count = await prisma.customWorkout.count({
            where: { userId },
          });
          currentProgress = count;
          break;
        }

        default:
          continue;
      }

      // Upsert user achievement with current progress
      const isUnlocked = currentProgress >= criteria.threshold;

      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        update: {
          progress: currentProgress,
          ...(isUnlocked ? { unlockedAt: new Date() } : {}),
        },
        create: {
          userId,
          achievementId: achievement.id,
          progress: currentProgress,
          unlockedAt: isUnlocked ? new Date() : new Date(0), // epoch as placeholder for not-yet-unlocked
        },
      });
    }
  } catch (error) {
    console.error('Check and update achievements error:', error);
    // Don't throw — this is a background task and should not crash the caller
  }
}
