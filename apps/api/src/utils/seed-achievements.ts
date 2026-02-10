import { prisma } from '@gympro/database';

const DEFAULT_ACHIEVEMENTS = [
  { name: 'First Workout', description: 'Complete your first workout', criteria: { type: 'workouts_completed', threshold: 1 } },
  { name: 'Getting Started', description: 'Complete 5 workouts', criteria: { type: 'workouts_completed', threshold: 5 } },
  { name: 'Dedicated', description: 'Complete 25 workouts', criteria: { type: 'workouts_completed', threshold: 25 } },
  { name: 'Unstoppable', description: 'Complete 100 workouts', criteria: { type: 'workouts_completed', threshold: 100 } },
  { name: 'Calorie Crusher', description: 'Burn 1,000 calories total', criteria: { type: 'calories_burned', threshold: 1000 } },
  { name: 'Inferno', description: 'Burn 10,000 calories total', criteria: { type: 'calories_burned', threshold: 10000 } },
  { name: '3-Day Streak', description: 'Work out 3 days in a row', criteria: { type: 'streak', threshold: 3 } },
  { name: 'Week Warrior', description: 'Work out 7 days in a row', criteria: { type: 'streak', threshold: 7 } },
  { name: 'Monthly Master', description: 'Work out 30 days in a row', criteria: { type: 'streak', threshold: 30 } },
  { name: 'Community Star', description: 'Create 10 community posts', criteria: { type: 'posts_created', threshold: 10 } },
  { name: 'Social Butterfly', description: 'Receive 50 likes on your posts', criteria: { type: 'likes_received', threshold: 50 } },
  { name: 'Custom Creator', description: 'Create 5 custom workouts', criteria: { type: 'custom_workouts_created', threshold: 5 } },
];

export async function seedAchievements(): Promise<void> {
  console.log('Seeding achievements...');

  for (const achievement of DEFAULT_ACHIEVEMENTS) {
    const existing = await prisma.achievement.findUnique({
      where: { name: achievement.name },
    });

    if (existing) {
      continue;
    }

    await prisma.achievement.create({
      data: {
        name: achievement.name,
        description: achievement.description,
        criteria: achievement.criteria,
      },
    });

    console.log(`  Created achievement: "${achievement.name}"`);
  }

  console.log('Achievement seeding complete.');
}
