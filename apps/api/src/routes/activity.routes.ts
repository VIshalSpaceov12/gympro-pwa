import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createActivityLogSchema } from '@gympro/shared';
import {
  logActivity,
  getActivitySummary,
  getActivityHistory,
} from '../controllers/activity.controller.js';

const router = Router();

// All routes require authentication
router.post('/log', authenticate, validate(createActivityLogSchema), logActivity);
router.get('/summary', authenticate, getActivitySummary);
router.get('/history', authenticate, getActivityHistory);

export default router;
