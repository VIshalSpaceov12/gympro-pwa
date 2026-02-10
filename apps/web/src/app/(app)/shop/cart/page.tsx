'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart.store';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/shop"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 py-16 shadow-sm">
          <ShoppingCart className="mb-4 h-16 w-16 text-gray-200 dark:text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Cart is Empty</h2>
          <p className="mt-2 text-sm text-muted">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/shop"
            className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shopping Cart ({totalItems()} {totalItems() === 1 ? 'item' : 'items'})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.productId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex gap-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm"
            >
              {/* Product Image */}
              <Link href={`/shop/${item.slug}`} className="flex-shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  {item.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Product Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/shop/${item.slug}`}
                    className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-sm font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  {/* Quantity Controls */}
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-l-lg"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex h-8 w-10 items-center justify-center border-x border-border text-xs font-semibold text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-r-lg"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Subtotal + Remove */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Order Summary */}
      <div className="mt-6 rounded-xl bg-white dark:bg-gray-900 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Order Summary</h3>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal ({totalItems()} items)</span>
            <span className="font-medium text-gray-900 dark:text-white">${totalPrice().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Shipping</span>
            <span className="font-medium text-green-600">Free</span>
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex justify-between">
              <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-base font-bold text-gray-900 dark:text-white">${totalPrice().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={() => router.push('/shop/checkout')}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary/90"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
