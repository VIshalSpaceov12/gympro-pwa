import { prisma, Difficulty } from '@gympro/database';
import dotenv from 'dotenv';

dotenv.config();

interface SeedVideo {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  difficulty: Difficulty;
  equipmentNeeded: string[];
  caloriesBurned: number;
  isPremium: boolean;
}

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  videos: SeedVideo[];
}

const categories: SeedCategory[] = [
  {
    name: 'Strength',
    slug: 'strength',
    description: 'Build muscle and increase power with targeted strength training routines.',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    videos: [
      {
        title: 'Full Body Strength for Beginners',
        description: 'A complete full-body strength workout using bodyweight exercises. Perfect for those just starting their fitness journey.',
        videoUrl: 'https://videos.gymproluxe.com/strength/full-body-beginners.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        duration: 1800,
        difficulty: 'BEGINNER',
        equipmentNeeded: [],
        caloriesBurned: 200,
        isPremium: false,
      },
      {
        title: 'Upper Body Dumbbell Blast',
        description: 'Sculpt your arms, shoulders, and back with this intense dumbbell workout targeting the upper body.',
        videoUrl: 'https://videos.gymproluxe.com/strength/upper-body-dumbbell.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
        duration: 2400,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: ['Dumbbells', 'Bench'],
        caloriesBurned: 320,
        isPremium: false,
      },
      {
        title: 'Barbell Power Complex',
        description: 'Advanced barbell complex combining deadlifts, cleans, and presses for maximum strength gains.',
        videoUrl: 'https://videos.gymproluxe.com/strength/barbell-power.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400',
        duration: 3000,
        difficulty: 'ADVANCED',
        equipmentNeeded: ['Barbell', 'Weight Plates', 'Squat Rack'],
        caloriesBurned: 450,
        isPremium: true,
      },
      {
        title: 'Leg Day Essentials',
        description: 'Strengthen your quads, hamstrings, and glutes with this comprehensive lower body routine.',
        videoUrl: 'https://videos.gymproluxe.com/strength/leg-day.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400',
        duration: 2700,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: ['Dumbbells', 'Resistance Band'],
        caloriesBurned: 380,
        isPremium: false,
      },
    ],
  },
  {
    name: 'Cardio',
    slug: 'cardio',
    description: 'Boost your endurance and burn calories with high-energy cardio workouts.',
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800',
    videos: [
      {
        title: 'Low Impact Cardio Walk',
        description: 'A gentle indoor walking workout that gets your heart pumping without stressing your joints.',
        videoUrl: 'https://videos.gymproluxe.com/cardio/low-impact-walk.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400',
        duration: 1500,
        difficulty: 'BEGINNER',
        equipmentNeeded: [],
        caloriesBurned: 150,
        isPremium: false,
      },
      {
        title: 'Treadmill Interval Training',
        description: 'Alternate between sprints and recovery periods for maximum calorie burn on the treadmill.',
        videoUrl: 'https://videos.gymproluxe.com/cardio/treadmill-intervals.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400',
        duration: 1800,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: ['Treadmill'],
        caloriesBurned: 350,
        isPremium: false,
      },
      {
        title: 'Endurance Running Program',
        description: 'Build your running stamina with this progressive endurance program designed for serious runners.',
        videoUrl: 'https://videos.gymproluxe.com/cardio/endurance-running.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400',
        duration: 3600,
        difficulty: 'ADVANCED',
        equipmentNeeded: ['Treadmill'],
        caloriesBurned: 600,
        isPremium: true,
      },
    ],
  },
  {
    name: 'Yoga',
    slug: 'yoga',
    description: 'Improve flexibility, balance, and mindfulness through guided yoga sessions.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    videos: [
      {
        title: 'Morning Yoga Flow',
        description: 'Start your day with this gentle 20-minute yoga flow to awaken your body and mind.',
        videoUrl: 'https://videos.gymproluxe.com/yoga/morning-flow.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
        duration: 1200,
        difficulty: 'BEGINNER',
        equipmentNeeded: ['Yoga Mat'],
        caloriesBurned: 100,
        isPremium: false,
      },
      {
        title: 'Vinyasa Power Flow',
        description: 'A dynamic vinyasa sequence linking breath and movement for a powerful, flowing practice.',
        videoUrl: 'https://videos.gymproluxe.com/yoga/vinyasa-power.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad33?w=400',
        duration: 2700,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: ['Yoga Mat', 'Yoga Blocks'],
        caloriesBurned: 250,
        isPremium: false,
      },
      {
        title: 'Advanced Ashtanga Series',
        description: 'Challenge yourself with traditional Ashtanga yoga primary series. For experienced practitioners only.',
        videoUrl: 'https://videos.gymproluxe.com/yoga/ashtanga-advanced.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?w=400',
        duration: 3600,
        difficulty: 'ADVANCED',
        equipmentNeeded: ['Yoga Mat', 'Yoga Strap'],
        caloriesBurned: 350,
        isPremium: true,
      },
      {
        title: 'Restorative Yoga & Deep Stretch',
        description: 'Unwind and restore with long-held poses designed to release tension and promote deep relaxation.',
        videoUrl: 'https://videos.gymproluxe.com/yoga/restorative.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400',
        duration: 2400,
        difficulty: 'BEGINNER',
        equipmentNeeded: ['Yoga Mat', 'Yoga Bolster'],
        caloriesBurned: 80,
        isPremium: false,
      },
    ],
  },
  {
    name: 'HIIT',
    slug: 'hiit',
    description: 'High Intensity Interval Training to torch calories and build explosive fitness.',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    videos: [
      {
        title: '15-Minute HIIT Starter',
        description: 'Quick and effective HIIT workout for beginners. Short intervals with longer rest periods.',
        videoUrl: 'https://videos.gymproluxe.com/hiit/starter-15.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=400',
        duration: 900,
        difficulty: 'BEGINNER',
        equipmentNeeded: [],
        caloriesBurned: 180,
        isPremium: false,
      },
      {
        title: 'Tabata Torch 30',
        description: '30-minute Tabata-style workout with 20 seconds on, 10 seconds off. Prepare to sweat.',
        videoUrl: 'https://videos.gymproluxe.com/hiit/tabata-30.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400',
        duration: 1800,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: [],
        caloriesBurned: 400,
        isPremium: false,
      },
      {
        title: 'Elite HIIT Circuit',
        description: 'An extreme HIIT circuit with compound movements for maximum metabolic impact.',
        videoUrl: 'https://videos.gymproluxe.com/hiit/elite-circuit.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400',
        duration: 2400,
        difficulty: 'ADVANCED',
        equipmentNeeded: ['Kettlebell', 'Box'],
        caloriesBurned: 550,
        isPremium: true,
      },
    ],
  },
  {
    name: 'Pilates',
    slug: 'pilates',
    description: 'Strengthen your core and improve posture with controlled Pilates movements.',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    videos: [
      {
        title: 'Pilates Core Foundations',
        description: 'Learn the fundamental Pilates principles and build a strong foundation for your practice.',
        videoUrl: 'https://videos.gymproluxe.com/pilates/core-foundations.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1540205432-1c560e5e7db5?w=400',
        duration: 1500,
        difficulty: 'BEGINNER',
        equipmentNeeded: ['Mat'],
        caloriesBurned: 120,
        isPremium: false,
      },
      {
        title: 'Reformer-Inspired Mat Pilates',
        description: 'Get reformer-quality results using just a mat. Focuses on long, lean muscles.',
        videoUrl: 'https://videos.gymproluxe.com/pilates/reformer-inspired.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
        duration: 2400,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: ['Mat', 'Resistance Band'],
        caloriesBurned: 220,
        isPremium: false,
      },
      {
        title: 'Advanced Pilates Sculpt',
        description: 'Challenge every muscle group with advanced Pilates exercises for total body sculpting.',
        videoUrl: 'https://videos.gymproluxe.com/pilates/advanced-sculpt.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?w=400',
        duration: 3000,
        difficulty: 'ADVANCED',
        equipmentNeeded: ['Mat', 'Pilates Ring', 'Resistance Band'],
        caloriesBurned: 300,
        isPremium: true,
      },
    ],
  },
  {
    name: 'Stretching',
    slug: 'stretching',
    description: 'Increase flexibility and reduce muscle soreness with guided stretching routines.',
    imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800',
    videos: [
      {
        title: '10-Minute Morning Stretch',
        description: 'A quick full-body stretching routine to loosen up and prepare your body for the day.',
        videoUrl: 'https://videos.gymproluxe.com/stretching/morning-10.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515552726023-7125c8d07fb3?w=400',
        duration: 600,
        difficulty: 'BEGINNER',
        equipmentNeeded: [],
        caloriesBurned: 40,
        isPremium: false,
      },
      {
        title: 'Post-Workout Recovery Stretch',
        description: 'Cool down after intense exercise with these targeted stretches for muscle recovery.',
        videoUrl: 'https://videos.gymproluxe.com/stretching/post-workout.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1573384666979-2b1e160d2d08?w=400',
        duration: 900,
        difficulty: 'BEGINNER',
        equipmentNeeded: ['Mat'],
        caloriesBurned: 50,
        isPremium: false,
      },
      {
        title: 'Flexibility Deep Dive',
        description: 'An in-depth flexibility session targeting hips, hamstrings, and shoulders for improved range of motion.',
        videoUrl: 'https://videos.gymproluxe.com/stretching/flexibility-deep.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
        duration: 1800,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: ['Mat', 'Yoga Strap'],
        caloriesBurned: 80,
        isPremium: false,
      },
    ],
  },
  {
    name: 'Boxing',
    slug: 'boxing',
    description: 'Punch your way to fitness with boxing-inspired workouts for cardio and strength.',
    imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800',
    videos: [
      {
        title: 'Boxing Basics & Footwork',
        description: 'Learn proper boxing stance, basic punches, and footwork fundamentals.',
        videoUrl: 'https://videos.gymproluxe.com/boxing/basics-footwork.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=400',
        duration: 1500,
        difficulty: 'BEGINNER',
        equipmentNeeded: [],
        caloriesBurned: 200,
        isPremium: false,
      },
      {
        title: 'Heavy Bag Combinations',
        description: 'Work the heavy bag with powerful punch combinations that build strength and endurance.',
        videoUrl: 'https://videos.gymproluxe.com/boxing/heavy-bag.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1495555687398-3f50d6e79e1e?w=400',
        duration: 2400,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: ['Heavy Bag', 'Boxing Gloves', 'Hand Wraps'],
        caloriesBurned: 400,
        isPremium: false,
      },
      {
        title: 'Boxing HIIT Fusion',
        description: 'Combine boxing techniques with high intensity intervals for the ultimate calorie-torching session.',
        videoUrl: 'https://videos.gymproluxe.com/boxing/hiit-fusion.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
        duration: 2100,
        difficulty: 'ADVANCED',
        equipmentNeeded: ['Boxing Gloves', 'Hand Wraps'],
        caloriesBurned: 500,
        isPremium: true,
      },
    ],
  },
  {
    name: 'Dance',
    slug: 'dance',
    description: 'Have fun while burning calories with energetic dance fitness workouts.',
    imageUrl: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800',
    videos: [
      {
        title: 'Dance Cardio Party',
        description: 'No experience needed! Follow along with easy-to-learn dance moves set to upbeat music.',
        videoUrl: 'https://videos.gymproluxe.com/dance/cardio-party.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=400',
        duration: 1800,
        difficulty: 'BEGINNER',
        equipmentNeeded: [],
        caloriesBurned: 250,
        isPremium: false,
      },
      {
        title: 'Hip Hop Dance Fitness',
        description: 'Get your groove on with hip hop inspired choreography that doubles as a full-body workout.',
        videoUrl: 'https://videos.gymproluxe.com/dance/hip-hop.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400',
        duration: 2400,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: [],
        caloriesBurned: 350,
        isPremium: false,
      },
      {
        title: 'Latin Dance Burn',
        description: 'Salsa, merengue, and reggaeton inspired moves for an exhilarating dance workout.',
        videoUrl: 'https://videos.gymproluxe.com/dance/latin-burn.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400',
        duration: 2100,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: [],
        caloriesBurned: 320,
        isPremium: false,
      },
      {
        title: 'Advanced Choreography Challenge',
        description: 'Master complex dance routines while getting an incredible workout. For experienced dancers.',
        videoUrl: 'https://videos.gymproluxe.com/dance/choreo-challenge.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400',
        duration: 3000,
        difficulty: 'ADVANCED',
        equipmentNeeded: [],
        caloriesBurned: 450,
        isPremium: true,
      },
    ],
  },
  {
    name: 'Meditation',
    slug: 'meditation',
    description: 'Calm your mind and reduce stress with guided meditation and breathing exercises.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    videos: [
      {
        title: '5-Minute Breathing Reset',
        description: 'A quick guided breathing exercise to reduce stress and regain focus anytime, anywhere.',
        videoUrl: 'https://videos.gymproluxe.com/meditation/breathing-5.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=400',
        duration: 300,
        difficulty: 'BEGINNER',
        equipmentNeeded: [],
        caloriesBurned: 10,
        isPremium: false,
      },
      {
        title: 'Guided Body Scan Meditation',
        description: 'Progressively relax each part of your body with this soothing guided meditation.',
        videoUrl: 'https://videos.gymproluxe.com/meditation/body-scan.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400',
        duration: 1200,
        difficulty: 'BEGINNER',
        equipmentNeeded: [],
        caloriesBurned: 15,
        isPremium: false,
      },
      {
        title: 'Mindfulness for Athletes',
        description: 'Enhance your athletic performance through visualization and mindfulness techniques.',
        videoUrl: 'https://videos.gymproluxe.com/meditation/mindfulness-athletes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536623975707-c4b3b2af565d?w=400',
        duration: 1800,
        difficulty: 'INTERMEDIATE',
        equipmentNeeded: [],
        caloriesBurned: 20,
        isPremium: true,
      },
    ],
  },
];

async function seed() {
  console.log('Starting seed...');

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];

    // Check if category already exists (idempotent)
    const existing = await prisma.workoutCategory.findUnique({
      where: { slug: cat.slug },
    });

    if (existing) {
      console.log(`  Category "${cat.name}" already exists, skipping.`);
      continue;
    }

    // Create category with its videos
    const created = await prisma.workoutCategory.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: i,
        videos: {
          create: cat.videos.map((video) => ({
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            difficulty: video.difficulty,
            equipmentNeeded: video.equipmentNeeded,
            caloriesBurned: video.caloriesBurned,
            isPremium: video.isPremium,
            isPublished: true,
          })),
        },
      },
      include: { _count: { select: { videos: true } } },
    });

    console.log(`  Created category "${created.name}" with ${created._count.videos} videos`);
  }

  console.log('Seed completed successfully!');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
