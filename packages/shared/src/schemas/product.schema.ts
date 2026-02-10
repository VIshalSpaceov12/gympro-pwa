import { z } from 'zod';

export const createProductCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateProductCategorySchema = createProductCategorySchema.partial();

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  categoryId: z.string().uuid(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
