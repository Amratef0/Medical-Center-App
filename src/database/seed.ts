import { AppDataSource } from '../config/typeorm.config';
import { seedUsers } from './seeds/user.seed';
import { seedDoctors } from './seeds/doctor.seed';
import { seedPatients } from './seeds/patient.seed';
import { seedDemoData } from './seeds/demo.seed';
import { seedServicePricing } from './seeds/service-pricing.seed';

function assertLocalDatabase() {
  const host = (process.env.DB_HOST || '').toLowerCase();
  const localHosts = new Set(['localhost', '127.0.0.1', '::1', 'postgres', 'db']);
  if (process.env.NODE_ENV === 'production' || !localHosts.has(host)) {
    console.error(`Refusing to seed "${host || '(empty)'}". The seed runs only against a local database.`);
    process.exit(1);
  }
}

async function runSeeds() {
  assertLocalDatabase();
  await AppDataSource.initialize();

  console.log('🌱 Running seeds...');

  await seedUsers(AppDataSource);
  await seedDoctors(AppDataSource);
  await seedPatients(AppDataSource);
  await seedServicePricing(AppDataSource);
  await seedDemoData(AppDataSource);

  console.log('✅ Seeding completed');

  process.exit();
}

runSeeds();
