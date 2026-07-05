import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/typeorm.config';
import { Room } from '../modules/rooms/room.entity';
import { Patient } from '../modules/patients/patient.entity';
import { Doctor } from '../modules/doctors/doctor.entity';
import { Session, SessionType, SessionConfirmStatus, SessionStatus } from '../modules/sessions/session.entity';
import { Waitlist, WaitlistStatus } from '../modules/waitlist/waitlist.entity';

async function bulkSeed() {
  await AppDataSource.initialize();
  console.log('🌱 Connected to DB. Starting bulk seed...');

  const roomsRepo = AppDataSource.getRepository(Room);
  const patientsRepo = AppDataSource.getRepository(Patient);
  const doctorsRepo = AppDataSource.getRepository(Doctor);
  const sessionsRepo = AppDataSource.getRepository(Session);
  const waitlistRepo = AppDataSource.getRepository(Waitlist);

  const doctors = await doctorsRepo.find();
  const patients = await patientsRepo.find();
  const rooms = await roomsRepo.find();

  if (doctors.length === 0 || patients.length === 0 || rooms.length === 0) {
    console.log('⚠️ Need doctors, patients, and rooms to seed data.');
    process.exit(1);
  }

  const today = '2026-07-05';

  // Generate Time Slots from 08:00 to 21:00
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 21; hour++) {
    const hh = String(hour).padStart(2, '0');
    timeSlots.push(`${hh}:00`);
    timeSlots.push(`${hh}:30`);
  }

  const notes = [
    'مراجعة دورية',
    'جلسة علاج طبيعي',
    'ألم في الظهر',
    'متابعة ما بعد الجراحة',
    'جلسة تخاطب أطفال',
    'استشارة طبية',
    'تأهيل رياضي',
    'جلسة تنمية مهارات'
  ];

  console.log('⏳ Seeding 150 Sessions...');
  let sessionCount = 0;
  for (let i = 0; i < 150; i++) {
    const doc = doctors[Math.floor(Math.random() * doctors.length)];
    const pat = patients[Math.floor(Math.random() * patients.length)];
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const note = notes[Math.floor(Math.random() * notes.length)];

    const sessionDate = new Date(`${today}T${time}:00`);
    
    // Pick random statuses
    const statuses = [SessionStatus.SCHEDULED, SessionStatus.SCHEDULED, SessionStatus.ATTENDED, SessionStatus.MISSED, SessionStatus.CANCELED];
    const confirms = [SessionConfirmStatus.PENDING, SessionConfirmStatus.CONFIRMED, SessionConfirmStatus.CONFIRMED, SessionConfirmStatus.DECLINED];
    const types = [SessionType.TREATMENT, SessionType.ASSESSMENT, SessionType.FOLLOWUP];

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const confirm = confirms[Math.floor(Math.random() * confirms.length)];
    const type = types[Math.floor(Math.random() * types.length)];

    // Ensure no conflict for the same doctor at the same time
    const conflict = await sessionsRepo.findOne({
      where: { doctor_id: doc.id, session_date: sessionDate }
    });

    if (!conflict) {
      const session = sessionsRepo.create({
        patient_id: pat.id,
        doctor_id: doc.id,
        room_id: room.id,
        session_type: type,
        session_date: sessionDate,
        status: status,
        confirm_status: confirm,
        is_deducted: false,
        reception_notes: note,
      });
      await sessionsRepo.save(session);
      sessionCount++;
    }
  }
  console.log(`✅ Successfully seeded ${sessionCount} sessions for ${today}`);

  console.log('⏳ Seeding 50 Waitlist Entries...');
  let waitlistCount = 0;
  for (let i = 0; i < 50; i++) {
    const doc = doctors[Math.floor(Math.random() * doctors.length)];
    const pat = patients[Math.floor(Math.random() * patients.length)];
    const time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const note = notes[Math.floor(Math.random() * notes.length)] + ' (من قائمة الانتظار)';

    const exists = await waitlistRepo.findOne({
      where: { patient_id: pat.id, status: WaitlistStatus.WAITING }
    });

    if (!exists) {
      const entry = waitlistRepo.create({
        patient_id: pat.id,
        doctor_id: doc.id,
        preferred_date: new Date(today),
        preferred_time: `${time}:00`,
        status: WaitlistStatus.WAITING,
        notes: note,
      });
      await waitlistRepo.save(entry);
      waitlistCount++;
    }
  }
  console.log(`✅ Successfully seeded ${waitlistCount} waitlist entries for ${today}`);

  process.exit(0);
}

bulkSeed().catch(err => {
  console.error('Error during bulk seed:', err);
  process.exit(1);
});
