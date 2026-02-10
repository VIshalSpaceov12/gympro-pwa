import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createOrderSchema } from '@gympro/shared';
import {
  createOrder,
  getMyOrders,
  getOrderById,
} from '../controllers/order.controller.js';

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

export default router;
