'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Flame,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  quantity: number;
}

interface SelectedItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseQuantity: number;
}

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Breakfast', icon: '🌅' },
  { value: 'LUNCH', label: 'Lunch', icon: '☀️' },
  { value: 'DINNER', label: 'Dinner', icon: '🌙' },
  { value: 'SNACK', label: 'Snack', icon: '🍎' },
] as const;

function AddMealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = searchParams.get('type') || 'BREAKFAST';
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const planId = searchParams.get('planId') || '';

  const [mealType, setMealType] = useState(initialType);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchFood = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const result = await apiClient<FoodResult[]>(
        `/api/nutrition/food-search?q=${encodeURIComponent(query)}`
      );
      if (result.success && result.data) {
        setSearchResults(result.data);
        setShowResults(true);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchFood(value);
    }, 300);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addItem = (food: FoodResult) => {
    const newItem: SelectedItem = {
      id: `${food.name}-${Date.now()}`,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      quantity: food.quantity,
      unit: food.unit,
      baseCalories: food.calories,
      baseProtein: food.protein,
      baseCarbs: food.carbs,
      baseFat: food.fat,
      baseQuantity: food.quantity,
    };
    setSelectedItems((prev) => [...prev, newItem]);
    setSearchInput('');
    setShowResults(false);
    setSearchResults([]);
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(item.baseQuantity, item.quantity + delta * item.baseQuantity);
        const multiplier = newQty / item.baseQuantity;
        return {
          ...item,
          quantity: newQty,
          calories: Math.round(item.baseCalories * multiplier),
          protein: Math.round(item.baseProtein * multiplier * 10) / 10,
          carbs: Math.round(item.baseCarbs * multiplier * 10) / 10,
          fat: Math.round(item.baseFat * multiplier * 10) / 10,
        };
      })
    );
  };

  const totalCalories = selectedItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = selectedItems.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = selectedItems.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = selectedItems.reduce((sum, item) => sum + item.fat, 0);

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      setError('Add at least one food item');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const mealLabel = MEAL_TYPES.find((t) => t.value === mealType)?.label || mealType;

      if (planId) {
        // Quick-add meal to existing plan
        const result = await apiClient('/api/nutrition/meals', {
          method: 'POST',
          body: JSON.stringify({
            mealPlanId: planId,
            type: mealType,
            name: mealLabel,
            items: selectedItems.map((item) => ({
              name: item.name,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              quantity: item.quantity,
              unit: item.unit,
            })),
          }),
        });

        if (result.success) {
          router.push(`/nutrition`);
        } else {
          setError('Failed to save meal. Please try again.');
        }
      } else {
        // Create a new meal plan with this meal
        const result = await apiClient('/api/nutrition/meal-plans', {
          method: 'POST',
          body: JSON.stringify({
            name: `Meal Plan - ${dateParam}`,
            date: dateParam,
            targetCalories: 2000,
            meals: [
              {
                type: mealType,
                name: mealLabel,
                items: selectedItems.map((item) => ({
                  name: item.name,
                  calories: item.calories,
                  protein: item.protein,
                  carbs: item.carbs,
                  fat: item.fat,
                  quantity: item.quantity,
                  unit: item.unit,
                })),
              },
            ],
          }),
        });

        if (result.success) {
          router.push(`/nutrition`);
        } else {
          setError('Failed to save meal. Please try again.');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-muted transition-colors hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Add Meal</h1>
        <p className="mt-1 text-sm text-muted">
          Search and add food items to your meal
        </p>
      </motion.div>

      {/* Meal Type Selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Meal Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setMealType(type.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                mealType === type.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <span className="text-lg">{type.icon}</span>
              <span className="text-xs">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Food Search */}
      <div ref={searchContainerRef} className="relative mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Food
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search for food (e.g., chicken, rice)..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-10 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:text-white"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-white shadow-lg dark:bg-gray-900"
            >
              {searchResults.map((food, idx) => (
                <button
                  key={`${food.name}-${idx}`}
                  onClick={() => addItem(food)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-b-0 dark:hover:bg-gray-800 dark:border-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {food.name}
                    </p>
                    <p className="text-xs text-muted">
                      {food.quantity} {food.unit} &middot;{' '}
                      <span className="text-blue-600">P:{food.protein}g</span>{' '}
                      <span className="text-amber-600">C:{food.carbs}g</span>{' '}
                      <span className="text-rose-600">F:{food.fat}g</span>
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {food.calories} kcal
                    </span>
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {showResults && searchInput.length >= 2 && searchResults.length === 0 && !searching && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-white p-6 text-center shadow-lg dark:bg-gray-900">
            <p className="text-sm text-muted">No foods found for &quot;{searchInput}&quot;</p>
          </div>
        )}
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected Items ({selectedItems.length})
          </h3>
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-gray-900"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted">
                    {item.quantity} {item.unit} &middot; {item.calories} kcal
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => updateItemQuantity(item.id, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[40px] text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    onClick={() => updateItemQuantity(item.id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Totals Preview */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Meal Totals</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{totalCalories}</p>
              <p className="text-[10px] text-muted uppercase">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">
                {Math.round(totalProtein * 10) / 10}g
              </p>
              <p className="text-[10px] text-muted uppercase">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">
                {Math.round(totalCarbs * 10) / 10}g
              </p>
              <p className="text-[10px] text-muted uppercase">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-rose-600">
                {Math.round(totalFat * 10) / 10}g
              </p>
              <p className="text-[10px] text-muted uppercase">Fat</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || selectedItems.length === 0}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all',
          selectedItems.length > 0
            ? 'bg-primary text-white hover:bg-primary-dark shadow-sm'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
        )}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {saving ? 'Saving...' : 'Save Meal'}
      </button>
    </div>
  );
}

export default function AddMealPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AddMealContent />
    </Suspense>
  );
}
