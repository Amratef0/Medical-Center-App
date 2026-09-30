import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Session, SessionConfirmStatus, SessionStatus, SessionType } from './session.entity';
import { Attendance } from './attendance.entity';
import { CreateSessionDto, UpdateSessionDto, CreateAttendanceDto } from './dto/session.dto';
import { User } from '../users/user.entity';
import { SchedulingValidator } from '../scheduling/scheduling-validator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CapacityService } from '../capacity/capacity.service';
import { SettingsService, CLINIC_TIMEZONE } from '../settings/settings.service';
import { AttendanceStatus } from './attendance.entity';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(Session)
    private sessionsRepo: Repository<Session>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    private readonly schedulingValidator: SchedulingValidator,
    private readonly notifications: NotificationsService,
    private readonly capacityService: CapacityService,
    private readonly settings: SettingsService,
  ) {}

  async create(dto: CreateSessionDto): Promise<Session> {
    const durationMinutes = SchedulingValidator.resolveDurationMinutes(
      dto.scheduled_duration_minutes,
      dto.session_type,
    );
    const startsAt = new Date(dto.session_date);

    return this.schedulingValidator.runInTransaction(async (queryRunner) => {
      await this.schedulingValidator.assertSlotIsBookable(
        {
          sessionId: null,
          doctorId: dto.doctor_id ?? null,
          roomId: dto.room_id ?? null,
          startsAt,
          durationMinutes,
          slotId: dto.slot_id ?? null,
          previousSlotId: null,
        },
        queryRunner,
      );

      const session = queryRunner.manager.create(Session, {
        ...dto,
        scheduled_duration_minutes: durationMinutes,
        payment_verified: false, // Default to unverified for all session types until payment is confirmed
      });
      const saved = await queryRunner.manager.save(session);
      return saved;
    }).then(async (saved) => {
      await this.capacityService.handlePostBookingAlerts(saved);
      return saved;
    });
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
    const newDate = new Date(newDateStr);

    if (isNaN(newDate.getTime())) {
      throw new BadRequestException('Invalid new session date');
    }

    await this.schedulingValidator.runInTransaction(async (queryRunner) => {
      const session = await queryRunner.manager
        .createQueryBuilder(Session, 's')
        .setLock('pessimistic_write')
        .where('s.id = :id', { id })
        .getOne();

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      const nextDoctorId = doctor_id ?? session.doctor_id ?? null;
      const nextRoomId = room_id ?? session.room_id ?? null;
      const durationMinutes = SchedulingValidator.resolveDurationMinutes(
        session.scheduled_duration_minutes,
        session.session_type,
      );

      await this.schedulingValidator.assertSlotIsBookable(
        {
          sessionId: session.id,
          doctorId: nextDoctorId,
          roomId: nextRoomId,
          startsAt: newDate,
          durationMinutes,
          slotId: session.slot_id ?? null,
          previousSlotId: session.slot_id ?? null,
        },
        queryRunner,
      );

      session.session_date = newDate;
      if (room_id) {
        session.room_id = room_id;
      }
      if (doctor_id) {
        session.doctor_id = doctor_id;
      }

      await queryRunner.manager.save(session);
    });

    const updated = await this.findOne(id);
    await this.capacityService.handlePostBookingAlerts(updated);
    return updated;
  }

  async findAll(page = 1, limit = 10, search?: string, doctor_id?: string, from?: string, to?: string) {
    const qb = this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.patient', 'patient')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .leftJoinAndSelect('session.treatment_plan', 'treatment_plan')
      .leftJoinAndSelect('session.room', 'room')
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
    const saved = await this.sessionsRepo.save(session);
    await this.notifyEarlyAssessment(saved);
    return saved;
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
    await this.safeNotify(() => this.notifications.notifyAttendanceRecorded(sessionId));
    return { session, attendance: savedAttendance };
  }

  async checkOut(sessionId: string): Promise<{ session: Session; attendance: Attendance }> {
    const session = await this.findOne(sessionId);
    session.end_time = new Date();
    session.status = SessionStatus.ATTENDED;
    this.calculateDurationAndAlert(session);
    await this.sessionsRepo.save(session);
    await this.notifyEarlyAssessment(session);

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
      }
    }
  }

  private async notifyEarlyAssessment(session: Session): Promise<void> {
    if (!session.duration_warning_generated || session.session_type !== SessionType.ASSESSMENT) return;
    await this.safeNotify(() => this.notifications.notifyAssessmentEndedEarlier(
      session.id,
      session.actual_duration_minutes || 0,
      session.scheduled_duration_minutes || 60,
    ));
  }

  private async safeNotify(work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Notification was not stored: ${message}`);
    }
  }

  private staffDisplayName(user?: User): string {
    if (!user) return 'Finance Staff';
    return user.name?.trim() || user.email?.trim() || 'Staff';
  }

  async verifyPayment(id: string, user?: User): Promise<Session> {
    const session = await this.findOne(id);
    session.payment_verified = true;
    session.payment_verified_by = this.staffDisplayName(user);
    session.payment_verified_at = new Date();
    const saved = await this.sessionsRepo.save(session);
    if (saved.session_type === SessionType.ASSESSMENT) {
      const name = saved.patient?.full_name_ar || saved.patient?.first_name || 'Patient';
      await this.safeNotify(() => this.notifications.notifyPaymentVerified(name, saved.id));
    }
    return saved;
  }

  async updateEvaluationReport(id: string, reportText: string): Promise<Session> {
    const session = await this.findOne(id);
    session.evaluation_report = reportText;
    return this.sessionsRepo.save(session);
  }

  async getDailyFollowUp(dateStr?: string, page = 1, limit = 10) {
    const tz = (await this.settings.get(CLINIC_TIMEZONE)) ?? 'Asia/Riyadh';
    const dateLabel =
      dateStr ??
      new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());

    const allSessions = await this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.patient', 'patient')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .leftJoinAndSelect('session.attendance', 'attendance')
      .leftJoinAndSelect('session.room', 'room')
      .where(`DATE(timezone(:tz, session.session_date)) = :date`, {
        tz,
        date: dateLabel,
      })
      .orderBy('session.session_date', 'ASC')
      .getMany();

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
      date: dateLabel,
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

  async update(id: string, dto: UpdateSessionDto, user?: User): Promise<Session> {
    const session = await this.findOne(id);
    const {
      payment_verified: _pv,
      cancelled_by: dtoCancelledBy,
      ...patch
    } = dto as UpdateSessionDto & { payment_verified?: boolean };

    if (patch.status === SessionStatus.CANCELED) {
      if (!patch.cancellation_reason && !session.cancellation_reason) {
        throw new BadRequestException('سبب الإلغاء إلزامي | Cancellation reason is mandatory');
      }
      session.cancellation_reason = patch.cancellation_reason || session.cancellation_reason;
      session.cancelled_at = new Date();
      if (user) {
        session.cancelled_by = this.staffDisplayName(user);
      } else if (dtoCancelledBy) {
        session.cancelled_by = dtoCancelledBy;
      }
    }
    Object.assign(session, patch);
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
    const saved = existing
      ? await this.attendanceRepo.save(Object.assign(existing, dto))
      : await this.attendanceRepo.save(this.attendanceRepo.create({ ...dto, session_id: sessionId }));
    if (dto.status === AttendanceStatus.ABSENT) {
      await this.safeNotify(() => this.notifications.notifyMissedAppointment(sessionId));
    } else if (dto.status === AttendanceStatus.ATTENDED) {
      await this.safeNotify(() => this.notifications.notifyAttendanceRecorded(sessionId));
    }
    return saved;
  }

  async getAttendance(sessionId: string): Promise<Attendance> {
    await this.findOne(sessionId);
    const attendance = await this.attendanceRepo.findOne({ where: { session_id: sessionId } });
    if (!attendance) throw new NotFoundException('Attendance record not found');
    return attendance;
  }
}