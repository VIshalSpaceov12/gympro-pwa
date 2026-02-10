'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Dumbbell,
  Flame,
  Zap,
  Star,
  Heart,
  PenTool,
  Users,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  criteria: { type: string; threshold: number };
  progress: number;
  progressPercent: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

interface AchievementsData {
  achievements: Achievement[];
  totalCount: number;
  unlockedCount: number;
}

// Map criteria type to icon and color
function getAchievementStyle(criteriaType: string): { icon: typeof Trophy; color: string; bg: string; glow: string } {
  switch (criteriaType) {
    case 'workouts_completed':
      return { icon: Dumbbell, color: 'text-indigo-600', bg: 'bg-indigo-100', glow: 'shadow-indigo-200' };
    case 'calories_burned':
      return { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100', glow: 'shadow-orange-200' };
    case 'streak':
      return { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100', glow: 'shadow-amber-200' };
    case 'posts_created':
      return { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', glow: 'shadow-blue-200' };
    case 'likes_received':
      return { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100', glow: 'shadow-pink-200' };
    case 'custom_workouts_created':
      return { icon: PenTool, color: 'text-emerald-600', bg: 'bg-emerald-100', glow: 'shadow-emerald-200' };
    default:
      return { icon: Star, color: 'text-gray-600', bg: 'bg-gray-100', glow: 'shadow-gray-200' };
  }
}

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const style = getAchievementStyle(achievement.criteria.type);
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm transition-all duration-200',
        achievement.isUnlocked
          ? `ring-2 ring-primary/20 shadow-md ${style.glow}`
          : 'opacity-75'
      )}
    >
      {/* Unlocked indicator */}
      {achievement.isUnlocked && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
      )}

      {/* Locked overlay */}
      {!achievement.isUnlocked && achievement.progressPercent === 0 && (
        <div className="absolute right-3 top-3">
          <Lock className="h-4 w-4 text-gray-300" />
        </div>
      )}

      {/* Icon */}
      <div className={cn(
        'flex h-12 w-12 items-center justify-center rounded-xl',
        achievement.isUnlocked ? style.bg : 'bg-gray-100 dark:bg-gray-800'
      )}>
        <Icon className={cn(
          'h-6 w-6',
          achievement.isUnlocked ? style.color : 'text-gray-400'
        )} />
      </div>

      {/* Name & Description */}
      <h3 className={cn(
        'mt-3 text-sm font-bold',
        achievement.isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
      )}>
        {achievement.name}
      </h3>
      <p className="mt-0.5 text-xs text-muted">{achievement.description}</p>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted">
            {achievement.progress} / {achievement.criteria.threshold}
          </span>
          <span className={cn(
            'text-[11px] font-bold',
            achievement.isUnlocked ? 'text-emerald-600' : 'text-muted'
          )}>
            {achievement.progressPercent}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${achievement.progressPercent}%` }}
            transition={{ duration: 0.6, delay: index * 0.04 + 0.2, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              achievement.isUnlocked
                ? 'bg-gradient-to-r from-primary to-primary-dark'
                : 'bg-gray-300'
            )}
          />
        </div>
      </div>

      {/* Unlocked date */}
      {achievement.isUnlocked && achievement.unlockedAt && (
        <p className="mt-2 text-[10px] text-muted">
          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievements() {
      setLoading(true);
      try {
        const result = await apiClient<AchievementsData>('/api/achievements');
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, []);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Achievements</h1>
        <p className="mt-1 text-sm text-muted">
          Track your fitness milestones and earn badges
        </p>
      </motion.div>

      {/* Unlock Stats */}
      {!loading && data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6 flex items-center gap-3 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <Trophy className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {data.unlockedCount} of {data.totalCount} unlocked
            </p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${data.totalCount > 0 ? (data.unlockedCount / data.totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-lg font-bold text-amber-600">
            {data.totalCount > 0 ? Math.round((data.unlockedCount / data.totalCount) * 100) : 0}%
          </span>
        </motion.div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-1 h-3 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : data && data.achievements.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.achievements.map((achievement, index) => (
            <AchievementCard key={achievement.id} achievement={achievement} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 py-16 shadow-sm">
          <Trophy className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No achievements available</h3>
          <p className="mt-1 text-center text-sm text-muted">
            Achievements will appear here once they are configured
          </p>
        </div>
      )}
    </div>
  );
}
