import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  createMealPlanSchema,
  updateMealPlanSchema,
  addMealSchema,
} from '@gympro/shared';
import {
  getMealPlans,
  createMealPlan,
  getMealPlanById,
  updateMealPlan,
  deleteMealPlan,
  getDailySummary,
  addMeal,
  searchFood,
} from '../controllers/nutrition.controller.js';

const router = Router();

// All nutrition routes require authentication
router.use(authenticate);

// ==========================================
// MEAL PLAN ROUTES
// ==========================================

router.get('/meal-plans', getMealPlans);
router.post('/meal-plans', validate(createMealPlanSchema), createMealPlan);
router.get('/meal-plans/:id', getMealPlanById);
router.put('/meal-plans/:id', validate(updateMealPlanSchema), updateMealPlan);
router.delete('/meal-plans/:id', deleteMealPlan);

// ==========================================
// DAILY SUMMARY
// ==========================================

router.get('/daily-summary', getDailySummary);

// ==========================================
// MEALS (quick-add)
// ==========================================

router.post('/meals', validate(addMealSchema), addMeal);

// ==========================================
// FOOD SEARCH
// ==========================================

router.get('/food-search', searchFood);

export default router;
