'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Save,
  X,
  Plus,
  Dumbbell,
  Clock,
  Weight,
  RotateCcw,
  Play,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Exercise {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  restSeconds: number | null;
  sortOrder: number;
  notes: string | null;
}

interface CustomWorkout {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  exercises: Exercise[];
}

interface ExerciseForm {
  exerciseName: string;
  sets: number;
  reps: number | '';
  weight: number | '';
  restSeconds: number | '';
  notes: string;
}

export default function CustomWorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [workout, setWorkout] = useState<CustomWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editExercises, setEditExercises] = useState<ExerciseForm[]>([]);

  const fetchWorkout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient<CustomWorkout>(`/api/custom-workouts/${id}`);
      if (result.success && result.data) {
        setWorkout(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  const startEditing = () => {
    if (!workout) return;
    setEditName(workout.name);
    setEditDescription(workout.description || '');
    setEditIsPublic(workout.isPublic);
    setEditExercises(
      workout.exercises.map((ex) => ({
        exerciseName: ex.exerciseName,
        sets: ex.sets,
        reps: ex.reps ?? '',
        weight: ex.weight ?? '',
        restSeconds: ex.restSeconds ?? '',
        notes: ex.notes || '',
      }))
    );
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError(null);
  };

  const addExercise = () => {
    setEditExercises([
      ...editExercises,
      { exerciseName: '', sets: 3, reps: 10, weight: '', restSeconds: 60, notes: '' },
    ]);
  };

  const removeExercise = (index: number) => {
    if (editExercises.length <= 1) return;
    setEditExercises(editExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseForm, value: string | number) => {
    const updated = [...editExercises];
    updated[index] = { ...updated[index], [field]: value };
    setEditExercises(updated);
  };

  const handleSave = async () => {
    setError(null);

    if (!editName.trim()) {
      setError('Workout name is required');
      return;
    }

    if (editExercises.some((ex) => !ex.exerciseName.trim())) {
      setError('All exercises must have a name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: editName.trim(),
        description: editDescription.trim() || null,
        isPublic: editIsPublic,
        exercises: editExercises.map((ex) => ({
          exerciseName: ex.exerciseName.trim(),
          sets: ex.sets,
          reps: ex.reps || undefined,
          weight: ex.weight || undefined,
          restSeconds: ex.restSeconds || undefined,
          notes: ex.notes.trim() || undefined,
        })),
      };

      const result = await apiClient<CustomWorkout>(`/api/custom-workouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (result.success && result.data) {
        setWorkout(result.data);
        setEditing(false);
      } else {
        setError(result.error || 'Failed to update workout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workout');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await apiClient(`/api/custom-workouts/${id}`, {
        method: 'DELETE',
      });

      if (result.success) {
        router.push('/my-workouts');
      } else {
        setError(result.error || 'Failed to delete workout');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted">Loading workout...</p>
      </div>
    );
  }

  if (error && !workout) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/my-workouts"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Back to Workouts
          </Link>
          <button
            onClick={fetchWorkout}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!workout) return null;

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

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-2xl font-bold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{workout.name}</h1>
            )}
            {!editing && workout.description && (
              <p className="mt-1 text-sm text-muted">{workout.description}</p>
            )}
            {!editing && (
              <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                <span>{workout.exercises.length} exercises</span>
                <span>Created {new Date(workout.createdAt).toLocaleDateString()}</span>
                {workout.isPublic && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">
                    Public
                  </span>
                )}
              </div>
            )}
          </div>

          {!editing && (
            <div className="ml-4 flex items-center gap-2">
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Edit mode: description + public toggle */}
      {editing && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe your workout..."
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="editIsPublic"
                type="checkbox"
                checked={editIsPublic}
                onChange={(e) => setEditIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="editIsPublic" className="text-sm text-gray-700">
                Make this workout public
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="mb-6">
        {editing && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Exercises ({editExercises.length})
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
        )}

        {editing ? (
          <div className="space-y-4">
            {editExercises.map((exercise, index) => (
              <div key={index} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted">Exercise {index + 1}</span>
                  {editExercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={exercise.exerciseName}
                    onChange={(e) => updateExercise(index, 'exerciseName', e.target.value)}
                    placeholder="Exercise name"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Sets</label>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Reps</label>
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
                      <label className="mb-1 block text-xs font-medium text-gray-600">Weight (kg)</label>
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
                      <label className="mb-1 block text-xs font-medium text-gray-600">Rest (sec)</label>
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
                  <input
                    type="text"
                    value={exercise.notes}
                    onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                    placeholder="Notes (optional)"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExercise}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Add Another Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workout.exercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {exercise.exerciseName}
                    </h3>
                    {exercise.notes && (
                      <p className="mt-1 text-sm text-muted">{exercise.notes}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted">#{index + 1}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    {exercise.sets} sets
                  </span>
                  {exercise.reps && (
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className="h-4 w-4 text-primary" />
                      {exercise.reps} reps
                    </span>
                  )}
                  {exercise.weight && (
                    <span className="flex items-center gap-1.5">
                      <Weight className="h-4 w-4 text-primary" />
                      {exercise.weight} kg
                    </span>
                  )}
                  {exercise.restSeconds && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      {exercise.restSeconds}s rest
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {editing ? (
        <div className="flex gap-3">
          <button
            onClick={cancelEditing}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm opacity-50 cursor-not-allowed"
          title="Coming soon"
        >
          <Play className="h-4 w-4" />
          Start Workout (Coming Soon)
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold text-gray-900">Delete Workout</h3>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete &quot;{workout.name}&quot;? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
