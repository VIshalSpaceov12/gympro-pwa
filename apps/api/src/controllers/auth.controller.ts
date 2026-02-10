import { Request, Response } from 'express';
import { prisma } from '@gympro/database';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateTokenPair, verifyRefreshToken, type TokenPayload } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 'An account with this email already exists', 409);
      return;
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        profile: { create: {} },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokenPair(tokenPayload);

    sendSuccess(res, { user, ...tokens }, 201);
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Registration failed', 500);
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        passwordHash: true,
        isActive: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account is deactivated. Contact support.', 403);
      return;
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokenPair(tokenPayload);

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    sendSuccess(res, { user: userWithoutPassword, ...tokens });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500);
  }
}

// POST /api/auth/refresh-token
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      sendError(res, 'Refresh token is required', 400);
      return;
    }

    // Verify refresh token
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      sendError(res, 'User not found or deactivated', 401);
      return;
    }

    // Generate new token pair
    const newTokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokenPair(newTokenPayload);

    sendSuccess(res, tokens);
  } catch (error) {
    console.error('Refresh token error:', error);
    sendError(res, 'Token refresh failed', 500);
  }
}

// GET /api/auth/me
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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
        profile: {
          select: {
            bio: true,
            dateOfBirth: true,
            gender: true,
            height: true,
            weight: true,
            fitnessGoal: true,
            experienceLevel: true,
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
    console.error('Get me error:', error);
    sendError(res, 'Failed to fetch user', 500);
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // TODO: In Phase 7, integrate Resend email service to send reset link
      // For now, log the token for development
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
    }

    sendSuccess(res, { message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 'Request failed', 500);
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body;

    // TODO: Validate reset token from database/cache
    // For now, this is a placeholder that will be fully implemented with email integration
    if (!token) {
      sendError(res, 'Invalid or expired reset token', 400);
      return;
    }

    // TODO: Look up user by reset token, then update password
    const passwordHash = await hashPassword(password);
    console.log(`[DEV] Password would be reset with hash: ${passwordHash.slice(0, 20)}...`);

    sendSuccess(res, { message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Password reset failed', 500);
  }
}
