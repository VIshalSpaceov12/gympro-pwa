import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getLeaderboard,
  getMyRank,
  refreshLeaderboard,
} from '../controllers/leaderboard.controller.js';

const router = Router();

// All routes require authentication
router.get('/', authenticate, getLeaderboard);
router.get('/my-rank', authenticate, getMyRank);
router.post('/refresh', authenticate, requireRole('ADMIN'), refreshLeaderboard);

export default router;
