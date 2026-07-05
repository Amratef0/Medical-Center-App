import { DataSource } from 'typeorm';
import { Doctor } from '../../modules/doctors/doctor.entity';
import doctorsData from './data/doctors.json';

export async function seedDoctors(dataSource: DataSource) {
  const doctorsRepo = dataSource.getRepository(Doctor);

  console.log(`🌱 Seeding ${doctorsData.length} doctors...`);

  let count = 0;
  for (const doc of doctorsData) {
    const exists = await doctorsRepo.findOne({
      where: { name: doc.name },
    });

    if (exists) continue;

    const doctor = doctorsRepo.create({
      name: doc.name,
      specialization: doc.specialization || undefined,
      phone: doc.phone || undefined,
      is_active: true,
    });

    await doctorsRepo.save(doctor);
    count++;
  }

  console.log(`✅ ${count} new doctors seeded successfully`);
}
