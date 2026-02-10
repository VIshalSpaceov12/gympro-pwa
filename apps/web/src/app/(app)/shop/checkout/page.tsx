'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle,
  MapPin,
  Phone,
  FileText,
  Loader2,
  Package,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (items.length === 0 && !orderPlaced) {
    router.push('/shop/cart');
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 py-16 shadow-sm">
          <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Login Required</h2>
          <p className="mt-2 text-sm text-muted">
            Please log in to complete your purchase.
          </p>
          <Link
            href="/login"
            className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Order success state
  if (orderPlaced) {
    return (
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 py-16 px-6 shadow-sm text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Placed!</h2>
          <p className="mt-2 text-sm text-muted max-w-sm">
            Your order has been confirmed. We&apos;ll process it and notify you when it ships.
          </p>
          <p className="mt-3 text-xs text-muted">
            Order ID: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{orderId.slice(0, 8)}...</span>
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/shop"
              className="rounded-xl bg-gray-100 dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Continue Shopping
            </Link>
            <Link
              href="/shop/orders"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              View Orders
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      setError('Please enter your shipping address');
      return;
    }
    if (!contactPhone.trim()) {
      setError('Please enter your contact phone number');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await apiClient<{ id: string }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: shippingAddress.trim(),
          contactPhone: contactPhone.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      if (result.success && result.data) {
        setOrderId(result.data.id);
        setOrderPlaced(true);
        clearCart();
      } else {
        setError(result.error || 'Failed to place order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl pb-8">
      {/* Header */}
      <Link
        href="/shop/cart"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>

      {/* Order Items Preview */}
      <div className="mb-6 rounded-xl bg-white dark:bg-gray-900 p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Package className="h-4 w-4" />
          Order Items ({totalItems()})
        </h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {item.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-muted">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-border pt-3 flex justify-between">
          <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
          <span className="text-sm font-bold text-primary">${totalPrice().toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping Details Form */}
      <div className="space-y-4 rounded-xl bg-white dark:bg-gray-900 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Shipping Details</h3>

        {/* Shipping Address */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <MapPin className="h-4 w-4" />
            Shipping Address
          </label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Enter your full shipping address..."
            rows={3}
            className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Phone className="h-4 w-4" />
            Contact Phone
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Enter your phone number..."
            className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <FileText className="h-4 w-4" />
            Order Notes <span className="text-muted">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            rows={2}
            className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-4 text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={submitting}
        className={cn(
          'mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-all',
          submitting
            ? 'cursor-not-allowed bg-primary/70'
            : 'bg-primary hover:bg-primary/90'
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Placing Order...
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            Place Order — ${totalPrice().toFixed(2)}
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-muted">
        By placing your order, you agree to our terms of service.
      </p>
    </div>
  );
}
