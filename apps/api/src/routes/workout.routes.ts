import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  createCategorySchema,
  updateCategorySchema,
  createVideoSchema,
  updateVideoSchema,
  createSessionSchema,
} from '../utils/workout-validation.js';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getVideos,
  getVideoById,
  getRelatedVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  createSession,
  completeSession,
  getUserSessions,
  getWorkoutHistory,
} from '../controllers/workout.controller.js';

const router = Router();

// ==========================================
// CATEGORY ROUTES
// ==========================================

// Public
router.get('/categories', getCategories);
router.get('/categories/:slug', getCategoryBySlug);

// Admin only
router.post('/categories', authenticate, requireRole('ADMIN'), validate(createCategorySchema), createCategory);
router.put('/categories/:id', authenticate, requireRole('ADMIN'), validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', authenticate, requireRole('ADMIN'), deleteCategory);

// ==========================================
// VIDEO ROUTES
// ==========================================

// Public
router.get('/videos', getVideos);
router.get('/videos/:id', getVideoById);
router.get('/videos/:id/related', getRelatedVideos);

// Admin only
router.post('/videos', authenticate, requireRole('ADMIN'), validate(createVideoSchema), createVideo);
router.put('/videos/:id', authenticate, requireRole('ADMIN'), validate(updateVideoSchema), updateVideo);
router.delete('/videos/:id', authenticate, requireRole('ADMIN'), deleteVideo);

// ==========================================
// SESSION ROUTES
// ==========================================

// Authenticated users
router.post('/sessions', authenticate, validate(createSessionSchema), createSession);
router.patch('/sessions/:id/complete', authenticate, completeSession);
router.get('/sessions', authenticate, getUserSessions);
router.get('/history', authenticate, getWorkoutHistory);

export default router;
