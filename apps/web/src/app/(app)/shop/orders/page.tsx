'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  shippingAddress: string;
  contactPhone: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  PENDING: { icon: Clock, label: 'Pending', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
  CONFIRMED: { icon: CheckCircle, label: 'Confirmed', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  PROCESSING: { icon: Package, label: 'Processing', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  SHIPPED: { icon: Truck, label: 'Shipped', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
  DELIVERED: { icon: CheckCircle, label: 'Delivered', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  CANCELLED: { icon: XCircle, label: 'Cancelled', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const result = await apiClient<Order[]>('/api/orders');
        if (result.success && result.data) {
          setOrders(result.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <Link
        href="/shop"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 py-16 shadow-sm">
          <Package className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No Orders Yet</h2>
          <p className="mt-2 text-sm text-muted">Your order history will appear here.</p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => {
            const config = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl bg-white dark:bg-gray-900 p-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-muted font-mono mt-0.5">
                      #{order.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    config.color
                  )}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        {item.product.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{item.product.name}</p>
                        <p className="text-xs text-muted">x{item.quantity} @ ${item.price.toFixed(2)}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-3 border-t border-border pt-3 flex justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-sm font-bold text-primary">${order.total.toFixed(2)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
