import { Request, Response } from 'express';
import { prisma, LeaderboardPeriod, LeaderboardCategory } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';

// ==========================================
// HELPERS
// ==========================================

function getDateFilter(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  if (period === 'WEEKLY') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'MONTHLY') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null; // ALL_TIME
}

async function computeWorkoutScores(since: Date | null): Promise<{ userId: string; score: number }[]> {
  const where: Record<string, unknown> = {
    completedAt: { not: null },
  };
  if (since) {
    where.completedAt = { not: null, gte: since };
  }

  const results = await prisma.workoutSession.groupBy({
    by: ['userId'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 50,
  });

  return results.map((r) => ({ userId: r.userId, score: r._count.id }));
}

async function computeCalorieScores(since: Date | null): Promise<{ userId: string; score: number }[]> {
  const where: Record<string, unknown> = {
    completedAt: { not: null },
    caloriesBurned: { not: null },
  };
  if (since) {
    where.completedAt = { ...((where.completedAt as Record<string, unknown>) || {}), gte: since };
  }

  const results = await prisma.workoutSession.groupBy({
    by: ['userId'],
    where,
    _sum: { caloriesBurned: true },
    orderBy: { _sum: { caloriesBurned: 'desc' } },
    take: 50,
  });

  return results.map((r) => ({ userId: r.userId, score: r._sum.caloriesBurned ?? 0 }));
}

async function computeStreakScores(since: Date | null): Promise<{ userId: string; score: number }[]> {
  // Get all workout activity logs, ordered by user and date
  const where: Record<string, unknown> = {
    type: 'WORKOUT',
  };
  if (since) {
    where.date = { gte: since };
  }

  const logs = await prisma.activityLog.findMany({
    where,
    select: { userId: true, date: true },
    orderBy: [{ userId: 'asc' }, { date: 'asc' }],
  });

  // Compute max consecutive days per user
  const userStreaks: Record<string, number> = {};
  let currentUserId = '';
  let streak = 0;
  let maxStreak = 0;
  let prevDate: string | null = null;

  for (const log of logs) {
    const dateStr = log.date.toISOString().split('T')[0];

    if (log.userId !== currentUserId) {
      // Save previous user's streak
      if (currentUserId) {
        userStreaks[currentUserId] = Math.max(maxStreak, streak);
      }
      currentUserId = log.userId;
      streak = 1;
      maxStreak = 1;
      prevDate = dateStr;
      continue;
    }

    // Same user
    if (dateStr === prevDate) {
      // Same day, skip duplicate
      continue;
    }

    // Check if consecutive day
    const prev = new Date(prevDate!);
    const curr = new Date(dateStr);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 1;
    }
    prevDate = dateStr;
  }

  // Don't forget the last user
  if (currentUserId) {
    userStreaks[currentUserId] = Math.max(maxStreak, streak);
  }

  // Sort by streak descending, take top 50
  return Object.entries(userStreaks)
    .map(([userId, score]) => ({ userId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

async function computeScores(
  period: LeaderboardPeriod,
  category: LeaderboardCategory
): Promise<{ userId: string; score: number }[]> {
  const since = getDateFilter(period);

  switch (category) {
    case 'WORKOUTS':
      return computeWorkoutScores(since);
    case 'CALORIES':
      return computeCalorieScores(since);
    case 'STREAK':
      return computeStreakScores(since);
    default:
      return [];
  }
}

// ==========================================
// GET LEADERBOARD
// ==========================================

// GET /api/leaderboard?period=WEEKLY&category=WORKOUTS
export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const period = (req.query.period as LeaderboardPeriod) || 'WEEKLY';
    const category = (req.query.category as LeaderboardCategory) || 'WORKOUTS';

    // Validate enum values
    const validPeriods: LeaderboardPeriod[] = ['WEEKLY', 'MONTHLY', 'ALL_TIME'];
    const validCategories: LeaderboardCategory[] = ['WORKOUTS', 'CALORIES', 'STREAK'];

    if (!validPeriods.includes(period)) {
      sendError(res, 'Invalid period. Must be WEEKLY, MONTHLY, or ALL_TIME', 400);
      return;
    }
    if (!validCategories.includes(category)) {
      sendError(res, 'Invalid category. Must be WORKOUTS, CALORIES, or STREAK', 400);
      return;
    }

    // Try to get cached leaderboard entries
    const cachedEntries = await prisma.leaderboardEntry.findMany({
      where: { period, category },
      orderBy: { rank: 'asc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (cachedEntries.length > 0) {
      // Check if current user is in the results
      const currentUserEntry = cachedEntries.find((e) => e.userId === req.user!.userId);
      let myRank = null;

      if (!currentUserEntry) {
        // Get user's rank separately
        const myEntry = await prisma.leaderboardEntry.findUnique({
          where: {
            userId_period_category: {
              userId: req.user.userId,
              period,
              category,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        });
        if (myEntry) {
          myRank = myEntry;
        }
      }

      sendSuccess(res, {
        entries: cachedEntries.map((e) => ({
          rank: e.rank,
          score: e.score,
          userId: e.userId,
          firstName: e.user.firstName,
          lastName: e.user.lastName,
          avatarUrl: e.user.avatarUrl,
          isCurrentUser: e.userId === req.user!.userId,
        })),
        myRank: myRank
          ? {
              rank: myRank.rank,
              score: myRank.score,
              userId: myRank.userId,
              firstName: myRank.user.firstName,
              lastName: myRank.user.lastName,
              avatarUrl: myRank.user.avatarUrl,
              isCurrentUser: true,
            }
          : null,
        period,
        category,
      });
      return;
    }

    // No cached entries — compute on the fly
    const scores = await computeScores(period, category);

    // Fetch user details for the scores
    const userIds = scores.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const entries = scores.map((s, index) => {
      const user = userMap.get(s.userId);
      return {
        rank: index + 1,
        score: s.score,
        userId: s.userId,
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || 'User',
        avatarUrl: user?.avatarUrl || null,
        isCurrentUser: s.userId === req.user!.userId,
      };
    });

    // Check if current user is in top 50
    const currentUserInList = entries.find((e) => e.isCurrentUser);
    let myRank = null;

    if (!currentUserInList) {
      // Compute current user's score
      const allScores = await computeScores(period, category);
      const userScore = allScores.find((s) => s.userId === req.user!.userId);
      if (userScore) {
        // Find their rank among all scores
        const rank = allScores.findIndex((s) => s.userId === req.user!.userId) + 1;
        const currentUser = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        });
        if (currentUser) {
          myRank = {
            rank,
            score: userScore.score,
            userId: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatarUrl: currentUser.avatarUrl,
            isCurrentUser: true,
          };
        }
      }
    }

    sendSuccess(res, {
      entries,
      myRank,
      period,
      category,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    sendError(res, 'Failed to fetch leaderboard', 500);
  }
}

// ==========================================
// GET MY RANK
// ==========================================

// GET /api/leaderboard/my-rank
export async function getMyRank(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const periods: LeaderboardPeriod[] = ['WEEKLY', 'MONTHLY', 'ALL_TIME'];
    const categories: LeaderboardCategory[] = ['WORKOUTS', 'CALORIES', 'STREAK'];

    const rankings: Record<string, Record<string, { rank: number; score: number }>> = {};

    for (const period of periods) {
      rankings[period] = {};
      for (const category of categories) {
        // Try cached first
        const cached = await prisma.leaderboardEntry.findUnique({
          where: {
            userId_period_category: {
              userId: req.user.userId,
              period,
              category,
            },
          },
        });

        if (cached) {
          rankings[period][category] = { rank: cached.rank, score: cached.score };
        } else {
          // Compute on the fly
          const scores = await computeScores(period, category);
          const userScore = scores.find((s) => s.userId === req.user!.userId);
          if (userScore) {
            const rank = scores.findIndex((s) => s.userId === req.user!.userId) + 1;
            rankings[period][category] = { rank, score: userScore.score };
          } else {
            rankings[period][category] = { rank: 0, score: 0 };
          }
        }
      }
    }

    sendSuccess(res, rankings);
  } catch (error) {
    console.error('Get my rank error:', error);
    sendError(res, 'Failed to fetch rankings', 500);
  }
}

// ==========================================
// REFRESH LEADERBOARD (Admin only)
// ==========================================

// POST /api/leaderboard/refresh
export async function refreshLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const periods: LeaderboardPeriod[] = ['WEEKLY', 'MONTHLY', 'ALL_TIME'];
    const categories: LeaderboardCategory[] = ['WORKOUTS', 'CALORIES', 'STREAK'];

    let totalUpserted = 0;

    for (const period of periods) {
      for (const category of categories) {
        const scores = await computeScores(period, category);

        for (let i = 0; i < scores.length; i++) {
          await prisma.leaderboardEntry.upsert({
            where: {
              userId_period_category: {
                userId: scores[i].userId,
                period,
                category,
              },
            },
            update: {
              score: scores[i].score,
              rank: i + 1,
            },
            create: {
              userId: scores[i].userId,
              period,
              category,
              score: scores[i].score,
              rank: i + 1,
            },
          });
          totalUpserted++;
        }
      }
    }

    sendSuccess(res, { message: 'Leaderboard refreshed', totalEntries: totalUpserted });
  } catch (error) {
    console.error('Refresh leaderboard error:', error);
    sendError(res, 'Failed to refresh leaderboard', 500);
  }
}
