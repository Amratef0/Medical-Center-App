import { DataSource } from 'typeorm';
import { Patient, PatientStatus } from '../../modules/patients/patient.entity';
import patientsData from './data/patients.json';

export async function seedPatients(dataSource: DataSource) {
  const patientsRepo = dataSource.getRepository(Patient);

  console.log(`🌱 Seeding ${patientsData.length} patients...`);

  let count = 0;
  for (const pat of patientsData) {
    // Generate unique patient code
    const patientCode = `PAT-${String(pat.id_num).padStart(5, '0')}`;

    const exists = await patientsRepo.findOne({
      where: { patient_code: patientCode },
    });

    if (exists) continue;

    // Split patient name into first and last name
    const parts = pat.name.trim().split(/\s+/);
    const firstName = parts[0] || 'Unknown';
    const lastName = parts.slice(1).join(' ') || 'Patient';

    const patient = patientsRepo.create({
      patient_code: patientCode,
      first_name: firstName,
      last_name: lastName,
      phone: pat.phone || undefined,
      status: PatientStatus.PENDING_ASSESSMENT,
    });

    await patientsRepo.save(patient);
    count++;
  }

  console.log(`✅ ${count} new patients seeded successfully`);
}
