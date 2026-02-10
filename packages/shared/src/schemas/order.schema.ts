import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: z.string().min(5, 'Shipping address is required').max(500),
  contactPhone: z.string().min(5, 'Phone number is required').max(30),
  notes: z.string().max(500).optional(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
