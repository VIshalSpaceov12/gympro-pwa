import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@gympro/shared';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
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

export default router;
