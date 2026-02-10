import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  createProductSchema,
  updateProductSchema,
  createProductCategorySchema,
  updateProductCategorySchema,
} from '@gympro/shared';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getProductCategories,
  getFeaturedProducts,
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../controllers/product.controller.js';

const router = Router();

// Public routes (order matters — specific before :id)
router.get('/categories', getProductCategories);
router.get('/featured', getFeaturedProducts);
router.get('/by-slug/:slug', getProductBySlug);

// Admin routes (must come before /:id)
router.get('/admin/all', authenticate, requireRole('ADMIN'), adminGetProducts);

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin CRUD
router.post('/', authenticate, requireRole('ADMIN'), validate(createProductSchema), createProduct);
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(updateProductSchema),
  updateProduct
);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteProduct);

// Admin Category CRUD
router.post(
  '/categories',
  authenticate,
  requireRole('ADMIN'),
  validate(createProductCategorySchema),
  createProductCategory
);
router.put(
  '/categories/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(updateProductCategorySchema),
  updateProductCategory
);
router.delete('/categories/:id', authenticate, requireRole('ADMIN'), deleteProductCategory);

export default router;
