import { Request, Response } from 'express';
import { prisma } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';

// POST /api/orders — create order from cart
export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { items, shippingAddress, contactPhone, notes } = req.body as {
      items: { productId: string; quantity: number }[];
      shippingAddress: string;
      contactPhone: string;
      notes?: string;
    };

    // Fetch all requested products
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      sendError(res, 'One or more products are unavailable', 400);
      return;
    }

    // Validate stock
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        sendError(
          res,
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          400
        );
        return;
      }
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    // Create order + items + decrement stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total: Math.round(total * 100) / 100,
          shippingAddress,
          contactPhone,
          notes: notes || null,
          status: 'CONFIRMED',
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)!.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, imageUrl: true },
              },
            },
          },
        },
      });

      // Decrement stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    sendSuccess(res, order, 201);
  } catch (error) {
    console.error('Create order error:', error);
    sendError(res, 'Failed to create order', 500);
  }
}

// GET /api/orders — user's orders
export async function getMyOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, imageUrl: true },
            },
          },
        },
      },
    });

    sendSuccess(res, orders);
  } catch (error) {
    console.error('Get orders error:', error);
    sendError(res, 'Failed to fetch orders', 500);
  }
}

// GET /api/orders/:id — single order
export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    sendSuccess(res, order);
  } catch (error) {
    console.error('Get order by ID error:', error);
    sendError(res, 'Failed to fetch order', 500);
  }
}
