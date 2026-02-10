'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  Loader2,
  Apple,
  CalendarDays,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MealItem {
  id: string;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  quantity: number | null;
  unit: string | null;
}

interface Meal {
  id: string;
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  name: string;
  items: MealItem[];
}

interface DailySummary {
  date: string;
  mealPlan: { id: string; name: string; targetCalories: number | null } | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number | null;
  meals: Meal[];
}

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

const MEAL_TYPE_ICONS: Record<string, string> = {
  BREAKFAST: '\u{1F305}',
  LUNCH: '\u{2600}\u{FE0F}',
  DINNER: '\u{1F319}',
  SNACK: '\u{1F34E}',
};

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  const today = new Date();
  const todayStr = formatDate(today);
  const dateStr = formatDate(date);

  if (dateStr === todayStr) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === formatDate(yesterday)) return 'Yesterday';

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === formatDate(tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function NutritionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (dateParam) {
      // Parse date param as UTC to avoid timezone issues
      const parts = dateParam.split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    return new Date();
  });
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchSummary = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = formatDate(date);
      const result = await apiClient<DailySummary>(
        `/api/nutrition/daily-summary?date=${dateStr}`
      );
      if (result.success && result.data) {
        setSummary(result.data);
      }
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(currentDate);
  }, [currentDate, fetchSummary]);

  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const handleStartLogging = async () => {
    setCreating(true);
    try {
      const dateStr = formatDate(currentDate);
      const result = await apiClient<{ id: string }>('/api/nutrition/meal-plans', {
        method: 'POST',
        body: JSON.stringify({
          name: `Meal Plan - ${formatDisplayDate(currentDate)}`,
          date: dateStr,
          targetCalories: 2000,
          meals: [],
        }),
      });
      if (result.success) {
        await fetchSummary(currentDate);
      }
    } catch {
      // Error handled silently
    } finally {
      setCreating(false);
    }
  };

  const handleAddMeal = (mealType: string) => {
    const dateStr = formatDate(currentDate);
    const planId = summary?.mealPlan?.id || '';
    router.push(`/nutrition/add-meal?type=${mealType}&date=${dateStr}&planId=${planId}`);
  };

  const calorieProgress = summary?.targetCalories
    ? Math.min((summary.totalCalories / summary.targetCalories) * 100, 100)
    : 0;

  const caloriesRemaining = summary?.targetCalories
    ? Math.max(summary.targetCalories - summary.totalCalories, 0)
    : 0;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Nutrition</h1>
            <p className="mt-1 text-sm text-muted">Track your meals and macros</p>
          </div>
          <Link
            href="/nutrition/history"
            className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <CalendarDays className="h-4 w-4" />
            History
          </Link>
        </div>
      </motion.div>

      {/* Date Navigation */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => navigateDate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <span className="min-w-[140px] text-center text-lg font-semibold text-gray-900 dark:text-white">
          {formatDisplayDate(currentDate)}
        </span>
        <button
          onClick={() => navigateDate(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted">Loading nutrition data...</p>
        </div>
      ) : !summary?.mealPlan ? (
        /* No meal plan for this day */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 py-16 shadow-sm"
        >
          <Apple className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No meals logged</h3>
          <p className="mt-1 mb-6 text-sm text-muted">
            Start tracking your nutrition for {formatDisplayDate(currentDate).toLowerCase()}
          </p>
          <button
            onClick={handleStartLogging}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Start Logging
          </button>
        </motion.div>
      ) : (
        <>
          {/* Calorie Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 rounded-xl bg-white dark:bg-gray-900 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Calorie Summary
              </h2>
              <Flame className="h-5 w-5 text-orange-500" />
            </div>

            <div className="flex items-center gap-6">
              {/* Circular Progress */}
              <div className="relative flex-shrink-0">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke={calorieProgress >= 100 ? '#ef4444' : '#6366f1'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${calorieProgress * 2.64} ${264 - calorieProgress * 2.64}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.totalCalories}
                  </span>
                  <span className="text-[10px] text-muted">kcal</span>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Consumed</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {summary.totalCalories} kcal
                  </span>
                </div>
                {summary.targetCalories && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Target</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {summary.targetCalories} kcal
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Remaining</span>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          caloriesRemaining > 0
                            ? 'text-green-600'
                            : 'text-red-500'
                        )}
                      >
                        {caloriesRemaining} kcal
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Macro Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6 grid grid-cols-3 gap-3"
          >
            {/* Protein */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 uppercase">
                  Protein
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.totalProtein}
                <span className="text-xs font-normal text-muted">g</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${Math.min((summary.totalProtein / 150) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 uppercase">
                  Carbs
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.totalCarbs}
                <span className="text-xs font-normal text-muted">g</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${Math.min((summary.totalCarbs / 250) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 uppercase">
                  Fat
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.totalFat}
                <span className="text-xs font-normal text-muted">g</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-rose-100">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-500"
                  style={{
                    width: `${Math.min((summary.totalFat / 65) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Meal Sections */}
          <div className="space-y-4">
            {MEAL_TYPES.map((mealType, idx) => {
              const mealsOfType = summary.meals.filter((m) => m.type === mealType);
              const mealCalories = mealsOfType.reduce(
                (sum, meal) =>
                  sum +
                  meal.items.reduce((itemSum, item) => itemSum + (item.calories ?? 0), 0),
                0
              );

              return (
                <motion.div
                  key={mealType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                  className="rounded-xl bg-white dark:bg-gray-900 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{MEAL_TYPE_ICONS[mealType]}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {MEAL_TYPE_LABELS[mealType]}
                      </h3>
                      {mealCalories > 0 && (
                        <span className="text-xs text-muted">
                          {mealCalories} kcal
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddMeal(mealType)}
                      className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>

                  {mealsOfType.length > 0 ? (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {mealsOfType.map((meal) =>
                        meal.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between px-4 py-2.5"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted">
                                {item.quantity && item.unit
                                  ? `${item.quantity} ${item.unit}`
                                  : '1 serving'}
                              </p>
                            </div>
                            <div className="ml-4 text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {item.calories ?? 0} kcal
                              </p>
                              <p className="text-[10px] text-muted">
                                P:{item.protein ?? 0}g C:{item.carbs ?? 0}g F:{item.fat ?? 0}g
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <p className="text-xs text-muted">
                        No items logged
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function NutritionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted">Loading nutrition data...</p>
        </div>
      }
    >
      <NutritionContent />
    </Suspense>
  );
}
