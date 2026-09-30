import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Session, SessionStatus, SessionType } from '../sessions/session.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Room } from '../rooms/room.entity';
import {
  SettingsService,
  CAPACITY_CENTER_MAX_SESSIONS_PER_DAY,
  CAPACITY_WARN_THRESHOLD_PCT,
  CAPACITY_FULL_THRESHOLD_PCT,
} from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

export type CapacityState = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL';

export interface UtilizationResult {
  level: 'center' | 'doctor' | 'room';
  id?: string;
  name?: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  pct: number;
  state: CapacityState;
}

export interface CapacityOverview {
  date: string;
  thresholds: { warn_pct: number; full_pct: number };
  center: UtilizationResult;
  doctors: UtilizationResult[];
  rooms: UtilizationResult[];
}

interface AssertBookingParams {
  doctorId?: string | null;
  roomId?: string | null;
  startsAt: Date;
  durationMinutes: number;
  sessionId?: string | null;
  queryRunner: QueryRunner;
}

@Injectable()
export class CapacityService {
  private readonly logger = new Logger(CapacityService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepo: Repository<Session>,
    @InjectRepository(Doctor)
    private readonly doctorsRepo: Repository<Doctor>,
    @InjectRepository(Room)
    private readonly roomsRepo: Repository<Room>,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
  ) {}

  async getThresholds(): Promise<{ warn_pct: number; full_pct: number }> {
    const warn_pct = await this.settings.getNumber(CAPACITY_WARN_THRESHOLD_PCT, 80);
    const full_pct = await this.settings.getNumber(CAPACITY_FULL_THRESHOLD_PCT, 100);
    return { warn_pct, full_pct };
  }

  async getCenterLimit(): Promise<number | null> {
    return this.settings.getOptionalNumber(CAPACITY_CENTER_MAX_SESSIONS_PER_DAY);
  }

