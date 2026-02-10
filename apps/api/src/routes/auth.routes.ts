import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema } from '@gympro/shared';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  register,
  login,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  getAdminStats,
} from '../controllers/auth.controller.js';

const router = Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { success: false, error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/admin/stats', authenticate, requireRole('ADMIN'), getAdminStats);

export default router;
