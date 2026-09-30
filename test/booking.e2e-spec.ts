import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppDataSource } from '../src/config/typeorm.config';
import { seedUsers } from '../src/database/seeds/user.seed';

const SEED_PASSWORD = 'password123';

describe('Auth, sessions, and booking conflicts', () => {
  let app: INestApplication;
  let token = '';
  let minuteCursor = (Date.now() % 200000) + 1000;

  const server = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const atMinute = (step = 0) => {
    minuteCursor += 180;
    const when = new Date(Date.UTC(2035, 5, 1, 0, 0, 0));
    when.setUTCMinutes(minuteCursor + step);
    return when.toISOString();
  };

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    await seedUsers(AppDataSource);
    await AppDataSource.destroy();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    const login = await server().post('/api/v1/auth/login').send({
      email: 'admin@mcsos.com',
      password: SEED_PASSWORD,
    });
    expect(login.status).toBe(200);
    token = login.body.access_token;
  });

  afterAll(async () => {
    await app?.close();
  });

  async function createDoctor(name: string) {
    const response = await server().post('/api/v1/doctors').set(auth()).send({ name });
    expect(response.status).toBe(201);
    return response.body.id as string;
  }

  async function createRoom() {
    const response = await server().post('/api/v1/rooms').set(auth()).send({
      name: 'Test room',
      code: `T${Date.now().toString().slice(-8)}`,
    });
    expect(response.status).toBe(201);
    return response.body.id as string;
  }

  async function createPatient() {
    const response = await server().post('/api/v1/patients').set(auth()).send({
      first_name: 'Test',
      last_name: 'Patient',
    });
    expect(response.status).toBe(201);
    return response.body.id as string;
  }

  async function book(body: Record<string, unknown>) {
    return server().post('/api/v1/sessions').set(auth()).send(body);
  }

  it('refreshes a token and rejects an inactive user', async () => {
    const login = await server().post('/api/v1/auth/login').send({
      email: 'reception@mcsos.com',
      password: SEED_PASSWORD,
    });
    expect(login.status).toBe(200);

    const refreshed = await server()
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${login.body.refresh_token}`);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.access_token).toEqual(expect.any(String));

    const created = await server().post('/api/v1/users').set(auth()).send({
      name: 'Inactive Staff',
      email: `inactive-${Date.now()}@example.com`,
      password: 'local-pass-1',
      role: 'RECEPTIONIST',
    });
    expect(created.status).toBe(201);

    const blocked = await server()
      .put(`/api/v1/users/${created.body.id}`)
      .set(auth())
      .send({ is_active: false });
    expect(blocked.status).toBe(200);

    const denied = await server().post('/api/v1/auth/login').send({
      email: created.body.email,
      password: 'local-pass-1',
    });
    expect(denied.status).toBe(401);
  });

  it('walks an assessment from booking through checkout', async () => {
    const patientId = await createPatient();
    const doctorId = await createDoctor('Lifecycle doctor');
    const when = atMinute();
    const created = await book({
      patient_id: patientId,
      doctor_id: doctorId,
      session_type: 'ASSESSMENT',
      session_date: when,
      scheduled_duration_minutes: 60,
    });
    expect(created.status).toBe(201);
    expect(created.body.payment_verified).toBe(false);
    expect(created.body.status).toBe('SCHEDULED');

    const blocked = await server().post(`/api/v1/sessions/${created.body.id}/check-in`).set(auth());
    expect(blocked.status).toBe(400);

    const paid = await server().post(`/api/v1/sessions/${created.body.id}/verify-payment`).set(auth()).send({});
    expect(paid.status).toBe(201);
    expect(paid.body.payment_verified).toBe(true);

    const checkedIn = await server().post(`/api/v1/sessions/${created.body.id}/check-in`).set(auth());
    expect(checkedIn.status).toBe(201);

    const checkedOut = await server().post(`/api/v1/sessions/${created.body.id}/check-out`).set(auth());
    expect(checkedOut.status).toBe(201);
    expect(checkedOut.body.session.status).toBe('ATTENDED');
    expect(checkedOut.body.session.duration_warning_generated).toBe(true);

    const report = await server()
      .put(`/api/v1/sessions/${created.body.id}/evaluation-report`)
      .set(auth())
      .send({ evaluation_report: 'Assessment note' });
    expect(report.status).toBe(200);
    expect(report.body.evaluation_report).toBe('Assessment note');
  });

  it('rejects a second session on the same doctor or room, including a reschedule', async () => {
    const patientA = await createPatient();
    const patientB = await createPatient();
    const doctorId = await createDoctor('Overlap doctor');
    const when = atMinute();

    const first = await book({
      patient_id: patientA,
      doctor_id: doctorId,
      session_type: 'TREATMENT',
      session_date: when,
    });
    expect(first.status).toBe(201);

    const doctorClash = await book({
      patient_id: patientB,
      doctor_id: doctorId,
      session_type: 'TREATMENT',
      session_date: when,
    });
    expect(doctorClash.status).toBe(409);
    expect(doctorClash.body.message.ar).toEqual(expect.any(String));
    expect(doctorClash.body.message.en).toEqual(expect.any(String));

    const roomId = await createRoom();
    const otherDoctor = await createDoctor('Other doctor');
    const roomWhen = atMinute();
    const inRoom = await book({
      patient_id: patientA,
      doctor_id: doctorId,
      room_id: roomId,
      session_type: 'TREATMENT',
      session_date: roomWhen,
    });
    expect(inRoom.status).toBe(201);
    const roomClash = await book({
      patient_id: patientB,
      doctor_id: otherDoctor,
      room_id: roomId,
      session_type: 'TREATMENT',
      session_date: roomWhen,
    });
    expect(roomClash.status).toBe(409);

    const openWhen = atMinute();
    const movable = await book({
      patient_id: patientA,
      doctor_id: otherDoctor,
      session_type: 'TREATMENT',
      session_date: openWhen,
    });
    expect(movable.status).toBe(201);
    const refusedMove = await server()
      .put(`/api/v1/sessions/${movable.body.id}/reschedule`)
      .set(auth())
      .send({ session_date: when, doctor_id: doctorId });
    expect(refusedMove.status).toBe(409);

    const stillThere = await server().get(`/api/v1/sessions/${movable.body.id}`).set(auth());
    expect(new Date(stillThere.body.session_date).toISOString()).toBe(new Date(openWhen).toISOString());
  });

  it('lets two sessions through when neither doctor nor room is set', async () => {
    const patientA = await createPatient();
    const patientB = await createPatient();
    const when = atMinute();
    const first = await book({ patient_id: patientA, session_type: 'FOLLOWUP', session_date: when });
    const second = await book({ patient_id: patientB, session_type: 'FOLLOWUP', session_date: when });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });

  it('rejects a third booking when the doctor daily cap is 2', async () => {
    const patientA = await createPatient();
    const patientB = await createPatient();
    const patientC = await createPatient();
    const doctorId = await createDoctor('Capped doctor');

    const cap = await server()
      .put(`/api/v1/doctors/${doctorId}`)
      .set(auth())
      .send({ max_sessions_per_day: 2 });
    expect(cap.status).toBe(200);

    const base = atMinute();
    const firstWhen = base;
    const secondWhen = atMinute(1);
    const thirdWhen = atMinute(2);

    const first = await book({
      patient_id: patientA,
      doctor_id: doctorId,
      session_type: 'TREATMENT',
      session_date: firstWhen,
    });
    expect(first.status).toBe(201);

    const second = await book({
      patient_id: patientB,
      doctor_id: doctorId,
      session_type: 'TREATMENT',
      session_date: secondWhen,
    });
    expect(second.status).toBe(201);

    const third = await book({
      patient_id: patientC,
      doctor_id: doctorId,
      session_type: 'TREATMENT',
      session_date: thirdWhen,
    });
    expect(third.status).toBe(409);
    expect(third.body.message.ar).toEqual(expect.any(String));
    expect(third.body.message.en).toEqual(expect.any(String));
  });

  it('accepts exactly one of two overlapping creates', async () => {
    const patientA = await createPatient();
    const patientB = await createPatient();
    const doctorId = await createDoctor('Race doctor');
    const when = atMinute();
    const body = {
      doctor_id: doctorId,
      session_type: 'TREATMENT',
      session_date: when,
    };
    const [left, right] = await Promise.all([
      book({ ...body, patient_id: patientA }),
      book({ ...body, patient_id: patientB }),
    ]);
    const statuses = [left.status, right.status].sort().join(',');
    expect(statuses).toBe('201,409');
  });
});