  toRiyadhDateString(when: Date): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(when);
  }

  mapPctToState(pct: number, warnPct: number, fullPct: number): CapacityState {
    if (pct >= fullPct) return 'FULL';
    if (pct >= warnPct) return 'ALMOST_FULL';
    return 'AVAILABLE';
  }

  buildUtilization(
    level: UtilizationResult['level'],
    used: number,
    limit: number | null,
    thresholds: { warn_pct: number; full_pct: number },
    meta?: { id?: string; name?: string },
  ): UtilizationResult {
    if (limit == null || limit <= 0) {
      return {
        level,
        ...meta,
        used,
        limit: null,
        remaining: null,
        pct: 0,
        state: 'AVAILABLE',
      };
    }
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const remaining = Math.max(0, limit - used);
    return {
      level,
      ...meta,
      used,
      limit,
      remaining,
      pct,
      state: this.mapPctToState(pct, thresholds.warn_pct, thresholds.full_pct),
    };
  }

  async getUtilization(params: {
    date: string;
    doctorId?: string;
    roomId?: string;
    queryRunner?: QueryRunner;
  }): Promise<UtilizationResult> {
    const thresholds = await this.getThresholds();
    const { date, doctorId, roomId, queryRunner } = params;

    if (doctorId) {
      const doctor = await this.getDoctor(doctorId, queryRunner);
      const used = await this.countDoctorSessionsOnDate(
        doctorId,
        date,
        queryRunner,
      );
      return this.buildUtilization(
        'doctor',
        used,
        doctor?.max_sessions_per_day ?? null,
        thresholds,
        { id: doctorId, name: doctor?.name },
      );
    }

    if (roomId) {
      const room = await this.getRoom(roomId, queryRunner);
      const used = await this.getRoomPeakConcurrent(roomId, date, queryRunner);
      return this.buildUtilization(
        'room',
        used,
        room?.max_concurrent_sessions ?? 1,
        thresholds,
        { id: roomId, name: room?.name },
      );
    }

    const centerLimit = await this.getCenterLimit();
    const used = await this.countCenterSessionsOnDate(date, queryRunner);
    return this.buildUtilization('center', used, centerLimit, thresholds, {
      name: 'Center',
    });
  }

  async getOverview(date: string): Promise<CapacityOverview> {
    const thresholds = await this.getThresholds();
    const centerLimit = await this.getCenterLimit();
    const centerUsed = await this.countCenterSessionsOnDate(date);
    const center = this.buildUtilization(
      'center',
      centerUsed,
      centerLimit,
      thresholds,
      { name: 'Center' },
    );

    const doctors = await this.doctorsRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
    const doctorRows: UtilizationResult[] = [];
    for (const doctor of doctors) {
      const used = await this.countDoctorSessionsOnDate(doctor.id, date);
      doctorRows.push(
        this.buildUtilization(
          'doctor',
          used,
          doctor.max_sessions_per_day,
          thresholds,
          { id: doctor.id, name: doctor.name },
        ),
      );
    }

    const rooms = await this.roomsRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
    const roomRows: UtilizationResult[] = [];
    for (const room of rooms) {
      const used = await this.getRoomPeakConcurrent(room.id, date);
      roomRows.push(
        this.buildUtilization(
          'room',
          used,
          room.max_concurrent_sessions,
          thresholds,
          { id: room.id, name: room.name },
        ),
      );
    }

    return { date, thresholds, center, doctors: doctorRows, rooms: roomRows };
  }

  async assertBookingCapacity(params: AssertBookingParams): Promise<void> {
    const { doctorId, roomId, startsAt, durationMinutes, sessionId, queryRunner } =
      params;
    const date = this.toRiyadhDateString(startsAt);
    const endAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

    await queryRunner.query(`SELECT pg_advisory_xact_lock(3, hashtext($1))`, [date]);

    if (roomId) {
      await this.assertRoomConcurrency({
        roomId,
        startsAt,
        endAt,
        sessionId,
        queryRunner,
      });
    }

    if (doctorId) {
      await this.assertDoctorDailyCap({
        doctorId,
        date,
        sessionId,
        queryRunner,
      });
    }

    await this.assertCenterDailyCap({ date, sessionId, queryRunner });
  }

  async assertRoomConcurrency(args: {
    roomId: string;
    startsAt: Date;
    endAt: Date;
    sessionId?: string | null;
    queryRunner: QueryRunner;
  }): Promise<void> {
    const room = await this.getRoom(args.roomId, args.queryRunner);
    if (!room) return;

    const max = room.max_concurrent_sessions ?? 1;
    const overlapping = await this.countOverlappingRoomSessions(
      args.roomId,
      args.startsAt,
      args.endAt,
      args.queryRunner,
      args.sessionId,
    );

    if (overlapping >= max) {
      this.throwConflict('room_concurrency', {
        roomName: room.name,
        max,
        overlapping,
      });
    }
  }

  async assertDoctorDailyCap(args: {
    doctorId: string;
    date: string;
    sessionId?: string | null;
    queryRunner: QueryRunner;
  }): Promise<void> {
    const doctor = await this.getDoctor(args.doctorId, args.queryRunner);
    if (!doctor || doctor.max_sessions_per_day == null) return;

    const used = await this.countDoctorSessionsOnDate(
      args.doctorId,
      args.date,
      args.queryRunner,
      args.sessionId,
    );

    if (used >= doctor.max_sessions_per_day) {
      this.throwConflict('doctor_daily_cap', {
        doctorName: doctor.name,
        limit: doctor.max_sessions_per_day,
        used,
      });
    }
  }

  async assertCenterDailyCap(args: {
    date: string;
    sessionId?: string | null;
    queryRunner: QueryRunner;
  }): Promise<void> {
    const limit = await this.getCenterLimit();
    if (limit == null) return;

    const used = await this.countCenterSessionsOnDate(
      args.date,
      args.queryRunner,
      args.sessionId,
    );

    if (used >= limit) {
      this.throwConflict('center_daily_cap', { limit, used });
    }
  }

  async handlePostBookingAlerts(session: Session): Promise<void> {
    try {
      const date = this.toRiyadhDateString(new Date(session.session_date));
      await this.emitThresholdAlertsForOverview(await this.getOverview(date));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Capacity alert was not stored: ${message}`);
    }
  }

  /** Daily job: alert on projected utilization for a calendar date (e.g. tomorrow). */
  async emitProjectedThresholdAlerts(date: string): Promise<void> {
    try {
      await this.emitThresholdAlertsForOverview(await this.getOverview(date));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Projected capacity alert failed: ${message}`);
    }
  }

  private async emitThresholdAlertsForOverview(overview: CapacityOverview): Promise<void> {
    const thresholds = overview.thresholds;

    for (const util of overview.doctors) {
      if (util.limit == null) continue;
      const ref = `doctor:${util.id}:${overview.date}`;
      if (util.pct >= thresholds.full_pct) {
        await this.notifications.emit({
          type: NotificationType.DOCTOR_SCHEDULE_FULL,
          title: 'جدول الطبيب ممتلئ',
          message: `الطبيب ${util.name ?? ''} وصل للحد الأقصى (${util.used}/${util.limit}) في ${overview.date}.`,
          target_role: 'RECEPTIONIST',
          reference_id: ref,
        });
      } else if (util.pct >= thresholds.warn_pct) {
        await this.notifications.emit({
          type: NotificationType.CAPACITY_LIMIT_REACHED,
          title: 'تنبيه سعة الطبيب',
          message: `الطبيب ${util.name ?? ''} تجاوز ${thresholds.warn_pct}% من سعته (${util.used}/${util.limit}).`,
          target_role: 'ALL',
          reference_id: ref,
        });
      }
    }

    for (const util of overview.rooms) {
      if (util.limit == null) continue;
      const ref = `room:${util.id}:${overview.date}`;
      if (util.pct >= thresholds.warn_pct) {
        await this.notifications.emit({
          type: NotificationType.CAPACITY_LIMIT_REACHED,
          title: 'تنبيه سعة الغرفة',
          message: `الغرفة ${util.name ?? ''} عند ${util.pct}% من السعة (${util.used}/${util.limit}).`,
          target_role: 'ALL',
          reference_id: ref,
        });
      }
    }

    const center = overview.center;
    if (center.limit != null && center.pct >= thresholds.warn_pct) {
      await this.notifications.emit({
        type: NotificationType.CAPACITY_LIMIT_REACHED,
        title: 'تنبيه سعة المركز',
        message: `المركز عند ${center.pct}% من السعة اليومية (${center.used}/${center.limit}).`,
        target_role: 'ALL',
        reference_id: `center:${overview.date}`,
      });
    }
  }

  private async getDoctor(
    id: string,
    queryRunner?: QueryRunner,
  ): Promise<Doctor | null> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(Doctor)
      : this.doctorsRepo;
    return repo.findOne({ where: { id } });
  }

  private async getRoom(id: string, queryRunner?: QueryRunner): Promise<Room | null> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(Room)
      : this.roomsRepo;
    return repo.findOne({ where: { id } });
  }

  async countDoctorSessionsOnDate(
    doctorId: string,
    date: string,
    queryRunner?: QueryRunner,
    excludeSessionId?: string | null,
  ): Promise<number> {
    const qb = this.sessionQb(queryRunner)
      .andWhere('s.doctor_id = :doctorId', { doctorId })
      .andWhere(`DATE(timezone('Asia/Riyadh', s.session_date)) = :date`, { date });

    if (excludeSessionId) {
      qb.andWhere('s.id != :excludeSessionId', { excludeSessionId });
    }

    return qb.getCount();
  }

  async countCenterSessionsOnDate(
    date: string,
    queryRunner?: QueryRunner,
    excludeSessionId?: string | null,
  ): Promise<number> {
    const qb = this.sessionQb(queryRunner).andWhere(
      `DATE(timezone('Asia/Riyadh', s.session_date)) = :date`,
      { date },
    );

    if (excludeSessionId) {
      qb.andWhere('s.id != :excludeSessionId', { excludeSessionId });
    }

    return qb.getCount();
  }

  async countOverlappingRoomSessions(
    roomId: string,
    startsAt: Date,
    endAt: Date,
    queryRunner: QueryRunner,
    excludeSessionId?: string | null,
  ): Promise<number> {
    const qb = queryRunner.manager
      .createQueryBuilder(Session, 's')
      .where('s.room_id = :roomId', { roomId })
      .andWhere('s.status != :canceled', { canceled: SessionStatus.CANCELED })
      .andWhere('s.session_date < :endAt', { endAt })
      .andWhere(
        `s.session_date + (COALESCE(
          NULLIF(s.scheduled_duration_minutes, 0),
          CASE WHEN s.session_type = :assessment THEN 60 ELSE 45 END
        ) * INTERVAL '1 minute') > :startsAt`,
        { startsAt, assessment: SessionType.ASSESSMENT },
      );

    if (excludeSessionId) {
      qb.andWhere('s.id != :excludeSessionId', { excludeSessionId });
    }

    return qb.getCount();
  }

  async getRoomPeakConcurrent(
    roomId: string,
    date: string,
    queryRunner?: QueryRunner,
  ): Promise<number> {
    const sessions = await this.sessionQb(queryRunner)
      .andWhere('s.room_id = :roomId', { roomId })
      .andWhere(`DATE(timezone('Asia/Riyadh', s.session_date)) = :date`, { date })
      .getMany();

    if (sessions.length === 0) return 0;

    let peak = 0;
    for (const session of sessions) {
      const { start, end } = this.sessionBounds(session);
      let concurrent = 0;
      for (const other of sessions) {
        const bounds = this.sessionBounds(other);
        if (bounds.start < end && bounds.end > start) {
          concurrent += 1;
        }
      }
      peak = Math.max(peak, concurrent);
    }
    return peak;
  }

  private sessionBounds(session: Session): { start: Date; end: Date } {
    const start = new Date(session.session_date);
    const duration = SchedulingDuration(session);
    const end = new Date(start.getTime() + duration * 60_000);
    return { start, end };
  }

  private sessionQb(queryRunner?: QueryRunner) {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(Session)
      : this.sessionsRepo;
    return repo
      .createQueryBuilder('s')
      .where('s.status != :canceled', { canceled: SessionStatus.CANCELED });
  }

  private throwConflict(
    outcome: 'doctor_daily_cap' | 'room_concurrency' | 'center_daily_cap',
    ctx: Record<string, string | number | undefined>,
  ): never {
    this.logger.warn({ outcome, ...ctx });

    let message: { ar: string; en: string };
    switch (outcome) {
      case 'doctor_daily_cap':
        message = {
          ar: `الطبيب ${ctx.doctorName} وصل للحد الأقصى اليومي (${ctx.used}/${ctx.limit} جلسات)`,
          en: `Doctor ${ctx.doctorName} has reached the daily session limit (${ctx.used}/${ctx.limit})`,
        };
        break;
      case 'room_concurrency':
        message = {
          ar: `الغرفة ${ctx.roomName} وصلت للحد الأقصى للجلسات المتزامنة (${ctx.max})`,
          en: `Room ${ctx.roomName} is at maximum concurrent sessions (${ctx.max})`,
        };
        break;
      case 'center_daily_cap':
        message = {
          ar: `المركز وصل للحد الأقصى اليومي (${ctx.used}/${ctx.limit} جلسات)`,
          en: `The medical center has reached its daily session limit (${ctx.used}/${ctx.limit})`,
        };
        break;
    }

    throw new ConflictException({ message });
  }
}

function SchedulingDuration(session: Session): number {
  if (session.scheduled_duration_minutes != null && session.scheduled_duration_minutes > 0) {
    return session.scheduled_duration_minutes;
  }
  return session.session_type === SessionType.ASSESSMENT ? 60 : 45;
}
