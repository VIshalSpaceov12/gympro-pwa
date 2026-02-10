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
  Tag,
} from 'lucide-react';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
}

const emptyForm: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  sortOrder: '0',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient<ProductCategory[]>('/api/products/categories');
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch {
      // ignore
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

  const openEditForm = (category: ProductCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      sortOrder: category.sortOrder.toString(),
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

  const handleNameChange = (name: string) => {
    const newData: CategoryFormData = { ...formData, name };
    // Auto-generate slug if not editing or if slug matches old auto-slug
    if (!editingId || formData.slug === slugify(formData.name)) {
      newData.slug = slugify(name);
    }
    setFormData(newData);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setFormError('Slug is required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        sortOrder: parseInt(formData.sortOrder, 10) || 0,
      };

      if (formData.description.trim()) body.description = formData.description.trim();
      if (formData.imageUrl.trim()) body.imageUrl = formData.imageUrl.trim();

      if (editingId) {
        await apiClient(`/api/products/categories/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setSuccessMsg('Category updated successfully.');
      } else {
        await apiClient('/api/products/categories', {
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
      await apiClient(`/api/products/categories/${deleteTarget.id}`, {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{categories.length} categories</p>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm min-h-[40px] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Category Form Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden my-auto">
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

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Supplements"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., supplements"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">URL-friendly identifier (auto-generated from name)</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this category..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
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
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No product categories found.</p>
            <button
              onClick={openAddForm}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              Add your first category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Products</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Sort Order</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {cat.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Tag className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900">{cat.name}</span>
                          {cat.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {cat.slug}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {cat.productCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {cat.sortOrder}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(cat)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
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
        message={
          deleteTarget?.productCount && deleteTarget.productCount > 0
            ? `Cannot delete "${deleteTarget.name}" because it has ${deleteTarget.productCount} product(s). Remove or reassign them first.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
