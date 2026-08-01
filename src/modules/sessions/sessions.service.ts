import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async getCalendarView(from: string, to: string, doctor_id?: string, room_id?: string) {
    const qb = this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.patient', 'patient')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .leftJoinAndSelect('session.room', 'room')
      .leftJoinAndSelect('session.attendance', 'attendance')
      .where('session.session_date >= :from', { from: new Date(from) })
      .andWhere('session.session_date <= :to', { to: new Date(to) });

    if (doctor_id) {
      qb.andWhere('session.doctor_id = :doctorId', { doctorId: doctor_id });
    }
    if (room_id) {
      qb.andWhere('session.room_id = :roomId', { roomId: room_id });
    }

    return qb.orderBy('session.session_date', 'ASC').getMany();
  }

  async reschedule(id: string, newDateStr: string, room_id?: string, doctor_id?: string) {
    const session = await this.findOne(id);
    const newDate = new Date(newDateStr);

    if (isNaN(newDate.getTime())) {
      throw new BadRequestException('Invalid new session date');
    }

    session.session_date = newDate;
    if (room_id) {
      session.room_id = room_id;
    }
    if (doctor_id) {
      session.doctor_id = doctor_id;
    }
    return this.sessionsRepo.save(session);
  }

  async findAll(page = 1, limit = 10, search?: string, doctor_id?: string, from?: string, to?: string) {
    const qb = this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.patient', 'patient')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .leftJoinAndSelect('session.attendance', 'attendance');

    if (search) {
      qb.andWhere(
        '(patient.first_name ILIKE :s OR patient.last_name ILIKE :s OR patient.patient_code ILIKE :s OR doctor.name ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    if (doctor_id) {
      qb.andWhere('session.doctor_id = :doctorId', { doctorId: doctor_id });
    }

    if (from) {
      qb.andWhere('session.session_date >= :from', { from: new Date(from) });
    }

    if (to) {
      qb.andWhere('session.session_date <= :to', { to: new Date(to) });
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

  async checkIn(sessionId: string): Promise<{ session: Session; attendance: Attendance }> {
    const session = await this.findOne(sessionId);
    session.start_time = new Date();
    await this.sessionsRepo.save(session);

    let attendance = await this.attendanceRepo.findOne({ where: { session_id: sessionId } });
    if (!attendance) {
      attendance = this.attendanceRepo.create({
        session_id: sessionId,
        status: 'ATTENDED' as any,
        check_in_time: new Date(),
      });
    } else {
      attendance.status = 'ATTENDED' as any;
      attendance.check_in_time = new Date();
    }
    const savedAttendance = await this.attendanceRepo.save(attendance);
    return { session, attendance: savedAttendance };
  }

  async checkOut(sessionId: string): Promise<{ session: Session; attendance: Attendance }> {
    const session = await this.findOne(sessionId);
    session.end_time = new Date();
    session.status = SessionStatus.ATTENDED;
    await this.sessionsRepo.save(session);

    let attendance = await this.attendanceRepo.findOne({ where: { session_id: sessionId } });
    if (!attendance) {
      attendance = this.attendanceRepo.create({
        session_id: sessionId,
        status: 'ATTENDED' as any,
        check_out_time: new Date(),
      });
    } else {
      attendance.check_out_time = new Date();
    }
    const savedAttendance = await this.attendanceRepo.save(attendance);
    return { session, attendance: savedAttendance };
  }

  async getDailyFollowUp(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await this.sessionsRepo.find({
      where: {
        session_date: Between(startOfDay, endOfDay) as any,
      },
      relations: ['patient', 'doctor', 'attendance', 'room'],
      order: {
        session_date: 'ASC',
      },
    });

    const total = sessions.length;
    const attended = sessions.filter((s) => s.status === SessionStatus.ATTENDED || s.attendance?.status === ('ATTENDED' as any));
    const missed = sessions.filter((s) => s.status === SessionStatus.MISSED || s.attendance?.status === ('ABSENT' as any));
    const pending = sessions.filter((s) => s.status === SessionStatus.SCHEDULED && s.attendance?.status !== ('ATTENDED' as any) && s.attendance?.status !== ('ABSENT' as any));

    const followUpActions = missed.map((s) => ({
      session_id: s.id,
      patient_id: s.patient_id,
      patient_name: s.patient ? `${s.patient.first_name} ${s.patient.last_name || ''}`.trim() : 'مريض',
      patient_phone: s.patient?.phone || s.patient?.whatsapp_number,
      doctor_name: s.doctor?.name,
      absence_reason: s.attendance?.reason || s.absence_reason || 'No Show',
      recommended_action: 'الاتصال بالمريض لإعادة الجدولة وتحديد سبب عدم الحضور',
    }));

    return {
      date: startOfDay.toISOString().split('T')[0],
      summary: {
        total_sessions: total,
        attended_count: attended.length,
        pending_count: pending.length,
        missed_count: missed.length,
        follow_up_needed: followUpActions.length,
      },
      sessions,
      follow_up_actions: followUpActions,
    };
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
    const session = await this.findOne(sessionId);
    if (dto.status === ('ABSENT' as any)) {
      session.status = SessionStatus.MISSED;
      if (dto.reason) {
        session.absence_reason = dto.reason;
      }
      await this.sessionsRepo.save(session);
    } else if (dto.status === ('ATTENDED' as any)) {
      session.status = SessionStatus.ATTENDED;
      await this.sessionsRepo.save(session);
    }

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