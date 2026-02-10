'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
  Footprints,
  Dumbbell,
  Flame,
  Droplets,
  Plus,
  Loader2,
  X,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivitySummary {
  today: Record<string, number>;
  weekly: Record<string, number>;
  weeklyDaily: Record<string, Record<string, number>>;
}

interface ActivityLogItem {
  id: string;
  type: string;
  value: number;
  unit: string | null;
  date: string;
  createdAt: string;
}

interface PaginatedHistory {
  data: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const activityTypes = [
  {
    type: 'STEPS',
    label: 'Steps',
    icon: Footprints,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    unit: 'steps',
    defaultValue: 1000,
    quickValues: [1000, 2500, 5000, 10000],
  },
  {
    type: 'WORKOUT',
    label: 'Workouts',
    icon: Dumbbell,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-primary',
    unit: 'sessions',
    defaultValue: 1,
    quickValues: [1, 2, 3],
  },
  {
    type: 'CALORIES_BURNED',
    label: 'Calories',
    icon: Flame,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    unit: 'kcal',
    defaultValue: 200,
    quickValues: [100, 200, 300, 500],
  },
  {
    type: 'WATER',
    label: 'Water',
    icon: Droplets,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    unit: 'glasses',
    defaultValue: 1,
    quickValues: [1, 2, 3, 4],
  },
];

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ActivityPage() {
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [history, setHistory] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logModal, setLogModal] = useState<string | null>(null); // activity type
  const [logValue, setLogValue] = useState<number>(0);
  const [logging, setLogging] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, historyRes] = await Promise.allSettled([
        apiClient<ActivitySummary>('/api/activity/summary'),
        apiClient<PaginatedHistory>('/api/activity/history?limit=10'),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value.success && summaryRes.value.data) {
        setSummary(summaryRes.value.data);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value.success && historyRes.value.data) {
        setHistory(historyRes.value.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openLogModal = (type: string) => {
    const config = activityTypes.find((a) => a.type === type);
    setLogValue(config?.defaultValue ?? 1);
    setLogModal(type);
  };

  const handleLogActivity = async () => {
    if (!logModal || logValue <= 0) return;

    setLogging(true);
    try {
      const config = activityTypes.find((a) => a.type === logModal);
      const result = await apiClient('/api/activity/log', {
        method: 'POST',
        body: JSON.stringify({
          type: logModal,
          value: logValue,
          unit: config?.unit,
        }),
      });

      if (result.success) {
        setLogModal(null);
        fetchData(); // Refresh data
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    } finally {
      setLogging(false);
    }
  };

  const getActivityIcon = (type: string) => {
    return activityTypes.find((a) => a.type === type) ?? activityTypes[0];
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case 'STEPS': return 'Steps';
      case 'WORKOUT': return 'Workout';
      case 'CALORIES_BURNED': return 'Calories Burned';
      case 'WATER': return 'Water';
      default: return type;
    }
  };

  // Compute weekly bar chart data
  const getWeeklyChartData = () => {
    if (!summary?.weeklyDaily) return [];

    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));
    weekStart.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = summary.weeklyDaily[dateKey] || { STEPS: 0, WORKOUT: 0, CALORIES_BURNED: 0, WATER: 0 };
      days.push({
        label: dayLabels[i],
        date: dateKey,
        steps: dayData.STEPS || 0,
        workouts: dayData.WORKOUT || 0,
        calories: dayData.CALORIES_BURNED || 0,
        water: dayData.WATER || 0,
        isToday: dateKey === now.toISOString().split('T')[0],
      });
    }
    return days;
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
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Activity</h1>
        <p className="mt-1 text-sm text-muted">Track your daily fitness progress</p>
      </motion.div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted">Loading activity data...</p>
        </div>
      ) : (
        <>
          {/* Today's Stats Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {activityTypes.map((activity, index) => (
              <motion.div
                key={activity.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', activity.iconBg)}>
                    <activity.icon className={cn('h-5 w-5', activity.iconColor)} />
                  </div>
                  <button
                    onClick={() => openLogModal(activity.type)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-muted transition-colors hover:bg-primary hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(summary?.today[activity.type] ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted">{activity.label} today</p>
              </motion.div>
            ))}
          </div>

          {/* Weekly Summary */}
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900">Weekly Summary</h2>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              {/* Weekly totals */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {activityTypes.map((activity) => (
                  <div key={activity.type} className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {Math.round(summary?.weekly[activity.type] ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">{activity.label}</p>
                  </div>
                ))}
              </div>

              {/* Simple bar chart for steps */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">Steps This Week</p>
                <div className="flex items-end justify-between gap-2">
                  {getWeeklyChartData().map((day) => {
                    const maxSteps = Math.max(...getWeeklyChartData().map((d) => d.steps), 1);
                    const heightPercent = Math.max((day.steps / maxSteps) * 100, 4);
                    return (
                      <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] text-muted">
                          {day.steps > 0 ? (day.steps >= 1000 ? `${(day.steps / 1000).toFixed(1)}k` : day.steps) : ''}
                        </span>
                        <div
                          className={cn(
                            'w-full rounded-t-md transition-all',
                            day.isToday ? 'bg-primary' : 'bg-gray-200'
                          )}
                          style={{ height: `${heightPercent}px`, minHeight: '4px', maxHeight: '80px' }}
                        />
                        <span className={cn('text-[10px]', day.isToday ? 'font-bold text-primary' : 'text-muted')}>
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            </div>

            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item, index) => {
                  const config = getActivityIcon(item.type);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', config.iconBg)}>
                        <config.icon className={cn('h-5 w-5', config.iconColor)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formatActivityType(item.type)}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {Math.round(item.value).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted">{item.unit || config.unit}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 shadow-sm">
                <TrendingUp className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-muted">No activity logged yet. Start tracking!</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Log Activity Modal */}
      {logModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Log {formatActivityType(logModal)}
              </h3>
              <button
                onClick={() => setLogModal(null)}
                className="rounded-lg p-1 text-muted hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick value buttons */}
            {(() => {
              const config = activityTypes.find((a) => a.type === logModal);
              return (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {config?.quickValues.map((val) => (
                      <button
                        key={val}
                        onClick={() => setLogValue(val)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                          logValue === val
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {val.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="mb-6">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Custom Value ({config?.unit})
                    </label>
                    <input
                      type="number"
                      value={logValue}
                      onChange={(e) => setLogValue(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={logModal === 'WATER' ? 1 : logModal === 'STEPS' ? 100 : 1}
                      className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              );
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => setLogModal(null)}
                className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogActivity}
                disabled={logging || logValue <= 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {logging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  'Log Activity'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
