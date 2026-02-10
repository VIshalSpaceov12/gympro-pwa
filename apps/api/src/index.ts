import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import workoutRoutes from './routes/workout.routes.js';
import customWorkoutRoutes from './routes/custom-workout.routes.js';
import activityRoutes from './routes/activity.routes.js';
import nutritionRoutes from './routes/nutrition.routes.js';
import communityRoutes from './routes/community.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import achievementRoutes from './routes/achievement.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import { seedAchievements } from './utils/seed-achievements.js';
import { seedProducts } from './utils/seed-products.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/custom-workouts', customWorkoutRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/posts', communityRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
);

app.listen(PORT, () => {
  console.log(`GymPro API running on http://localhost:${PORT}`);

  // Seed achievements on startup (idempotent)
  seedAchievements().catch((err) => {
    console.error('Failed to seed achievements:', err);
  });

  // Seed products on startup (idempotent)
  seedProducts().catch((err) => {
    console.error('Failed to seed products:', err);
  });
});

export default app;
