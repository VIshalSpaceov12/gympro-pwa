import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { createPostSchema, createCommentSchema } from '@gympro/shared';
import {
  getPosts,
  createPost,
  getPostById,
  deletePost,
  likePost,
  getPostComments,
  createComment,
  deleteComment,
  getPostsAdmin,
  togglePostVisibility,
} from '../controllers/community.controller.js';

const router = Router();

// ==========================================
// ADMIN ROUTES (must come before :id param routes)
// ==========================================

router.get('/admin/all', authenticate, requireRole('ADMIN'), getPostsAdmin);

// ==========================================
// POST ROUTES
// ==========================================

// Get paginated feed
router.get('/', authenticate, getPosts);

// Create a post
router.post('/', authenticate, validate(createPostSchema), createPost);

// Get single post with comments
router.get('/:id', authenticate, getPostById);

// Delete a post (own or admin)
router.delete('/:id', authenticate, deletePost);

// Toggle like on a post
router.post('/:id/like', authenticate, likePost);

// Toggle post visibility (admin)
router.patch('/:id/visibility', authenticate, requireRole('ADMIN'), togglePostVisibility);

// ==========================================
// COMMENT ROUTES
// ==========================================

// Get paginated comments for a post
router.get('/:id/comments', authenticate, getPostComments);

// Create a comment on a post
router.post('/:id/comments', authenticate, validate(createCommentSchema), createComment);

// Delete a comment (own or admin) — note: uses comment ID, not post ID
router.delete('/comments/:id', authenticate, deleteComment);

export default router;
