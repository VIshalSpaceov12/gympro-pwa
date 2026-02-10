'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Star,
  Package,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  imageUrl?: string | null;
  images?: string[] | null;
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError('');
      try {
        const result = await apiClient<ProductDetail>(`/api/products/by-slug/${slug}`);
        if (result.success && result.data) {
          setProduct(result.data);
        } else {
          setError('Product not found');
        }
      } catch {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div>
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="aspect-square w-full max-w-lg mx-auto animate-pulse rounded-xl bg-gray-200" />
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">{error || 'Product not found'}</h2>
        <Link href="/shop" className="mt-3 text-sm font-medium text-primary hover:underline">
          Back to Shop
        </Link>
      </div>
    );
  }

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back button */}
      <Link
        href="/shop"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>

      {/* Product Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative mb-6 aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-xl bg-gray-100 shadow-lg"
      >
        {product.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-20 w-20 text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isFeatured && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white">
              <Star className="h-3.5 w-3.5" />
              Featured
            </span>
          )}
          {discount && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-white">
              -{discount}% OFF
            </span>
          )}
        </div>
      </motion.div>

      {/* Product Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Category Badge */}
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {product.category.name}
        </span>

        {/* Name */}
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

        {/* Price */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-lg text-muted line-through">
              ${product.comparePrice.toFixed(2)}
            </span>
          )}
          {discount && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-700">
              Save {discount}%
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-4 flex items-center gap-2">
          {product.stock > 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                In Stock ({product.stock} available)
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">Out of Stock</span>
            </>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Package className="h-4 w-4" />
              Product Description
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
