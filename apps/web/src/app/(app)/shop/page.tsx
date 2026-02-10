'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useCartStore } from '@/stores/cart.store';

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
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function CartButton() {
  const { totalItems } = useCartStore();
  const count = totalItems();

  return (
    <Link
      href="/shop/cart"
      className="relative inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
    >
      <ShoppingCart className="h-4 w-4" />
      Cart
      {count > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl || null,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link href={`/shop/${product.slug}`}>
      <div className="group overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.isFeatured && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                <Star className="h-3 w-3" />
                Featured
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                -{discount}%
              </span>
            )}
          </div>

          {/* Quick Add to Cart */}
          {product.stock > 0 && (
            <button
              onClick={handleQuickAdd}
              className={cn(
                'absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all',
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-gray-300'
              )}
              aria-label="Add to cart"
            >
              {added ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <span className="text-xs font-medium text-primary">{product.category.name}</span>
          <h3 className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-muted line-through">
                ${product.comparePrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm">
      <div className="aspect-square animate-pulse bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);

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

  const fetchFeatured = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const result = await apiClient<Product[]>('/api/products/featured');
      if (result.success && result.data) {
        setFeaturedProducts(result.data);
      }
    } catch {
      // ignore
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(
    async (searchQuery: string, catId: string, pageNum: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (catId) params.set('categoryId', catId);
        params.set('page', String(pageNum));
        params.set('limit', '12');

        const result = await apiClient<PaginatedProducts>(
          `/api/products?${params.toString()}`
        );
        if (result.success && result.data) {
          setProducts(result.data.data);
          setTotalPages(result.data.totalPages);
          setTotal(result.data.total);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCategories();
    fetchFeatured();
  }, [fetchCategories, fetchFeatured]);

  useEffect(() => {
    fetchProducts(debouncedSearch, selectedCategory, page);
  }, [debouncedSearch, selectedCategory, page, fetchProducts]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Shop</h1>
            <p className="mt-1 text-sm text-muted">
              Premium fitness gear, supplements, and apparel
            </p>
          </div>
          <CartButton />
        </div>
      </motion.div>

      {/* Featured Products */}
      {!featuredLoading && featuredProducts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <div
            ref={featuredScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredProducts.map((product) => (
              <div key={product.id} className="w-48 flex-shrink-0 sm:w-56">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-white dark:bg-gray-900 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange('')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            selectedCategory === ''
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              selectedCategory === cat.id
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <p className="mb-3 text-sm text-muted">{total} products found</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 py-16 shadow-sm">
          <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No products found</h3>
          <p className="mt-1 text-sm text-muted">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              page <= 1
                ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              page >= totalPages
                ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
