import { DataSource } from 'typeorm';
import { Room } from '../../modules/rooms/room.entity';
import { Patient } from '../../modules/patients/patient.entity';
import { Doctor } from '../../modules/doctors/doctor.entity';
import { Session, SessionType, SessionConfirmStatus, SessionStatus } from '../../modules/sessions/session.entity';
import { Waitlist, WaitlistStatus } from '../../modules/waitlist/waitlist.entity';

export async function seedDemoData(dataSource: DataSource) {
  const roomsRepo = dataSource.getRepository(Room);
  const patientsRepo = dataSource.getRepository(Patient);
  const doctorsRepo = dataSource.getRepository(Doctor);
  const sessionsRepo = dataSource.getRepository(Session);
  const waitlistRepo = dataSource.getRepository(Waitlist);

  console.log('🌱 Seeding demo Rooms, Sessions, and Waitlist...');

  // 1. Seed Rooms
  const roomsData = [
    { name: 'غرفة العلاج الطبيعي 1', code: 'PT-01', is_active: true },
    { name: 'غرفة العلاج المائي', code: 'HYDRO-01', is_active: true },
    { name: 'غرفة التخاطب 1', code: 'SPEECH-01', is_active: true },
    { name: 'قاعة تنمية المهارات', code: 'SKILLS-01', is_active: true },
  ];

  const seededRooms: Room[] = [];
  for (const r of roomsData) {
    let room = await roomsRepo.findOne({ where: { code: r.code } });
    if (!room) {
      room = roomsRepo.create(r);
      room = await roomsRepo.save(room);
    }
    seededRooms.push(room);
  }
  console.log(`✅ Seeded ${seededRooms.length} rooms`);

  // 2. Fetch doctors and patients
  const doctors = await doctorsRepo.find({ take: 5 });
  const patients = await patientsRepo.find({ take: 10 });

  if (doctors.length === 0 || patients.length === 0) {
    console.log('⚠️ Warning: Need seeded doctors and patients to create sessions and waitlist.');
    return;
  }

  // 3. Seed Sessions for today: 2026-07-05
  // We will seed 4 sessions at different times
  const today = '2026-07-05';
  const sessionTimes = [
    { time: '08:30', status: SessionStatus.SCHEDULED, confirm: SessionConfirmStatus.CONFIRMED, isDeducted: true },
    { time: '10:00', status: SessionStatus.SCHEDULED, confirm: SessionConfirmStatus.PENDING, isDeducted: false },
    { time: '11:30', status: SessionStatus.SCHEDULED, confirm: SessionConfirmStatus.DECLINED, isDeducted: false },
    { time: '14:00', status: SessionStatus.ATTENDED, confirm: SessionConfirmStatus.CONFIRMED, isDeducted: true, actualTime: true },
  ];

  let sessionCount = 0;
  for (let i = 0; i < sessionTimes.length; i++) {
    const config = sessionTimes[i];
    const doc = doctors[i % doctors.length];
    const pat = patients[i % patients.length];
    const room = seededRooms[i % seededRooms.length];

    const sessionDate = new Date(`${today}T${config.time}:00`);

    // Check if session already exists
    const exists = await sessionsRepo.findOne({
      where: {
        doctor_id: doc.id,
        session_date: sessionDate,
      }
    });

    if (!exists) {
      let start_time: Date | undefined = undefined;
      let end_time: Date | undefined = undefined;

      if (config.actualTime) {
        start_time = new Date(sessionDate);
        end_time = new Date(sessionDate);
        end_time.setMinutes(end_time.getMinutes() + 45); // 45 mins session
      }

      const session = sessionsRepo.create({
        patient_id: pat.id,
        doctor_id: doc.id,
        room_id: room.id,
        session_type: SessionType.TREATMENT,
        session_date: sessionDate,
        status: config.status,
        confirm_status: config.confirm,
        is_deducted: config.isDeducted,
        start_time,
        end_time,
        reception_notes: `جلسة تجريبية في ${config.time}`,
      });

      await sessionsRepo.save(session);
      sessionCount++;
    }
  }
  console.log(`✅ Seeded ${sessionCount} demo sessions for today`);

  // 4. Seed Waitlist entries
  const waitlistNotes = [
    'بحاجة لتغيير الموعد من المساء إلى الصباح',
    'يفضل الحضور مع د. أحمد إذا توفرت خانة شاغرة',
    'جلسة طارئة لعلاج طبيعي مكثف',
  ];

  let waitlistCount = 0;
  for (let i = 0; i < waitlistNotes.length; i++) {
    const pat = patients[(i + 4) % patients.length];
    const doc = doctors[i % doctors.length];

    const exists = await waitlistRepo.findOne({
      where: {
        patient_id: pat.id,
        status: WaitlistStatus.WAITING,
      }
    });

    if (!exists) {
      const entry = waitlistRepo.create({
        patient_id: pat.id,
        doctor_id: doc.id,
        preferred_date: new Date(today),
        preferred_time: '10:00:00',
        status: WaitlistStatus.WAITING,
        notes: waitlistNotes[i],
      });

      await waitlistRepo.save(entry);
      waitlistCount++;
    }
  }
  console.log(`✅ Seeded ${waitlistCount} demo waitlist entries`);
}
