import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
} from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', toggleUserStatus);

export default router;
