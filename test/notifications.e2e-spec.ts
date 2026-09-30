import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppDataSource } from '../src/config/typeorm.config';
import { seedUsers } from '../src/database/seeds/user.seed';

describe('Notification producers', () => {
  let app: INestApplication;
  let token = '';
  let minuteCursor = (Date.now() % 100000) + 5000;

  const server = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const when = () => {
    minuteCursor += 180;
    const date = new Date(Date.UTC(2036, 0, 1));
    date.setUTCMinutes(minuteCursor);
    return date.toISOString();
  };

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    await seedUsers(AppDataSource);
    await AppDataSource.destroy();

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    const login = await server().post('/api/v1/auth/login').send({
      email: 'admin@mcsos.com',
      password: 'password123',
    });
    expect(login.status).toBe(200);
    token = login.body.access_token;
  });

  afterAll(async () => {
    await app?.close();
  });

  async function notifications() {
    const response = await server().get('/api/v1/notifications').set(auth());
    expect(response.status).toBe(200);
    return response.body as Array<{ type: string; target_role: string; reference_id: string; message: string }>;
  }

  it('stores one reception payment alert and one early-assessment alert', async () => {
    const patient = await server().post('/api/v1/patients').set(auth()).send({
      first_name: 'Test',
      full_name_ar: 'Test Patient',
    });
    expect(patient.status).toBe(201);
    const doctor = await server().post('/api/v1/doctors').set(auth()).send({ name: 'Alert doctor' });
    expect(doctor.status).toBe(201);

    const session = await server().post('/api/v1/sessions').set(auth()).send({
      patient_id: patient.body.id,
      doctor_id: doctor.body.id,
      session_type: 'ASSESSMENT',
      session_date: when(),
      scheduled_duration_minutes: 60,
    });
    expect(session.status).toBe(201);

    const paid = await server().post(`/api/v1/sessions/${session.body.id}/verify-payment`).set(auth()).send({});
    expect(paid.status).toBe(201);
    const afterPay = (await notifications()).filter((row) => row.type === 'PAYMENT_VERIFIED' && row.reference_id === session.body.id);
    expect(afterPay.filter((row) => row.target_role === 'RECEPTIONIST')).toHaveLength(1);
    expect(afterPay.filter((row) => row.target_role === 'DOCTOR')).toHaveLength(1);

    expect((await server().post(`/api/v1/sessions/${session.body.id}/check-in`).set(auth())).status).toBe(201);
    const checkedOut = await server().post(`/api/v1/sessions/${session.body.id}/check-out`).set(auth());
    expect(checkedOut.status).toBe(201);
    const early = (await notifications()).filter((row) => row.type === 'ASSESSMENT_ENDED_EARLIER' && row.reference_id === session.body.id);
    expect(early).toHaveLength(1);
    expect(early[0].target_role).toBe('OPERATIONS_MANAGER');
  });

  it('alerts once when a package reaches the configured remaining count', async () => {
    const patient = await server().post('/api/v1/patients').set(auth()).send({
      first_name: 'Test',
      full_name_ar: 'Package Patient',
    });
    const created = await server().post('/api/v1/packages').set(auth()).send({
      name: 'Four session package',
      total_sessions: 4,
    });
    expect(created.status).toBe(201);
    const assigned = await server().post('/api/v1/packages/assign').set(auth()).send({
      patient_id: patient.body.id,
      package_id: created.body.id,
    });
    expect(assigned.status).toBe(201);

    const first = await server().patch(`/api/v1/patient-packages/${assigned.body.id}/deduct`).set(auth());
    expect(first.status).toBe(200);
    expect(first.body.remaining_sessions).toBe(3);
    const once = (await notifications()).filter((row) => row.type === 'PACKAGE_ENDING_SOON' && row.reference_id === assigned.body.id);
    expect(once.filter((row) => row.target_role === 'RECEPTIONIST')).toHaveLength(1);
    expect(once[0].message).toContain('Package Patient');
    expect(once[0].message).toContain('3');

    const second = await server().patch(`/api/v1/patient-packages/${assigned.body.id}/deduct`).set(auth());
    expect(second.status).toBe(200);
    const twice = (await notifications()).filter((row) => row.type === 'PACKAGE_ENDING_SOON' && row.reference_id === assigned.body.id);
    expect(twice).toHaveLength(once.length);

    const updated = await server().put('/api/v1/settings/package_sessions_threshold').set(auth()).send({ value: '1' });
    expect(updated.status).toBe(200);
    expect(updated.body.value).toBe('1');
    const read = await server().get('/api/v1/settings/package_sessions_threshold').set(auth());
    expect(read.body.value).toBe('1');
    await server().put('/api/v1/settings/package_sessions_threshold').set(auth()).send({ value: '3' });
  });

  it('records a missed appointment for reception', async () => {
    const patient = await server().post('/api/v1/patients').set(auth()).send({ first_name: 'Test' });
    const doctor = await server().post('/api/v1/doctors').set(auth()).send({ name: 'Absence doctor' });
    const session = await server().post('/api/v1/sessions').set(auth()).send({
      patient_id: patient.body.id,
      doctor_id: doctor.body.id,
      session_type: 'TREATMENT',
      session_date: when(),
    });
    const marked = await server().post(`/api/v1/sessions/${session.body.id}/attendance`).set(auth()).send({
      status: 'ABSENT',
      reason: 'Did not arrive',
    });
    expect(marked.status).toBe(201);
    const missed = (await notifications()).filter((row) => row.type === 'MISSED_APPOINTMENT' && row.reference_id === session.body.id);
    expect(missed).toHaveLength(1);
    expect(missed[0].target_role).toBe('RECEPTIONIST');
  });
});
