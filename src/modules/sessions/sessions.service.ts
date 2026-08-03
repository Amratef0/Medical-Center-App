import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Session, SessionConfirmStatus, SessionStatus, SessionType } from './session.entity';
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
    const isAssessment = dto.session_type === SessionType.ASSESSMENT;
    const session = this.sessionsRepo.create({
      ...dto,
      scheduled_duration_minutes: dto.scheduled_duration_minutes || (isAssessment ? 60 : 45),
      payment_verified: false, // Default to unverified for all session types until payment is confirmed
    });
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
    await this.findOne(id); // verify existence
    const newDate = new Date(newDateStr);

    if (isNaN(newDate.getTime())) {
      throw new BadRequestException('Invalid new session date');
    }

    const updateData: Record<string, any> = {
      session_date: newDate,
    };
    if (room_id) {
      updateData.room_id = room_id;
    }
    if (doctor_id) {
      updateData.doctor_id = doctor_id;
    }
    await this.sessionsRepo.update(id, updateData);
    return this.findOne(id);
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
    if (session.session_type === SessionType.ASSESSMENT && !session.payment_verified) {
      throw new BadRequestException('⛔ لا يمكن بدء جلسة التقييم قبل تأكيد الدفع من الحسابات | Assessment session cannot begin until payment is verified by Finance');
    }
    session.start_time = new Date();
    return this.sessionsRepo.save(session);
  }

  async endSession(id: string): Promise<Session> {
    const session = await this.findOne(id);
    session.end_time = new Date();
    session.status = SessionStatus.ATTENDED;
    this.calculateDurationAndAlert(session);
    return this.sessionsRepo.save(session);
  }

  async checkIn(sessionId: string): Promise<{ session: Session; attendance: Attendance }> {
    const session = await this.findOne(sessionId);
    if (session.session_type === SessionType.ASSESSMENT && !session.payment_verified) {
      throw new BadRequestException('⛔ لا يمكن بدء جلسة التقييم قبل تأكيد الدفع من الحسابات | Assessment session cannot begin until payment is verified by Finance');
    }
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
    this.calculateDurationAndAlert(session);
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

  private calculateDurationAndAlert(session: Session): void {
    const start = session.start_time || session.session_date;
    if (start && session.end_time) {
      const elapsedMs = new Date(session.end_time).getTime() - new Date(start).getTime();
      const actualMins = Math.max(1, Math.round(elapsedMs / 60000));
      session.actual_duration_minutes = actualMins;

      const scheduled = session.scheduled_duration_minutes || 60;
      if (session.session_type === SessionType.ASSESSMENT && actualMins < scheduled - 15) {
        session.duration_warning_generated = true;
        console.warn(`⚠️ [EARLY TERMINATION ALERT] Assessment session ${session.id} finished in ${actualMins} mins (scheduled for ${scheduled} mins).`);
      }
    }
  }

  async verifyPayment(id: string, verifierName = 'Finance Staff'): Promise<Session> {
    const session = await this.findOne(id);
    session.payment_verified = true;
    session.payment_verified_by = verifierName;
    session.payment_verified_at = new Date();
    return this.sessionsRepo.save(session);
  }

  async updateEvaluationReport(id: string, reportText: string): Promise<Session> {
    const session = await this.findOne(id);
    session.evaluation_report = reportText;
    return this.sessionsRepo.save(session);
  }

  async getDailyFollowUp(dateStr?: string, page = 1, limit = 10) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const allSessions = await this.sessionsRepo.find({
      where: {
        session_date: Between(startOfDay, endOfDay) as any,
      },
      relations: ['patient', 'doctor', 'attendance', 'room'],
      order: {
        session_date: 'ASC',
      },
    });

    const total = allSessions.length;
    const attended = allSessions.filter((s) => s.status === SessionStatus.ATTENDED || s.attendance?.status === ('ATTENDED' as any));
    const missed = allSessions.filter((s) => s.status === SessionStatus.MISSED || s.attendance?.status === ('ABSENT' as any));
    const pending = allSessions.filter((s) => s.status === SessionStatus.SCHEDULED && s.attendance?.status !== ('ATTENDED' as any) && s.attendance?.status !== ('ABSENT' as any));

    const followUpActions = missed.map((s) => ({
      session_id: s.id,
      patient_id: s.patient_id,
      patient_name: s.patient ? `${s.patient.first_name} ${s.patient.last_name || ''}`.trim() : 'مريض',
      patient_phone: s.patient?.phone || s.patient?.whatsapp_number,
      doctor_name: s.doctor?.name,
      absence_reason: s.attendance?.reason || s.absence_reason || 'No Show',
      recommended_action: 'الاتصال بالمريض لإعادة الجدولة وتحديد سبب عدم الحضور',
    }));

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedSessions = allSessions.slice(startIndex, endIndex);

    return {
      date: startOfDay.toISOString().split('T')[0],
      summary: {
        total_sessions: total,
        attended_count: attended.length,
        pending_count: pending.length,
        missed_count: missed.length,
        follow_up_needed: followUpActions.length,
      },
      sessions: paginatedSessions,
      follow_up_actions: followUpActions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
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