'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ExerciseForm {
  exerciseName: string;
  sets: number;
  reps: number | '';
  weight: number | '';
  restSeconds: number | '';
  notes: string;
}

const emptyExercise: ExerciseForm = {
  exerciseName: '',
  sets: 3,
  reps: 10,
  weight: '',
  restSeconds: 60,
  notes: '',
};

export default function CreateWorkoutPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [exercises, setExercises] = useState<ExerciseForm[]>([{ ...emptyExercise }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addExercise = () => {
    setExercises([...exercises, { ...emptyExercise }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseForm, value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Workout name is required');
      return;
    }

    if (exercises.some((ex) => !ex.exerciseName.trim())) {
      setError('All exercises must have a name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        exercises: exercises.map((ex) => ({
          exerciseName: ex.exerciseName.trim(),
          sets: ex.sets,
          reps: ex.reps || undefined,
          weight: ex.weight || undefined,
          restSeconds: ex.restSeconds || undefined,
          notes: ex.notes.trim() || undefined,
        })),
      };

      const result = await apiClient('/api/custom-workouts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (result.success) {
        router.push('/my-workouts');
      } else {
        setError(result.error || 'Failed to create workout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout');
    } finally {
      setSaving(false);
    }
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
        <Link
          href="/my-workouts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Workouts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Create Workout</h1>
        <p className="mt-1 text-sm text-muted">
          Build your custom workout routine
        </p>
      </motion.div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Workout Details */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Workout Details</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Workout Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Upper Body Strength"
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your workout routine..."
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this workout public
              </label>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Exercises ({exercises.length})
            </h2>
            <button
              type="button"
              onClick={addExercise}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </button>
          </div>

          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300" />
                    <span className="text-sm font-medium text-muted">
                      Exercise {index + 1}
                    </span>
                  </div>
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="flex items-center gap-1 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Exercise Name *
                    </label>
                    <input
                      type="text"
                      value={exercise.exerciseName}
                      onChange={(e) => updateExercise(index, 'exerciseName', e.target.value)}
                      placeholder="e.g., Bench Press"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Sets *
                      </label>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Reps
                      </label>
                      <input
                        type="number"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', e.target.value ? parseInt(e.target.value) : '')}
                        min={1}
                        placeholder="--"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={exercise.weight}
                        onChange={(e) => updateExercise(index, 'weight', e.target.value ? parseFloat(e.target.value) : '')}
                        min={0}
                        step={0.5}
                        placeholder="--"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Rest (sec)
                      </label>
                      <input
                        type="number"
                        value={exercise.restSeconds}
                        onChange={(e) => updateExercise(index, 'restSeconds', e.target.value ? parseInt(e.target.value) : '')}
                        min={0}
                        step={5}
                        placeholder="--"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={exercise.notes}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      placeholder="Optional notes..."
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            onClick={addExercise}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add Another Exercise
          </button>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/my-workouts"
            className="flex-1 rounded-xl border border-border bg-white px-6 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Workout'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
