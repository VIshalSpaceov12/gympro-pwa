import { prisma } from '@gympro/database';

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  imageUrl: string;
  categorySlug: string;
  isFeatured: boolean;
  stock: number;
}

const PRODUCT_CATEGORIES: SeedCategory[] = [
  {
    name: 'Supplements',
    slug: 'supplements',
    description: 'Premium fitness supplements for peak performance',
    sortOrder: 0,
  },
  {
    name: 'Equipment',
    slug: 'equipment',
    description: 'High-quality gym equipment for home and studio',
    sortOrder: 1,
  },
  {
    name: 'Apparel',
    slug: 'apparel',
    description: 'Stylish and comfortable workout clothing',
    sortOrder: 2,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Essential fitness accessories and gear',
    sortOrder: 3,
  },
];

const PRODUCTS: SeedProduct[] = [
  // Supplements
  {
    name: 'Whey Protein Isolate',
    slug: 'whey-protein-isolate',
    description:
      'Premium whey protein isolate with 25g protein per serving. Fast-absorbing formula perfect for post-workout recovery. Available in chocolate and vanilla flavors.',
    price: 49.99,
    comparePrice: 64.99,
    imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2c104?w=400&h=400&fit=crop',
    categorySlug: 'supplements',
    isFeatured: true,
    stock: 150,
  },
  {
    name: 'Pre-Workout Energy Blend',
    slug: 'pre-workout-energy-blend',
    description:
      'Explosive energy and focus formula with caffeine, beta-alanine, and L-citrulline. Take 30 minutes before your workout for maximum performance.',
    price: 34.99,
    comparePrice: 44.99,
    imageUrl: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=400&h=400&fit=crop',
    categorySlug: 'supplements',
    isFeatured: true,
    stock: 200,
  },
  {
    name: 'BCAA Recovery Complex',
    slug: 'bcaa-recovery-complex',
    description:
      'Branch chain amino acids in a 2:1:1 ratio to support muscle recovery and reduce soreness. Mix with water and sip during your workout.',
    price: 29.99,
    imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400&h=400&fit=crop',
    categorySlug: 'supplements',
    isFeatured: false,
    stock: 120,
  },
  {
    name: 'Creatine Monohydrate',
    slug: 'creatine-monohydrate',
    description:
      'Pure creatine monohydrate powder. 5g per serving. Supports strength, power, and muscle growth. Unflavored, mixes easily.',
    price: 24.99,
    imageUrl: 'https://images.unsplash.com/photo-1619088755808-5c5d80012e21?w=400&h=400&fit=crop',
    categorySlug: 'supplements',
    isFeatured: false,
    stock: 300,
  },

  // Equipment
  {
    name: 'Adjustable Dumbbell Set',
    slug: 'adjustable-dumbbell-set',
    description:
      'Space-saving adjustable dumbbells from 5 to 52.5 lbs. Quick-change weight system with ergonomic grip. Perfect for home gyms.',
    price: 299.99,
    comparePrice: 399.99,
    imageUrl: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop',
    categorySlug: 'equipment',
    isFeatured: true,
    stock: 30,
  },
  {
    name: 'Resistance Band Set (5 Pack)',
    slug: 'resistance-band-set',
    description:
      'Set of 5 resistance bands with varying tensions (10-50 lbs). Includes door anchor, handles, and ankle straps. Portable and versatile.',
    price: 39.99,
    comparePrice: 54.99,
    imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=400&fit=crop',
    categorySlug: 'equipment',
    isFeatured: false,
    stock: 80,
  },
  {
    name: 'Premium Yoga Mat',
    slug: 'premium-yoga-mat',
    description:
      'Extra-thick 6mm non-slip yoga mat with alignment lines. Made from eco-friendly TPE material. Includes carrying strap.',
    price: 44.99,
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
    categorySlug: 'equipment',
    isFeatured: false,
    stock: 60,
  },
  {
    name: 'Pull-Up Bar (Doorway)',
    slug: 'pull-up-bar-doorway',
    description:
      'Heavy-duty doorway pull-up bar with multiple grip positions. Supports up to 300 lbs. No screws or drilling required.',
    price: 34.99,
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=400&fit=crop',
    categorySlug: 'equipment',
    isFeatured: false,
    stock: 45,
  },

  // Apparel
  {
    name: 'Performance Training Tee',
    slug: 'performance-training-tee',
    description:
      'Moisture-wicking performance t-shirt with 4-way stretch fabric. Lightweight and breathable. Available in multiple colors.',
    price: 29.99,
    comparePrice: 39.99,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    categorySlug: 'apparel',
    isFeatured: true,
    stock: 200,
  },
  {
    name: 'Compression Leggings',
    slug: 'compression-leggings',
    description:
      'High-waist compression leggings with squat-proof fabric. Features hidden pocket and flatlock seams for comfort.',
    price: 54.99,
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop',
    categorySlug: 'apparel',
    isFeatured: false,
    stock: 100,
  },
  {
    name: 'Workout Shorts',
    slug: 'workout-shorts',
    description:
      'Lightweight training shorts with built-in liner and zipper pockets. Quick-dry fabric keeps you cool during intense sessions.',
    price: 34.99,
    imageUrl: 'https://images.unsplash.com/photo-1562886877-aaaa5c17965a?w=400&h=400&fit=crop',
    categorySlug: 'apparel',
    isFeatured: false,
    stock: 150,
  },

  // Accessories
  {
    name: 'Gym Gloves (Pair)',
    slug: 'gym-gloves',
    description:
      'Padded weightlifting gloves with wrist support. Breathable mesh back and reinforced palm. Improves grip and prevents calluses.',
    price: 19.99,
    imageUrl: 'https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?w=400&h=400&fit=crop',
    categorySlug: 'accessories',
    isFeatured: false,
    stock: 250,
  },
  {
    name: 'Insulated Shaker Bottle',
    slug: 'insulated-shaker-bottle',
    description:
      'Double-wall insulated 24oz shaker bottle with blender ball. Keeps drinks cold for hours. Leak-proof design.',
    price: 14.99,
    comparePrice: 19.99,
    imageUrl: 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=400&h=400&fit=crop',
    categorySlug: 'accessories',
    isFeatured: true,
    stock: 400,
  },
  {
    name: 'Lifting Belt',
    slug: 'lifting-belt',
    description:
      'Premium leather lifting belt with double-prong buckle. 4-inch width provides optimal core support for heavy lifts.',
    price: 59.99,
    comparePrice: 79.99,
    imageUrl: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=400&h=400&fit=crop',
    categorySlug: 'accessories',
    isFeatured: false,
    stock: 70,
  },
];

export async function seedProducts(): Promise<void> {
  console.log('Seeding products...');

  // Check if products already exist
  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(`  Products already seeded (${existingCount} found). Skipping.`);
    return;
  }

  // Seed categories
  const categoryMap: Record<string, string> = {};

  for (const cat of PRODUCT_CATEGORIES) {
    const existing = await prisma.productCategory.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      categoryMap[cat.slug] = existing.id;
      console.log(`  Category already exists: "${cat.name}"`);
    } else {
      const created = await prisma.productCategory.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          sortOrder: cat.sortOrder,
        },
      });
      categoryMap[cat.slug] = created.id;
      console.log(`  Created category: "${cat.name}"`);
    }
  }

  // Seed products
  for (const product of PRODUCTS) {
    const categoryId = categoryMap[product.categorySlug];
    if (!categoryId) {
      console.log(`  Skipping product "${product.name}" — category not found`);
      continue;
    }

    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice || null,
        imageUrl: product.imageUrl,
        categoryId,
        isFeatured: product.isFeatured,
        isActive: true,
        stock: product.stock,
      },
    });

    console.log(`  Created product: "${product.name}"`);
  }

  console.log('Product seeding complete.');
}
