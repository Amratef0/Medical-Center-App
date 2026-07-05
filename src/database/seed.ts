import { AppDataSource } from '../config/typeorm.config';
import { seedUsers } from './seeds/user.seed';
import { seedDoctors } from './seeds/doctor.seed';
import { seedPatients } from './seeds/patient.seed';

async function runSeeds() {
  await AppDataSource.initialize();

  console.log('🌱 Running seeds...');

  await seedUsers(AppDataSource);
  await seedDoctors(AppDataSource);
  await seedPatients(AppDataSource);

  console.log('✅ Seeding completed');

  process.exit();
}

runSeeds();
