import { AppDataSource } from '../config/typeorm.config';
import { seedUsers } from './seeds/user.seed';

async function runSeeds() {
  await AppDataSource.initialize();

  console.log('🌱 Running seeds...');

  await seedUsers(AppDataSource);

  console.log('✅ Seeding completed');

  process.exit();
}

runSeeds();