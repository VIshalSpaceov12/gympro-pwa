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
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  imageUrl?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  comparePrice: string;
  imageUrl: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  stock: string;
}

const emptyForm: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  price: '',
  comparePrice: '',
  imageUrl: '',
  categoryId: '',
  isFeatured: false,
  isActive: true,
  stock: '0',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const result = await apiClient<ProductCategory[]>('/api/products/categories');
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        filter,
      });
      if (searchQuery) params.set('search', searchQuery);

      const result = await apiClient<PaginatedProducts>(
        `/api/products/admin/all?${params}`
      );
      if (result.success && result.data) {
        setProducts(result.data.data);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      stock: product.stock.toString(),
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
    const newData: ProductFormData = { ...formData, name };
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
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      setFormError('Please enter a valid price.');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Please select a category.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        stock: parseInt(formData.stock, 10) || 0,
      };

      if (formData.description.trim()) body.description = formData.description.trim();
      if (formData.imageUrl.trim()) body.imageUrl = formData.imageUrl.trim();
      if (formData.comparePrice && !isNaN(Number(formData.comparePrice))) {
        body.comparePrice = parseFloat(formData.comparePrice);
      }

      if (editingId) {
        await apiClient(`/api/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setSuccessMsg('Product updated successfully.');
      } else {
        await apiClient('/api/products', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setSuccessMsg('Product created successfully.');
      }

      closeForm();
      await fetchProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient(`/api/products/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setDeleteTarget(null);
      setSuccessMsg('Product deleted successfully.');
      await fetchProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete product.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Featured', value: 'featured' },
  ];

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
        <p className="text-sm text-gray-500">{total} products total</p>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm min-h-[40px] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === f.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Form Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Whey Protein Isolate"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Slug */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., whey-protein-isolate"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-gray-400 mt-1">URL-friendly identifier (auto-generated from name)</p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this product..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 49.99"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Compare Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Compare Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.comparePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, comparePrice: e.target.value })
                    }
                    placeholder="e.g., 64.99"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-gray-400 mt-1">Original price for showing discount</p>
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
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

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="e.g., 100"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Toggles */}
                <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({ ...formData, isFeatured: e.target.checked })
                      }
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                    />
                    <span className="text-sm text-gray-700">Featured product</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                    />
                    <span className="text-sm text-gray-700">Active (visible in shop)</span>
                  </label>
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

      {/* Products table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No products found.</p>
            <button
              onClick={openAddForm}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Featured</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Active</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.category?.name || '\u2014'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-xs text-muted line-through">
                            ${product.comparePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                          product.stock > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.isFeatured ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Featured
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex w-2.5 h-2.5 rounded-full',
                          product.isActive ? 'bg-green-500' : 'bg-gray-300'
                        )}
                        title={product.isActive ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(product)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
