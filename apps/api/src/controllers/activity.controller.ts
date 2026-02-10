import { Request, Response } from 'express';
import { prisma, ActivityType } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';
import type { PaginatedResponse } from '@gympro/shared';

// ==========================================
// LOG ACTIVITY
// ==========================================

// POST /api/activity/log
export async function logActivity(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { type, value, unit, date } = req.body;

    // Use provided date or today
    const activityDate = date ? new Date(date) : new Date();
    // Normalize to date-only (strip time)
    const dateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

    const log = await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        type: type as ActivityType,
        value,
        unit,
        date: dateOnly,
      },
    });

    sendSuccess(res, log, 201);
  } catch (error) {
    console.error('Log activity error:', error);
    sendError(res, 'Failed to log activity', 500);
  }
}

// ==========================================
// GET DAILY/WEEKLY SUMMARY
// ==========================================

// GET /api/activity/summary
export async function getActivitySummary(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const userId = req.user.userId;

    // Today's date (start of day)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Week start (Monday)
    const dayOfWeek = now.getDay();
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));

    // Get today's activity by type
    const todayLogs = await prisma.activityLog.groupBy({
      by: ['type'],
      where: {
        userId,
        date: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      _sum: {
        value: true,
      },
    });

    // Get weekly activity by type
    const weeklyLogs = await prisma.activityLog.groupBy({
      by: ['type'],
      where: {
        userId,
        date: {
          gte: weekStart,
          lt: tomorrowStart,
        },
      },
      _sum: {
        value: true,
      },
    });

    // Get weekly activity by day for charts
    const weeklyDaily = await prisma.activityLog.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lt: tomorrowStart,
        },
      },
      select: {
        type: true,
        value: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    // Transform today's logs into a map
    const todaySummary: Record<string, number> = {
      STEPS: 0,
      WORKOUT: 0,
      CALORIES_BURNED: 0,
      WATER: 0,
    };
    todayLogs.forEach((log) => {
      todaySummary[log.type] = log._sum.value ?? 0;
    });

    // Transform weekly logs into a map
    const weeklySummary: Record<string, number> = {
      STEPS: 0,
      WORKOUT: 0,
      CALORIES_BURNED: 0,
      WATER: 0,
    };
    weeklyLogs.forEach((log) => {
      weeklySummary[log.type] = log._sum.value ?? 0;
    });

    // Aggregate daily data for week chart
    const dailyData: Record<string, Record<string, number>> = {};
    weeklyDaily.forEach((log) => {
      const dateKey = log.date.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { STEPS: 0, WORKOUT: 0, CALORIES_BURNED: 0, WATER: 0 };
      }
      dailyData[dateKey][log.type] += log.value;
    });

    sendSuccess(res, {
      today: todaySummary,
      weekly: weeklySummary,
      weeklyDaily: dailyData,
    });
  } catch (error) {
    console.error('Get activity summary error:', error);
    sendError(res, 'Failed to fetch activity summary', 500);
  }
}

// ==========================================
// GET ACTIVITY HISTORY
// ==========================================

// GET /api/activity/history
export async function getActivityHistory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { type, page = 1, limit = 20 } = req.query as {
      type?: string;
      page?: number;
      limit?: number;
    };

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { userId: req.user.userId };

    if (type && ['STEPS', 'WORKOUT', 'CALORIES_BURNED', 'WATER'].includes(type)) {
      where.type = type as ActivityType;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof logs)[0]> = {
      data: logs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get activity history error:', error);
    sendError(res, 'Failed to fetch activity history', 500);
  }
}
