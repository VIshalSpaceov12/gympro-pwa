'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Flame, Zap, Crown, User } from 'lucide-react';
import { motion } from 'framer-motion';

type Period = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
type Category = 'WORKOUTS' | 'CALORIES' | 'STREAK';

interface LeaderboardUser {
  rank: number;
  score: number;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  entries: LeaderboardUser[];
  myRank: LeaderboardUser | null;
  period: Period;
  category: Category;
}

const periods: { label: string; value: Period }[] = [
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'All Time', value: 'ALL_TIME' },
];

const categories: { label: string; value: Category; icon: typeof Trophy }[] = [
  { label: 'Workouts', value: 'WORKOUTS', icon: Zap },
  { label: 'Calories', value: 'CALORIES', icon: Flame },
  { label: 'Streak', value: 'STREAK', icon: Trophy },
];

function getRankBadge(rank: number) {
  if (rank === 1) return { bg: 'bg-amber-400', text: 'text-amber-900', border: 'border-amber-300', label: '1st' };
  if (rank === 2) return { bg: 'bg-gray-300', text: 'text-gray-700', border: 'border-gray-200', label: '2nd' };
  if (rank === 3) return { bg: 'bg-orange-300', text: 'text-orange-800', border: 'border-orange-200', label: '3rd' };
  return null;
}

function formatScore(score: number, category: Category): string {
  if (category === 'CALORIES') {
    return score >= 1000 ? `${(score / 1000).toFixed(1)}k cal` : `${score} cal`;
  }
  if (category === 'STREAK') {
    return `${score} day${score !== 1 ? 's' : ''}`;
  }
  return score.toString();
}

function AvatarPlaceholder({ firstName, lastName, size = 'md' }: { firstName: string; lastName: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
  };
  return (
    <div className={cn('flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark font-bold text-white', sizeClasses[size])}>
      {initials}
    </div>
  );
}

function PodiumCard({ user, category }: { user: LeaderboardUser; category: Category }) {
  const badge = getRankBadge(user.rank);
  const isFirst = user.rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: user.rank * 0.1 }}
      className={cn(
        'relative flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900',
        isFirst && 'ring-2 ring-amber-400/50 shadow-amber-100',
        user.isCurrentUser && 'ring-2 ring-primary/40'
      )}
    >
      {/* Rank badge */}
      {badge && (
        <div className={cn('absolute -top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', badge.bg, badge.text)}>
          {user.rank}
        </div>
      )}

      {/* Crown for #1 */}
      {isFirst && <Crown className="mb-1 h-5 w-5 text-amber-400" />}

      {/* Avatar */}
      <AvatarPlaceholder firstName={user.firstName} lastName={user.lastName} size={isFirst ? 'lg' : 'md'} />

      {/* Name */}
      <p className={cn('mt-2 text-center text-sm font-semibold text-gray-900 dark:text-white', isFirst && 'text-base')}>
        {user.firstName} {user.lastName.charAt(0)}.
      </p>

      {/* Score */}
      <p className={cn('mt-1 text-xs font-medium text-muted', isFirst && 'text-sm text-primary font-bold')}>
        {formatScore(user.score, category)}
      </p>

      {user.isCurrentUser && (
        <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">You</span>
      )}
    </motion.div>
  );
}

function LeaderboardRow({ user, category, index }: { user: LeaderboardUser; category: Category; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
        user.isCurrentUser ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-white dark:bg-gray-900'
      )}
    >
      {/* Rank */}
      <span className="w-8 text-center text-sm font-bold text-muted">
        {user.rank}
      </span>

      {/* Avatar */}
      <AvatarPlaceholder firstName={user.firstName} lastName={user.lastName} size="sm" />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {user.firstName} {user.lastName}
          {user.isCurrentUser && <span className="ml-1 text-xs text-primary">(You)</span>}
        </p>
      </div>

      {/* Score */}
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {formatScore(user.score, category)}
      </span>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('WEEKLY');
  const [category, setCategory] = useState<Category>('WORKOUTS');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient<LeaderboardData>(
        `/api/leaderboard?period=${period}&category=${category}`
      );
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const topThree = data?.entries.slice(0, 3) || [];
  const rest = data?.entries.slice(3) || [];

  // Re-order top 3 for podium display: 2nd, 1st, 3rd
  const podiumOrder = topThree.length >= 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted">See how you stack up against the community</p>
      </motion.div>

      {/* Period Tabs */}
      <div className="mb-4 flex rounded-xl bg-white p-1 shadow-sm dark:bg-gray-900">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
              period === p.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Category Pills */}
      <div className="mb-6 flex gap-2">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                category === c.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {/* Podium skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-1 h-3 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
          {/* Row skeletons */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 dark:bg-gray-900">
              <div className="h-4 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : data && data.entries.length > 0 ? (
        <>
          {/* Podium (Top 3) */}
          {topThree.length > 0 && (
            <div className={cn(
              'mb-6 grid gap-3',
              topThree.length >= 3 ? 'grid-cols-3' : `grid-cols-${topThree.length}`
            )}>
              {podiumOrder.map((user) => (
                <PodiumCard key={user.userId} user={user} category={category} />
              ))}
            </div>
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((user, index) => (
                <LeaderboardRow key={user.userId} user={user} category={category} index={index} />
              ))}
            </div>
          )}

          {/* Current user rank (if not in top 50) */}
          {data.myRank && !data.entries.find((e) => e.isCurrentUser) && (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted">Your Rank</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <LeaderboardRow user={data.myRank} category={category} index={0} />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm dark:bg-gray-900">
          <Medal className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No rankings yet</h3>
          <p className="mt-1 text-center text-sm text-muted">
            Complete workouts to appear on the leaderboard
          </p>
        </div>
      )}
    </div>
  );
}
