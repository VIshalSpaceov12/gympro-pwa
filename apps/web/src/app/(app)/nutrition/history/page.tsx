'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Flame,
  Loader2,
  CalendarDays,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MealItem {
  id: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface Meal {
  id: string;
  type: string;
  items: MealItem[];
}

interface MealPlan {
  id: string;
  name: string;
  date: string;
  targetCalories: number | null;
  meals: Meal[];
}

interface PaginatedMealPlans {
  data: MealPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DayEntry {
  date: string;
  displayDate: string;
  dayOfWeek: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number | null;
  mealCount: number;
}

function formatDateDisplay(dateStr: string): { display: string; dayOfWeek: string } {
  const date = new Date(dateStr);
  // Fix timezone offset: the date from DB is UTC midnight, so we need to use UTC methods
  const dayOfWeek = date.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
  const display = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return { display, dayOfWeek };
}

export default function NutritionHistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyAvg, setWeeklyAvg] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient<PaginatedMealPlans>(
        '/api/nutrition/meal-plans?limit=14'
      );
      if (result.success && result.data) {
        const dayEntries: DayEntry[] = result.data.data.map((plan) => {
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;
          let mealCount = 0;

          for (const meal of plan.meals) {
            mealCount++;
            for (const item of meal.items) {
              totalCalories += item.calories ?? 0;
              totalProtein += item.protein ?? 0;
              totalCarbs += item.carbs ?? 0;
              totalFat += item.fat ?? 0;
            }
          }

          const { display, dayOfWeek } = formatDateDisplay(plan.date);

          return {
            date: plan.date.split('T')[0],
            displayDate: display,
            dayOfWeek,
            totalCalories: Math.round(totalCalories),
            totalProtein: Math.round(totalProtein * 10) / 10,
            totalCarbs: Math.round(totalCarbs * 10) / 10,
            totalFat: Math.round(totalFat * 10) / 10,
            targetCalories: plan.targetCalories,
            mealCount,
          };
        });

        setEntries(dayEntries);

        // Calculate weekly averages (last 7 entries)
        const recent = dayEntries.slice(0, 7);
        if (recent.length > 0) {
          const totalCal = recent.reduce((s, e) => s + e.totalCalories, 0);
          const totalPro = recent.reduce((s, e) => s + e.totalProtein, 0);
          const totalCarb = recent.reduce((s, e) => s + e.totalCarbs, 0);
          const totalFt = recent.reduce((s, e) => s + e.totalFat, 0);
          setWeeklyAvg({
            calories: Math.round(totalCal / recent.length),
            protein: Math.round((totalPro / recent.length) * 10) / 10,
            carbs: Math.round((totalCarb / recent.length) * 10) / 10,
            fat: Math.round((totalFt / recent.length) * 10) / 10,
          });
        }
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const navigateToDay = (dateStr: string) => {
    // Navigate to nutrition page which will show the day view
    // We need to store the date and let the nutrition page pick it up
    // Simplest approach: use a query param or just navigate
    router.push(`/nutrition?date=${dateStr}`);
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <button
          onClick={() => router.push('/nutrition')}
          className="mb-4 flex items-center gap-1 text-sm text-muted transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Nutrition
        </button>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Nutrition History
        </h1>
        <p className="mt-1 text-sm text-muted">
          Review your recent nutrition data
        </p>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted">Loading history...</p>
        </div>
      ) : (
        <>
          {/* Weekly Averages */}
          {entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 rounded-xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Weekly Averages
                </h2>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">
                    {weeklyAvg.calories}
                  </p>
                  <p className="text-[10px] text-muted uppercase">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {weeklyAvg.protein}g
                  </p>
                  <p className="text-[10px] text-muted uppercase">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-600">
                    {weeklyAvg.carbs}g
                  </p>
                  <p className="text-[10px] text-muted uppercase">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-rose-600">
                    {weeklyAvg.fat}g
                  </p>
                  <p className="text-[10px] text-muted uppercase">Fat</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Day List */}
          {entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry, idx) => {
                const progress = entry.targetCalories
                  ? Math.min(
                      (entry.totalCalories / entry.targetCalories) * 100,
                      100
                    )
                  : 0;

                return (
                  <motion.button
                    key={entry.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    onClick={() => navigateToDay(entry.date)}
                    className="flex w-full items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md text-left"
                  >
                    {/* Date */}
                    <div className="flex flex-col items-center flex-shrink-0 min-w-[50px]">
                      <span className="text-[10px] font-medium text-muted uppercase">
                        {entry.dayOfWeek}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {entry.displayDate}
                      </span>
                    </div>

                    {/* Progress & Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            {entry.totalCalories} kcal
                          </span>
                        </div>
                        {entry.targetCalories && (
                          <span className="text-xs text-muted">
                            / {entry.targetCalories} target
                          </span>
                        )}
                      </div>

                      {/* Calorie Progress Bar */}
                      {entry.targetCalories && (
                        <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              progress >= 100 ? 'bg-red-500' : 'bg-primary'
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}

                      {/* Macros */}
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-blue-600 font-medium">
                          P: {entry.totalProtein}g
                        </span>
                        <span className="text-amber-600 font-medium">
                          C: {entry.totalCarbs}g
                        </span>
                        <span className="text-rose-600 font-medium">
                          F: {entry.totalFat}g
                        </span>
                        <span className="text-muted">
                          {entry.mealCount} meal{entry.mealCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
              <CalendarDays className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900">
                No nutrition history
              </h3>
              <p className="mt-1 text-sm text-muted">
                Start logging meals to see your history here
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
