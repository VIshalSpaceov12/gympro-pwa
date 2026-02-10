'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  FolderOpen,
  ImageIcon,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  videoCount: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  imageUrl: string;
}

const emptyForm: CategoryFormData = { name: '', description: '', imageUrl: '' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const result = await apiClient<Category[]>('/api/workouts/categories');
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const body: Record<string, string | undefined> = {
        name: formData.name.trim(),
      };
      if (formData.description.trim()) body.description = formData.description.trim();
      if (formData.imageUrl.trim()) body.imageUrl = formData.imageUrl.trim();

      if (editingId) {
        await apiClient(`/api/workouts/categories/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setSuccessMsg('Category updated successfully.');
      } else {
        await apiClient('/api/workouts/categories', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setSuccessMsg('Category created successfully.');
      }

      closeForm();
      await fetchCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await apiClient(`/api/workouts/categories/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setDeleteTarget(null);
      setSuccessMsg('Category deleted successfully.');
      await fetchCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete category.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error message */}
      {formError && !formOpen && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {formError}
          <button onClick={() => setFormError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{categories.length} categories total</p>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm min-h-[40px]"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Category' : 'Add Category'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Strength Training"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Image URL
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 min-h-[40px]"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No categories yet.</p>
            <button
              onClick={openAddForm}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Videos</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Sort Order</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 max-w-[250px] truncate">
                      {category.description || '\u2014'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {category.videoCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600">{category.sortOrder}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(category)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(category)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone. Any videos in this category may be affected.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
