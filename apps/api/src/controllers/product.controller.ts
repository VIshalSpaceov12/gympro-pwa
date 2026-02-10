import { Request, Response } from 'express';
import { prisma } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';
import type { PaginatedResponse } from '@gympro/shared';

// ==========================================
// PUBLIC — Products
// ==========================================

// GET /api/products — paginated, filter by categoryId, search by name, sort
export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      limit = 12,
      categoryId,
      search,
      sort = 'createdAt',
      order = 'desc',
    } = req.query as {
      page?: number;
      limit?: number;
      categoryId?: string;
      search?: string;
      sort?: string;
      order?: string;
    };

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 12, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { isActive: true };

    if (categoryId) {
      where.categoryId = String(categoryId);
    }

    if (search) {
      where.name = { contains: String(search), mode: 'insensitive' };
    }

    // Build sort
    const validSorts = ['price', 'name', 'createdAt'];
    const sortField = validSorts.includes(String(sort)) ? String(sort) : 'createdAt';
    const sortOrder = String(order) === 'asc' ? 'asc' : 'desc';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof products)[0]> = {
      data: products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get products error:', error);
    sendError(res, 'Failed to fetch products', 500);
  }
}

// GET /api/products/featured — featured active products
export async function getFeaturedProducts(req: Request, res: Response): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    sendSuccess(res, products);
  } catch (error) {
    console.error('Get featured products error:', error);
    sendError(res, 'Failed to fetch featured products', 500);
  }
}

// GET /api/products/categories — all categories with product count
export async function getProductCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      sortOrder: cat.sortOrder,
      productCount: cat._count.products,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    sendSuccess(res, result);
  } catch (error) {
    console.error('Get product categories error:', error);
    sendError(res, 'Failed to fetch product categories', 500);
  }
}

// GET /api/products/:id — single product (only active)
export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product || !product.isActive) {
      sendError(res, 'Product not found', 404);
      return;
    }

    sendSuccess(res, product);
  } catch (error) {
    console.error('Get product by ID error:', error);
    sendError(res, 'Failed to fetch product', 500);
  }
}

// GET /api/products/by-slug/:slug — single product by slug (only active)
export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slug = req.params.slug as string;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product || !product.isActive) {
      sendError(res, 'Product not found', 404);
      return;
    }

    sendSuccess(res, product);
  } catch (error) {
    console.error('Get product by slug error:', error);
    sendError(res, 'Failed to fetch product', 500);
  }
}

// ==========================================
// ADMIN — Products
// ==========================================

// GET /api/products/admin/all — all products (including inactive)
export async function adminGetProducts(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      limit = 20,
      filter = 'all',
      search,
    } = req.query as {
      page?: number;
      limit?: number;
      filter?: string;
      search?: string;
    };

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (filter === 'active') {
      where.isActive = true;
    } else if (filter === 'inactive') {
      where.isActive = false;
    } else if (filter === 'featured') {
      where.isFeatured = true;
    }

    if (search) {
      where.name = { contains: String(search), mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof products)[0]> = {
      data: products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Admin get products error:', error);
    sendError(res, 'Failed to fetch products', 500);
  }
}

// POST /api/products — create product
export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      imageUrl,
      images,
      categoryId,
      isFeatured,
      isActive,
      stock,
    } = req.body;

    // Check category exists
    const category = await prisma.productCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      sendError(res, 'Product category not found', 404);
      return;
    }

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      sendError(res, 'A product with this slug already exists', 409);
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price,
        comparePrice: comparePrice || null,
        imageUrl: imageUrl || null,
        images: images || null,
        categoryId,
        isFeatured: isFeatured ?? false,
        isActive: isActive ?? true,
        stock: stock ?? 0,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    sendSuccess(res, product, 201);
  } catch (error) {
    console.error('Create product error:', error);
    sendError(res, 'Failed to create product', 500);
  }
}

// PUT /api/products/:id — update product
export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Product not found', 404);
      return;
    }

    // If slug is being changed, check uniqueness
    if (req.body.slug && req.body.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug: req.body.slug } });
      if (slugExists) {
        sendError(res, 'A product with this slug already exists', 409);
        return;
      }
    }

    // If categoryId is being changed, check it exists
    if (req.body.categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: req.body.categoryId },
      });
      if (!category) {
        sendError(res, 'Product category not found', 404);
        return;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    sendSuccess(res, product);
  } catch (error) {
    console.error('Update product error:', error);
    sendError(res, 'Failed to update product', 500);
  }
}

// DELETE /api/products/:id — delete product
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Product not found', 404);
      return;
    }

    await prisma.product.delete({ where: { id } });

    sendSuccess(res, { message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    sendError(res, 'Failed to delete product', 500);
  }
}

// ==========================================
// ADMIN — Product Categories
// ==========================================

// POST /api/products/categories — create category
export async function createProductCategory(req: Request, res: Response): Promise<void> {
  try {
    const { name, slug, description, imageUrl, sortOrder } = req.body;

    // Check slug uniqueness
    const existing = await prisma.productCategory.findUnique({ where: { slug } });
    if (existing) {
      sendError(res, 'A category with this slug already exists', 409);
      return;
    }

    // Check name uniqueness
    const nameExists = await prisma.productCategory.findUnique({ where: { name } });
    if (nameExists) {
      sendError(res, 'A category with this name already exists', 409);
      return;
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    sendSuccess(res, category, 201);
  } catch (error) {
    console.error('Create product category error:', error);
    sendError(res, 'Failed to create product category', 500);
  }
}

// PUT /api/products/categories/:id — update category
export async function updateProductCategory(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Product category not found', 404);
      return;
    }

    // If slug is being changed, check uniqueness
    if (req.body.slug && req.body.slug !== existing.slug) {
      const slugExists = await prisma.productCategory.findUnique({
        where: { slug: req.body.slug },
      });
      if (slugExists) {
        sendError(res, 'A category with this slug already exists', 409);
        return;
      }
    }

    // If name is being changed, check uniqueness
    if (req.body.name && req.body.name !== existing.name) {
      const nameExists = await prisma.productCategory.findUnique({
        where: { name: req.body.name },
      });
      if (nameExists) {
        sendError(res, 'A category with this name already exists', 409);
        return;
      }
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: req.body,
    });

    sendSuccess(res, category);
  } catch (error) {
    console.error('Update product category error:', error);
    sendError(res, 'Failed to update product category', 500);
  }
}

// DELETE /api/products/categories/:id — delete category (fail if products exist)
export async function deleteProductCategory(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const existing = await prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      sendError(res, 'Product category not found', 404);
      return;
    }

    if (existing._count.products > 0) {
      sendError(
        res,
        `Cannot delete category "${existing.name}" — it has ${existing._count.products} product(s). Remove or reassign them first.`,
        400
      );
      return;
    }

    await prisma.productCategory.delete({ where: { id } });

    sendSuccess(res, { message: 'Product category deleted successfully' });
  } catch (error) {
    console.error('Delete product category error:', error);
    sendError(res, 'Failed to delete product category', 500);
  }
}
