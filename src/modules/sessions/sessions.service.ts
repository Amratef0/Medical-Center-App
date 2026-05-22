import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
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

  async findAll(): Promise<Session[]> {
    return this.sessionsRepo.find({
      relations: ['patient', 'doctor', 'attendance'],
      order: { session_date: 'DESC' },
    });
  }

  async findByPatient(patientId: string): Promise<Session[]> {
    return this.sessionsRepo.find({
      where: { patient_id: patientId },
      relations: ['doctor', 'attendance'],
      order: { session_date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionsRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'treatment_plan', 'attendance'],
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
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
