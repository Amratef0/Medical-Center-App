import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Session, SessionConfirmStatus, SessionStatus } from './session.entity';
import { Attendance } from './attendance.entity';
import { CreateSessionDto, UpdateSessionDto, CreateAttendanceDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepo: Repository<Session>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
  ) {}

  async create(dto: CreateSessionDto): Promise<Session> {
    const session = this.sessionsRepo.create(dto);
    return this.sessionsRepo.save(session);
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const qb = this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.patient', 'patient')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .leftJoinAndSelect('session.attendance', 'attendance');

    if (search) {
      qb.where(
        '(patient.first_name ILIKE :s OR patient.last_name ILIKE :s OR patient.patient_code ILIKE :s OR doctor.name ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('session.session_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findByPatient(patientId: string, page = 1, limit = 10) {
    const [data, total] = await this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .leftJoinAndSelect('session.attendance', 'attendance')
      .where('session.patient_id = :patientId', { patientId })
      .orderBy('session.session_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionsRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'treatment_plan', 'attendance', 'room'],
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async findByDate(dateStr: string): Promise<Session[]> {
    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.sessionsRepo.find({
      where: {
        session_date: Between(startOfDay, endOfDay) as any,
      },
      relations: ['patient', 'doctor', 'attendance', 'room'],
      order: {
        session_date: 'ASC',
      },
    });
  }

  async confirm(id: string, status: SessionConfirmStatus): Promise<Session> {
    const session = await this.findOne(id);
    session.confirm_status = status;
    return this.sessionsRepo.save(session);
  }

  async startSession(id: string): Promise<Session> {
    const session = await this.findOne(id);
    session.start_time = new Date();
    return this.sessionsRepo.save(session);
  }

  async endSession(id: string): Promise<Session> {
    const session = await this.findOne(id);
    session.end_time = new Date();
    session.status = SessionStatus.ATTENDED; // Set to attended when ended
    return this.sessionsRepo.save(session);
  }

  async update(id: string, dto: UpdateSessionDto): Promise<Session> {
    const session = await this.findOne(id);
    Object.assign(session, dto);
    return this.sessionsRepo.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.sessionsRepo.remove(session);
  }

  // Attendance
  async markAttendance(sessionId: string, dto: CreateAttendanceDto): Promise<Attendance> {
    await this.findOne(sessionId);
    const existing = await this.attendanceRepo.findOne({ where: { session_id: sessionId } });
    if (existing) {
      Object.assign(existing, dto);
      return this.attendanceRepo.save(existing);
    }
    const attendance = this.attendanceRepo.create({ ...dto, session_id: sessionId });
    return this.attendanceRepo.save(attendance);
  }

  async getAttendance(sessionId: string): Promise<Attendance> {
    await this.findOne(sessionId);
    const attendance = await this.attendanceRepo.findOne({ where: { session_id: sessionId } });
    if (!attendance) throw new NotFoundException('Attendance record not found');
    return attendance;
  }
}