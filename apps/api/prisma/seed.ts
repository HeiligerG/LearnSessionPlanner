import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (optional - for idempotent seeding)
  await prisma.user.deleteMany();
  console.log('  ✅ Cleared existing data');

  // Create test users with Argon2id hashed passwords
  const testPassword = await argon2.hash('password123', {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: testPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: testPassword,
    },
  });

  console.log('  ✅ Created test users:');
  console.log(`    - ${user1.email} (${user1.name})`);
  console.log(`    - ${user2.email} (${user2.name})`);
  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('📝 Test credentials: test@example.com / password123');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
