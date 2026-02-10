import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAchievements,
  getUserAchievements,
} from '../controllers/achievement.controller.js';

const router = Router();

// All routes require authentication
router.get('/', authenticate, getAchievements);
router.get('/mine', authenticate, getUserAchievements);

export default router;
