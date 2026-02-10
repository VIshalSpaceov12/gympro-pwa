import { Request, Response } from 'express';
import { prisma } from '@gympro/database';
import { sendSuccess, sendError } from '../utils/response.js';
import type { PaginatedResponse } from '@gympro/shared';

// ==========================================
// POSTS
// ==========================================

// GET /api/posts — paginated feed
export async function getPosts(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where = { isPublished: true };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
          likes: {
            where: { userId: req.user.userId },
            select: { id: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Transform to include hasLiked boolean
    const transformed = posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isPublished: post.isPublished,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      _count: post._count,
      hasLiked: post.likes.length > 0,
    }));

    const response: PaginatedResponse<(typeof transformed)[0]> = {
      data: transformed,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get posts error:', error);
    sendError(res, 'Failed to fetch posts', 500);
  }
}

// POST /api/posts — create a post
export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { content, imageUrl } = req.body;

    const post = await prisma.post.create({
      data: {
        userId: req.user.userId,
        content,
        imageUrl: imageUrl || null,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    sendSuccess(res, post, 201);
  } catch (error) {
    console.error('Create post error:', error);
    sendError(res, 'Failed to create post', 500);
  }
}

// GET /api/posts/:id — single post with comments
export async function getPostById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { comments: true, likes: true },
        },
        likes: {
          where: { userId: req.user.userId },
          select: { id: true },
        },
      },
    });

    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    if (!post.isPublished && post.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      sendError(res, 'Post not found', 404);
      return;
    }

    const result = {
      ...post,
      hasLiked: post.likes.length > 0,
      likes: undefined, // Remove raw likes array from response
    };

    sendSuccess(res, result);
  } catch (error) {
    console.error('Get post by ID error:', error);
    sendError(res, 'Failed to fetch post', 500);
  }
}

// DELETE /api/posts/:id — delete own post or admin
export async function deletePost(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    if (post.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      sendError(res, 'Not authorized to delete this post', 403);
      return;
    }

    await prisma.post.delete({ where: { id } });

    sendSuccess(res, { message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    sendError(res, 'Failed to delete post', 500);
  }
}

// POST /api/posts/:id/like — toggle like
export async function likePost(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const postId = req.params.id as string;
    const userId = req.user.userId;

    // Check if post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
      // Unlike — remove the like and decrement count
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existingLike.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      sendSuccess(res, { liked: false, likesCount: post.likesCount - 1 });
    } else {
      // Like — create the like and increment count
      await prisma.$transaction([
        prisma.like.create({ data: { postId, userId } }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);

      sendSuccess(res, { liked: true, likesCount: post.likesCount + 1 });
    }
  } catch (error) {
    console.error('Like post error:', error);
    sendError(res, 'Failed to toggle like', 500);
  }
}

// ==========================================
// COMMENTS
// ==========================================

// GET /api/posts/:id/comments — paginated comments
export async function getPostComments(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const postId = req.params.id as string;
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Check post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    const where = { postId };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof comments)[0]> = {
      data: comments,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get post comments error:', error);
    sendError(res, 'Failed to fetch comments', 500);
  }
}

// POST /api/posts/:id/comments — create a comment
export async function createComment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const postId = req.params.id as string;
    const { content } = req.body;

    // Check post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    // Create comment and increment count in a transaction
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          userId: req.user.userId,
          content,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);

    sendSuccess(res, comment, 201);
  } catch (error) {
    console.error('Create comment error:', error);
    sendError(res, 'Failed to create comment', 500);
  }
}

// DELETE /api/comments/:id — delete own comment or admin
export async function deleteComment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      sendError(res, 'Comment not found', 404);
      return;
    }

    if (comment.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      sendError(res, 'Not authorized to delete this comment', 403);
      return;
    }

    // Delete comment and decrement count in a transaction
    await prisma.$transaction([
      prisma.comment.delete({ where: { id } }),
      prisma.post.update({
        where: { id: comment.postId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);

    sendSuccess(res, { message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    sendError(res, 'Failed to delete comment', 500);
  }
}

// ==========================================
// ADMIN — Post moderation
// ==========================================

// GET /api/posts/admin/all — admin: all posts with filters
export async function getPostsAdmin(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { page = 1, limit = 20, filter = 'all' } = req.query as {
      page?: number;
      limit?: number;
      filter?: string;
    };
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (filter === 'published') {
      where.isPublished = true;
    } else if (filter === 'hidden') {
      where.isPublished = false;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const response: PaginatedResponse<(typeof posts)[0]> = {
      data: posts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };

    sendSuccess(res, response);
  } catch (error) {
    console.error('Get posts admin error:', error);
    sendError(res, 'Failed to fetch posts', 500);
  }
}

// PATCH /api/posts/:id/visibility — admin: toggle published
export async function togglePostVisibility(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = req.params.id as string;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    const updated = await prisma.post.update({
      where: { id },
      data: { isPublished: !post.isPublished },
    });

    sendSuccess(res, { id: updated.id, isPublished: updated.isPublished });
  } catch (error) {
    console.error('Toggle post visibility error:', error);
    sendError(res, 'Failed to update post visibility', 500);
  }
}
