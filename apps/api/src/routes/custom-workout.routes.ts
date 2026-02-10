import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createCustomWorkoutSchema, updateCustomWorkoutSchema } from '@gympro/shared';
import {
  getCustomWorkouts,
  createCustomWorkout,
  getCustomWorkoutById,
  updateCustomWorkout,
  deleteCustomWorkout,
} from '../controllers/custom-workout.controller.js';

const router = Router();

// All routes require authentication
router.get('/', authenticate, getCustomWorkouts);
router.post('/', authenticate, validate(createCustomWorkoutSchema), createCustomWorkout);
router.get('/:id', authenticate, getCustomWorkoutById);
router.put('/:id', authenticate, validate(updateCustomWorkoutSchema), updateCustomWorkout);
router.delete('/:id', authenticate, deleteCustomWorkout);

export default router;
