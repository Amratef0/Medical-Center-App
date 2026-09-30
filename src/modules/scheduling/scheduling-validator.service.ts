import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { Session, SessionStatus, SessionType } from '../sessions/session.entity';
import { Patient } from '../patients/patient.entity';
import { Room } from '../rooms/room.entity';
import { ScheduleSlot } from './schedule-slot.entity';
import { CapacityService } from '../capacity/capacity.service';

export type ConflictOutcome = 'doctor_overlap' | 'room_overlap' | 'slot_full';

export interface AssertSlotIsBookableParams {
  /** Excluded from overlap checks when rescheduling. */
  sessionId?: string | null;
  doctorId?: string | null;
  roomId?: string | null;
  startsAt: Date;
  durationMinutes: number;
  slotId?: string | null;
  /** Prior slot on reschedule; when different from slotId, adjust booked_count. */
  previousSlotId?: string | null;
}

@Injectable()
export class SchedulingValidator {
  private readonly logger = new Logger(SchedulingValidator.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly capacityService: CapacityService,
  ) {}

  async runInTransaction<T>(work: (queryRunner: QueryRunner) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const result = await work(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  static resolveDurationMinutes(
    scheduledDurationMinutes: number | null | undefined,
    sessionType: SessionType | string,
  ): number {
    if (scheduledDurationMinutes != null && scheduledDurationMinutes > 0) {
      return scheduledDurationMinutes;
    }
    return sessionType === SessionType.ASSESSMENT ? 60 : 45;
  }

  async assertSlotIsBookable(
    params: AssertSlotIsBookableParams,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const {
      sessionId = null,
      doctorId = null,
      roomId = null,
      startsAt,
      durationMinutes,
      slotId = null,
      previousSlotId = null,
    } = params;

    const endAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

    // gstack-shortcut(dec-f9d79b2f-dff1-4904-ba71-6a8135324ce8): completeness 7/10, upgrade when deploying to Railway or when a write that skips the app can still double-book.
    if (doctorId) {
      await queryRunner.query(`SELECT pg_advisory_xact_lock(1, hashtext($1))`, [doctorId]);
    }
    if (roomId) {
      await queryRunner.query(`SELECT pg_advisory_xact_lock(2, hashtext($1))`, [roomId]);
    }

    // Two null doctor_ids / room_ids do not conflict; both null → no overlap conflict.
    if (doctorId) {
      const doctorConflict = await this.findOverlappingSession(
        queryRunner,
        {
          resourceColumn: 'doctor_id',
          resourceId: doctorId,
          startsAt,
          endAt,
          excludeSessionId: sessionId,
        },
      );
      if (doctorConflict) {
        this.throwConflict('doctor_overlap', {
          doctorId,
          roomId,
          sessionId,
          conflicting: doctorConflict,
          startsAt,
        });
      }
    }

    await this.capacityService.assertBookingCapacity({
      doctorId,
      roomId,
      startsAt,
      durationMinutes,
      sessionId,
      queryRunner,
    });

    // Slot capacity is independent and still enforced when slot_id is set.
    await this.applySlotCapacityChange(queryRunner, {
      slotId,
      previousSlotId,
      sessionId,
      doctorId,
      roomId,
    });
  }

  private async findOverlappingSession(
    queryRunner: QueryRunner,
    args: {
      resourceColumn: 'doctor_id' | 'room_id';
      resourceId: string;
      startsAt: Date;
      endAt: Date;
      excludeSessionId?: string | null;
    },
  ): Promise<Session | null> {
    // Lock the session row only. A left join under FOR UPDATE fails in Postgres
    // ("cannot be applied to the nullable side of an outer join").
    const qb = queryRunner.manager
      .createQueryBuilder(Session, 's')
      .setLock('pessimistic_write')
      .where(`s.${args.resourceColumn} = :resourceId`, { resourceId: args.resourceId })
      .andWhere('s.status != :canceled', { canceled: SessionStatus.CANCELED })
      // Half-open [session_date, session_date + duration)
      .andWhere('s.session_date < :endAt', { endAt: args.endAt })
      .andWhere(
        `s.session_date + (COALESCE(
          NULLIF(s.scheduled_duration_minutes, 0),
          CASE WHEN s.session_type = :assessment THEN 60 ELSE 45 END
        ) * INTERVAL '1 minute') > :startsAt`,
        { startsAt: args.startsAt, assessment: SessionType.ASSESSMENT },
      );

    if (args.excludeSessionId) {
      qb.andWhere('s.id != :excludeSessionId', {
        excludeSessionId: args.excludeSessionId,
      });
    }

    const session = await qb.getOne();
    if (!session) return null;

    if (session.patient_id) {
      const patient = await queryRunner.manager.findOne(Patient, {
        where: { id: session.patient_id },
      });
      if (patient) session.patient = patient;
    }
    if (session.room_id) {
      const room = await queryRunner.manager.findOne(Room, {
        where: { id: session.room_id },
      });
      if (room) session.room = room;
    }
    return session;
  }

  /**
   * Mirrors SchedulingService.bookSlot / cancelBooking booked_count + is_available
   * formula, but runs on the caller's QueryRunner so create/reschedule stay atomic.
   */
  private async applySlotCapacityChange(
    queryRunner: QueryRunner,
    args: {
      slotId?: string | null;
      previousSlotId?: string | null;
      sessionId?: string | null;
      doctorId?: string | null;
      roomId?: string | null;
    },
  ): Promise<void> {
    const { slotId, previousSlotId, sessionId, doctorId, roomId } = args;

    if (previousSlotId && previousSlotId !== slotId) {
      const oldSlot = await queryRunner.manager
        .createQueryBuilder(ScheduleSlot, 'slot')
        .setLock('pessimistic_write')
        .where('slot.id = :id', { id: previousSlotId })
        .getOne();

      if (oldSlot) {
        this.decrementBookedCount(oldSlot);
        await queryRunner.manager.save(oldSlot);
      }
    }

    if (!slotId) {
      return;
    }

    const slot = await queryRunner.manager
      .createQueryBuilder(ScheduleSlot, 'slot')
      .setLock('pessimistic_write')
      .where('slot.id = :id', { id: slotId })
      .getOne();

    if (!slot) {
      throw new NotFoundException('Schedule slot not found');
    }

    const alreadyCountedOnThisSlot = previousSlotId === slotId;
    if (!alreadyCountedOnThisSlot) {
      if (slot.booked_count >= slot.capacity) {
        this.throwConflict('slot_full', {
          doctorId: doctorId ?? null,
          roomId: roomId ?? null,
          sessionId: sessionId ?? null,
          startsAt: slot.start_time,
        });
      }
      this.incrementBookedCount(slot);
      await queryRunner.manager.save(slot);
    }
  }

  /** Same formula as SchedulingService.bookSlot */
  private incrementBookedCount(slot: ScheduleSlot): void {
    slot.booked_count += 1;
    if (slot.booked_count >= slot.capacity) {
      slot.is_available = false;
    }
  }

  /** Same formula as SchedulingService.cancelBooking */
  private decrementBookedCount(slot: ScheduleSlot): void {
    if (slot.booked_count <= 0) {
      return;
    }
    slot.booked_count -= 1;
    if (slot.booked_count < slot.capacity) {
      slot.is_available = true;
    }
  }

  private throwConflict(
    outcome: ConflictOutcome,
    ctx: {
      doctorId?: string | null;
      roomId?: string | null;
      sessionId?: string | null;
      conflicting?: Session | null;
      startsAt: Date;
      roomName?: string;
    },
  ): never {
    this.logger.warn({
      doctorId: ctx.doctorId ?? null,
      roomId: ctx.roomId ?? null,
      sessionId: ctx.sessionId ?? null,
      outcome,
    });

    const clock = this.formatClock(ctx.conflicting?.session_date ?? ctx.startsAt);
    const message = this.buildMessage(outcome, {
      clock,
      roomName: ctx.roomName ?? ctx.conflicting?.room?.name,
      patientName: this.patientDisplayName(ctx.conflicting),
    });

    // Nest replaces the whole response when given an object; keep `message` as { ar, en }.
    throw new ConflictException({ message });
  }

  private buildMessage(
    outcome: ConflictOutcome,
    details: { clock: string; roomName?: string; patientName?: string },
  ): { ar: string; en: string } {
    const patientAr = details.patientName ? ` للمريض ${details.patientName}` : '';
    const patientEn = details.patientName ? ` (patient: ${details.patientName})` : '';
    const roomAr = details.roomName || 'الغرفة';
    const roomEn = details.roomName || 'the room';

    switch (outcome) {
      case 'doctor_overlap':
        return {
          ar: `الطبيب لديه جلسة أخرى في الساعة ${details.clock}${patientAr}`,
          en: `Doctor already has another session at ${details.clock}${patientEn}`,
        };
      case 'room_overlap':
        return {
          ar: `${roomAr} مشغولة في الساعة ${details.clock}${patientAr}`,
          en: `${roomEn} is occupied at ${details.clock}${patientEn}`,
        };
      case 'slot_full':
        return {
          ar: `الموعد ممتلئ ولا يمكن حجز مقعد إضافي في الساعة ${details.clock}`,
          en: `This schedule slot is full and cannot accept another booking at ${details.clock}`,
        };
    }
  }

  private patientDisplayName(session?: Session | null): string | undefined {
    if (!session?.patient) return undefined;
    const p = session.patient;
    const name =
      p.full_name_ar?.trim() ||
      [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    return name || undefined;
  }

  private formatClock(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Riyadh',
    }).format(date);
  }
}
