import { Request, Response } from 'express';
import { prisma } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';
import type { PaginatedResponse } from '@gympro/shared';

// GET /api/admin/users — list users with search, filter, pagination
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      limit = 20,
      filter = 'all',
      search,
      sort = 'createdAt',
      order = 'desc',
    } = req.query as {
      page?: number;
      limit?: number;
      filter?: string;
      search?: string;
      sort?: string;
      order?: string;
    };

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    // Filter
    if (filter === 'active') {
      where.isActive = true;
    } else if (filter === 'inactive') {
      where.isActive = false;
    } else if (filter === 'admin') {
      where.role = 'ADMIN';
    } else if (filter === 'trainer') {
      where.role = 'TRAINER';
    } else if (filter === 'premium') {
      where.subscriptionStatus = 'PREMIUM';
    }

    // Search by name or email
    if (search) {
      where.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // Sort
    const validSorts = ['createdAt', 'email', 'firstName', 'lastName', 'role'];
    const sortField = validSorts.includes(String(sort)) ? String(sort) : 'createdAt';
    const sortOrder = String(order) === 'asc' ? 'asc' : 'desc';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          subscriptionStatus: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof users)[0]> = {
      data: users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Admin get users error:', error);
    sendError(res, 'Failed to fetch users', 500);
  }
}

// GET /api/admin/users/:id — single user details
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        subscriptionStatus: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            workoutSessions: true,
            customWorkouts: true,
            posts: true,
            orders: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    console.error('Admin get user error:', error);
    sendError(res, 'Failed to fetch user', 500);
  }
}

// PATCH /api/admin/users/:id/role — update user role
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    const validRoles = ['USER', 'TRAINER', 'ADMIN'];
    if (!role || !validRoles.includes(role)) {
      sendError(res, 'Invalid role. Must be USER, TRAINER, or ADMIN.', 400);
      return;
    }

    // Prevent changing own role
    if (req.user?.userId === id) {
      sendError(res, 'Cannot change your own role', 400);
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        subscriptionStatus: true,
      },
    });

    sendSuccess(res, updated);
  } catch (error) {
    console.error('Admin update user role error:', error);
    sendError(res, 'Failed to update user role', 500);
  }
}

// PATCH /api/admin/users/:id/status — toggle user active status
export async function toggleUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      sendError(res, 'isActive must be a boolean', 400);
      return;
    }

    // Prevent deactivating yourself
    if (req.user?.userId === id && !isActive) {
      sendError(res, 'Cannot deactivate your own account', 400);
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        subscriptionStatus: true,
      },
    });

    sendSuccess(res, updated);
  } catch (error) {
    console.error('Admin toggle user status error:', error);
    sendError(res, 'Failed to update user status', 500);
  }
}
